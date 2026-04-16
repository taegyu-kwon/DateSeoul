import type { DateCourse } from "@/types/course";

function stripCodeFence(raw: string): string {
  let s = raw.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/im.exec(s);
  if (fence) {
    return fence[1].trim();
  }
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*\n?/, "");
    s = s.replace(/\n?```\s*$/, "");
  }
  return s.trim();
}

function extractJsonObject(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("JSON_OBJECT_NOT_FOUND");
  }
  return raw.slice(start, end + 1);
}

export function parseCourseJson(raw: string): DateCourse {
  const cleaned = stripCodeFence(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    try {
      parsed = JSON.parse(extractJsonObject(cleaned));
    } catch {
      throw new Error("JSON_PARSE_FAILED");
    }
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("INVALID_COURSE_SHAPE");
  }

  const o = parsed as Record<string, unknown>;
  if (
    typeof o.course_title !== "string" ||
    typeof o.total_estimated_cost !== "number" ||
    typeof o.total_duration_hours !== "number" ||
    !Array.isArray(o.spots) ||
    typeof o.course_vibe !== "string" ||
    !o.budget_breakdown ||
    typeof o.budget_breakdown !== "object"
  ) {
    throw new Error("INVALID_COURSE_SHAPE");
  }

  return parsed as DateCourse;
}
