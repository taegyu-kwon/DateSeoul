import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { parseCourseJson } from "@/lib/parse-course-json";
import { prisma } from "@/lib/prisma";
import type { DateCourse } from "@/types/course";

export const runtime = "nodejs";

const E = {
  needLogin: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.",
  badRequest: "\uC798\uBABB\uB41C \uC694\uCCAD\uC785\uB2C8\uB2E4.",
  notFound: "\uCF54\uC2A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
  readFail:
    "\uC800\uC7A5\uB41C \uB370\uC774\uD130\uB97C \uC77D\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
  needTitle: "\uC81C\uBAA9\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.",
} as const;

export async function GET(
  _req: Request,
  ctx: { params: { id: string } }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: E.needLogin }, { status: 401 });
  }

  const { id } = ctx.params;
  if (!id) {
    return NextResponse.json({ error: E.badRequest }, { status: 400 });
  }

  const row = await prisma.savedCourse.findFirst({
    where: { id, userId: user.id },
  });

  if (!row) {
    return NextResponse.json({ error: E.notFound }, { status: 404 });
  }

  try {
    const course = parseCourseJson(row.courseJson);
    return NextResponse.json({ course });
  } catch {
    return NextResponse.json({ error: E.readFail }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: { id: string } }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: E.needLogin }, { status: 401 });
  }

  const { id } = ctx.params;
  if (!id) {
    return NextResponse.json({ error: E.badRequest }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: E.badRequest }, { status: 400 });
  }

  const titleRaw =
    body && typeof body === "object" && body !== null && "title" in body
      ? String((body as { title: unknown }).title ?? "").trim()
      : "";
  if (!titleRaw) {
    return NextResponse.json({ error: E.needTitle }, { status: 400 });
  }
  const title = titleRaw.slice(0, 500);

  const row = await prisma.savedCourse.findFirst({
    where: { id, userId: user.id },
  });
  if (!row) {
    return NextResponse.json({ error: E.notFound }, { status: 404 });
  }

  let course: DateCourse;
  try {
    course = parseCourseJson(row.courseJson);
  } catch {
    return NextResponse.json({ error: E.readFail }, { status: 500 });
  }

  const updatedCourse: DateCourse = { ...course, course_title: title };
  await prisma.savedCourse.update({
    where: { id },
    data: { title, courseJson: JSON.stringify(updatedCourse) },
  });

  return NextResponse.json({ course: updatedCourse });
}

export async function DELETE(
  _req: Request,
  ctx: { params: { id: string } }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: E.needLogin }, { status: 401 });
  }

  const { id } = ctx.params;
  if (!id) {
    return NextResponse.json({ error: E.badRequest }, { status: 400 });
  }

  const result = await prisma.savedCourse.deleteMany({
    where: { id, userId: user.id },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: E.notFound }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
