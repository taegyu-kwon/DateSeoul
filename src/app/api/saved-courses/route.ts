import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { parseCourseJson } from "@/lib/parse-course-json";
import { recordPlaceVisitsFromCourse } from "@/lib/place-visit";
import { prisma } from "@/lib/prisma";
import type { DateCourse } from "@/types/course";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const rows = await prisma.savedCourse.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  });

  return NextResponse.json({
    courses: rows.map((r) => ({
      id: r.id,
      title: r.title,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const courseRaw =
    body && typeof body === "object" && body !== null && "course" in body
      ? (body as { course: unknown }).course
      : null;

  if (!courseRaw || typeof courseRaw !== "object") {
    return NextResponse.json({ error: "코스 데이터가 없습니다." }, { status: 400 });
  }

  let course: DateCourse;
  try {
    course = parseCourseJson(JSON.stringify(courseRaw));
  } catch {
    return NextResponse.json(
      { error: "코스 형식이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const title = course.course_title.trim().slice(0, 500) || "저장한 코스";
  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.savedCourse.create({
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
