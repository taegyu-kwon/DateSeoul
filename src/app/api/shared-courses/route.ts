import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { parseCourseJson } from "@/lib/parse-course-json";
import { recordPlaceVisitsFromCourse } from "@/lib/place-visit";
import { prisma } from "@/lib/prisma";
import type { DateCourse } from "@/types/course";

export const runtime = "nodejs";

const E = {
  needLogin: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.",
  badRequest: "\uC798\uBABB\uB41C \uC694\uCCAD\uC785\uB2C8\uB2E4.",
  noCourseData: "\uCF54\uC2A4 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
  badShape:
    "\uCF54\uC2A4 \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
} as const;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(searchParams.get("limit") ?? "50", 10) || 50)
  );

  const user = await getSession();

  const rows = await prisma.sharedCourse.findMany({
    take: limit,
    orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      likeCount: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  let likedIds = new Set<string>();
  if (user && rows.length > 0) {
    const likes = await prisma.courseLike.findMany({
      where: {
        userId: user.id,
        sharedCourseId: { in: rows.map((r) => r.id) },
      },
      select: { sharedCourseId: true },
    });
    likedIds = new Set(likes.map((l) => l.sharedCourseId));
  }

  return NextResponse.json({
    items: rows.map((r, index) => ({
      rank: index + 1,
      id: r.id,
      title: r.title,
      likeCount: r.likeCount,
      createdAt: r.createdAt.toISOString(),
      authorName: r.user.name,
      liked: user ? likedIds.has(r.id) : false,
    })),
  });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: E.needLogin }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: E.badRequest }, { status: 400 });
  }

  const courseRaw =
    body && typeof body === "object" && body !== null && "course" in body
      ? (body as { course: unknown }).course
      : null;

  if (!courseRaw || typeof courseRaw !== "object") {
    return NextResponse.json({ error: E.noCourseData }, { status: 400 });
  }

  let course: DateCourse;
  try {
    course = parseCourseJson(JSON.stringify(courseRaw));
  } catch {
    return NextResponse.json({ error: E.badShape }, { status: 400 });
  }

  const title =
    course.course_title.trim().slice(0, 500) ||
    "\uACF5\uC720 \uCF54\uC2A4";
  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.sharedCourse.create({
      data: {
        userId: user.id,
        title,
        courseJson: JSON.stringify(course),
      },
      select: { id: true, title: true, createdAt: true },
    });
    await recordPlaceVisitsFromCourse(tx, course);
    return created;
  });

  return NextResponse.json({
    id: row.id,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
  });
}
