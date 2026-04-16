import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const E = {
  needLogin: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.",
  badRequest: "\uC798\uBABB\uB41C \uC694\uCCAD\uC785\uB2C8\uB2E4.",
  notFound: "\uCF54\uC2A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
} as const;

export async function POST(
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

  const result = await prisma.$transaction(async (tx) => {
    const shared = await tx.sharedCourse.findUnique({ where: { id } });
    if (!shared) return null;

    const existing = await tx.courseLike.findUnique({
      where: {
        userId_sharedCourseId: { userId: user.id, sharedCourseId: id },
      },
    });

    if (existing) {
      await tx.courseLike.delete({ where: { id: existing.id } });
      const next = Math.max(0, shared.likeCount - 1);
      await tx.sharedCourse.update({
        where: { id },
        data: { likeCount: next },
      });
      return { liked: false, likeCount: next } as const;
    }

    await tx.courseLike.create({
      data: { userId: user.id, sharedCourseId: id },
    });
    const next = shared.likeCount + 1;
    await tx.sharedCourse.update({
      where: { id },
      data: { likeCount: next },
    });
    return { liked: true, likeCount: next } as const;
  });

  if (!result) {
    return NextResponse.json({ error: E.notFound }, { status: 404 });
  }

  return NextResponse.json(result);
}
