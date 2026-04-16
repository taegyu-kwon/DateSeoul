import Anthropic from "@anthropic-ai/sdk";
import { APIError } from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
  COURSE_KEYWORD_BLOCKED_MESSAGE,
  isCourseKeywordBlocked,
} from "@/lib/keyword-policy";
import { parseCourseJson } from "@/lib/parse-course-json";
import { type GenerateCourseRequest, isDateStyle } from "@/types/course";

const KEYWORD_MAX = 200;

const SYSTEM_PROMPT = `You are an expert Seoul date-course planner. Using the user's budget, anchor area, time of day (morning / afternoon / full day), optional date style, and optional free-text keyword, respond with ONLY valid JSON for a realistic, specific itinerary.

Rules:
- Recommend only real places in Seoul.
- FACTUAL ACCURACY (non-negotiable): For every spot, name, category, description, and tip must match what that real business actually is. Do not guess cuisine, "specialty", ethnic labels, or signature dishes from the name alone. Never assign a trendy wrong category (e.g. Malatang, lamb skewers, hotpot) to a venue that is not that concept—especially well-known chains or landmark restaurants: describe only their true, widely known offering. If you are not fully confident about a named place, choose a different real venue you are sure about, or write a conservative generic line (e.g. neighborhood, meal occasion, vibe) without false specifics—never plausible-sounding but incorrect details.
- Addresses and lat/lng must correspond to the named venue in Seoul; text must not contradict the venue's real concept.
- Budget is total for the requested headcount; do not exceed it.
- 3–5 spots.
- If time_of_day is full day, the route should sensibly cover through the afternoon.
- If a date style is given, prioritize it in spot choices and in course_vibe.
- If the user provides a keyword, treat it as a strong hint: it may name a landmark, neighborhood nickname, food or activity type, mood, or slang about intensity (e.g. a "packed" day). Reflect it clearly in course_title, course_vibe, spot choices, descriptions, and tips. If it clearly points to a real Seoul place or micro-area, bias stops and the route toward that place while staying within budget; if it only expresses pacing or intensity, adjust total_duration_hours, duration_minutes per stop, and how tight the schedule feels—without breaking the budget or inventing impossible logistics.
- Keywords must be wholesome and suitable for a public daytime/evening date. Never plan around sexual content, adult venues, or illegal activity. If a keyword implies that, ignore the keyword and output a normal family-friendly itinerary.
- Anchor the course to the user's chosen area: most spots should sit in that district and its immediate surroundings; do not center the day on a far-away borough without a strong, explicit reason. When keyword and anchor conflict, prefer satisfying the keyword's place or theme when it names a specific Seoul location; otherwise blend both.
- course_title must NOT be a formula like "[District] departure …" or "[District] date". Write one vivid, specific line (landmarks, walking strips, riverside, market streets, neighborhood vibe). Mention the district name only when it reads naturally.
- For each spot, address should look locally grounded (road name, dong, nearby cue) so the user can tell it matches the chosen area.
- Keep geography tight and walking/transit-realistic.
- Use accurate lat/lng.
- Output JSON only—no prose outside the object.
- category must be exactly one of: "\uce74\ud398" | "\uc2dd\ub2f9" | "\uc561\ud2f0\ube44\ud2f0" | "\ubb38\ud654" | "\uc1fc\ud551" (use these Korean labels exactly).

Schema:
{
  "course_title": string,
  "total_estimated_cost": number,
  "total_duration_hours": number,
  "spots": [
    {
      "order": number,
      "name": string,
      "category": "\uce74\ud398" | "\uc2dd\ub2f9" | "\uc561\ud2f0\ube44\ud2f0" | "\ubb38\ud654" | "\uc1fc\ud551",
      "address": string,
      "estimated_cost_per_person": number,
      "duration_minutes": number,
      "description": string,
      "lat": number,
      "lng": number,
      "tip": string
    }
  ],
  "budget_breakdown": { "food": number, "activity": number, "transport": number },
  "course_vibe": string
}`;

export const runtime = "nodejs";
export const maxDuration = 60;

const ERR_GENERIC = "\ucf54\uc2a4 \uc0dd\uc131 \uc911 \uc624\ub958\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4.";
const ERR_CREDIT =
  "Anthropic \uacc4\uc815 \ud06c\ub808\ub527\uc774 \ubd80\uc871\ud569\ub2c8\ub2e4. console.anthropic.com \u2192 Plans & Billing\uc5d0\uc11c \ud06c\ub808\ub527\uc744 \ucda9\uc804\ud558\uac70\ub098 \uc694\uae08\uc81c\ub97c \ud655\uc778\ud574 \uc8fc\uc138\uc694.";
const ERR_401 =
  "API \ud0a4\uac00 \uc62c\ubc14\ub974\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4. .env.local\uc758 ANTHROPIC_API_KEY\ub97c \ud655\uc778\ud574 \uc8fc\uc138\uc694.";
const ERR_429 =
  "\uc694\uccad\uc774 \ub108\ubb34 \ub9ce\uc2b5\ub2c8\ub2e4. \uc7a0\uc2dc \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.";
const ERR_NO_KEY = "ANTHROPIC_API_KEY\uac00 \uc124\uc815\ub418\uc9c0 \uc54a\uc558\uc2b5\ub2c8\ub2e4.";
const ERR_BAD_JSON = "\uc798\ubabb\ub41c \uc694\uccad\uc785\ub2c8\ub2e4.";
const ERR_BAD_INPUT = "\uc785\ub825\uac12\uc744 \ud655\uc778\ud574 \uc8fc\uc138\uc694.";
const STYLE_PREFIX = "\ub370\uc774\ud2b8 \uc2a4\ud0c0\uc77c(\uc6b0\uc120 \ubc18\uc601): ";
const ERR_AI_FORMAT = "AI \uc751\ub2f5 \ud615\uc2dd\uc744 \ucc98\ub9ac\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.";
const ERR_PARSE_FAIL =
  "\ucf54\uc2a4 \ub370\uc774\ud130\ub97c \ud574\uc11d\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4. \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.";

function userFacingAnthropicError(e: unknown): string {
  if (!(e instanceof APIError)) {
    return ERR_GENERIC;
  }
  const msg = e.message ?? "";
  if (/credit balance is too low/i.test(msg)) {
    return ERR_CREDIT;
  }
  if (e.status === 401) {
    return ERR_401;
  }
  if (e.status === 429) {
    return ERR_429;
  }
  return ERR_GENERIC;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: ERR_NO_KEY }, { status: 500 });
  }

  let body: GenerateCourseRequest;
  try {
    body = (await req.json()) as GenerateCourseRequest;
  } catch {
    return NextResponse.json({ error: ERR_BAD_JSON }, { status: 400 });
  }

  const { budget, location, time_of_day, people_count, date_style, keyword } =
    body;

  const keywordTrimmed =
    typeof keyword === "string"
      ? keyword.trim().slice(0, KEYWORD_MAX)
      : "";

  if (keywordTrimmed.length > 0 && isCourseKeywordBlocked(keywordTrimmed)) {
    return NextResponse.json(
      { error: COURSE_KEYWORD_BLOCKED_MESSAGE },
      { status: 400 }
    );
  }

  if (
    typeof budget !== "number" ||
    budget <= 0 ||
    typeof location !== "string" ||
    !location.trim() ||
    (time_of_day !== "\uc624\uc804" &&
      time_of_day !== "\uc624\ud6c4" &&
      time_of_day !== "\uc885\uc77c") ||
    typeof people_count !== "number" ||
    people_count < 1
  ) {
    return NextResponse.json({ error: ERR_BAD_INPUT }, { status: 400 });
  }

  if (date_style != null && !isDateStyle(date_style)) {
    return NextResponse.json({ error: ERR_BAD_INPUT }, { status: 400 });
  }

  const styleNote =
    date_style && isDateStyle(date_style)
      ? `\n${STYLE_PREFIX}${date_style}`
      : "";

  const loc = location.trim();
  const keywordBlock =
    keywordTrimmed.length > 0
      ? `\nUser keyword (follow closely): ${keywordTrimmed}`
      : "";

  const userMessage = `Budget (KRW, total for party): ${budget}
Headcount: ${people_count}
Time of day: ${time_of_day}
Course anchor area (start here and keep the day centered on this neighborhood/district): ${loc}${styleNote}${keywordBlock}

Ground most stops in "${loc}" and adjacent blocks. The route and addresses should make it obvious why this area was chosen. Avoid generic titles that only pair the district name with words like "\ucd9c\ubc1c" (departure) or "\ub370\uc774\ud2b8" without local flavor.

Every spot description and tip must be factually correct for that business (correct cuisine and concept). Wrong or invented specialties are not acceptable.

Return ONLY the JSON object.`;

  const anthropic = new Anthropic({ apiKey });

  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = msg.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: ERR_AI_FORMAT }, { status: 502 });
    }

    let course;
    try {
      course = parseCourseJson(textBlock.text);
    } catch {
      return NextResponse.json({ error: ERR_PARSE_FAIL }, { status: 502 });
    }

    return NextResponse.json(course);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: userFacingAnthropicError(e) },
      { status: 500 }
    );
  }
}
