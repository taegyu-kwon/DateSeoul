import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { parseCourseJson } from "@/lib/parse-course-json";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const E = {
  badRequest: "\uC798\uBABB\uB41C \uC694\uCCAD\uC785\uB2C8\uB2E4.",
  notFound: "\uCF54\uC2A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
  readFail:
    "\uC800\uC7A5\uB41C \uB370\uC774\uD130\uB97C \uC77D\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
} as const;

export async function GET(
  _req: Request,
  ctx: { params: { id: string } }
) {
  const { id } = ctx.params;
  if (!id) {
    return NextResponse.json({ error: E.badRequest }, { status: 400 });
  }

  const row = await prisma.sharedCourse.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      courseJson: true,
      likeCount: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  if (!row) {
    return NextResponse.json({ error: E.notFound }, { status: 404 });
  }

  let course;
  try {
    course = parseCourseJson(row.courseJson);
  } catch {
    return NextResponse.json({ error: E.readFail }, { status: 500 });
  }

  const user = await getSession();
  let liked = false;
  if (user) {
    const like = await prisma.courseLike.findUnique({
      where: {
        userId_sharedCourseId: { userId: user.id, sharedCourseId: id },
      },
    });
    liked = !!like;
  }

  return NextResponse.json({
    course,
    meta: {
      id: row.id,
      title: row.title,
      likeCount: row.likeCount,
      createdAt: row.createdAt.toISOString(),
      authorName: row.user.name,
      liked,
    },
  });
}
