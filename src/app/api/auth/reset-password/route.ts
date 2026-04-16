import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { hashPasswordResetToken } from "@/lib/auth/reset-token";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const E = {
  badInput:
    "\uc785\ub825\uc744 \ud655\uc778\ud574 \uc8fc\uc138\uc694. \ube44\ubc00\ubc88\ud638\ub294 8\uc790 \uc774\uc0c1\uc774\uc5b4\uc57c \ud569\ub2c8\ub2e4.",
  token:
    "\ub9c1\ud06c\uac00 \ub9cc\ub8cc\ub418\uc5c8\uac70\ub098 \uc774\ubbf8 \uc0ac\uc6a9\ub418\uc5c8\uc2b5\ub2c8\ub2e4. \ub2e4\uc2dc \ube44\ubc00\ubc88\ud638 \ucc3e\uae30\ub97c \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.",
  server:
    "\ucc98\ub9ac \uc911 \uc624\ub958\uac00 \ub0ac\uc2b5\ub2c8\ub2e4. \uc7a0\uc2dc \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.",
  prisma:
    "\uc11c\ubc84 \uc778\uc99d \uc124\uc815\uc744 \uc5c5\ub370\uc774\ud2b8 \uc911\uc785\ub2c8\ub2e4. \uc7a0\uc2dc \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.",
} as const;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { token?: string; password?: string };
    const rawToken = String(body.token ?? "").trim();
    const password = String(body.password ?? "");

    if (!rawToken || password.length < 8) {
      return NextResponse.json({ error: E.badInput }, { status: 400 });
    }

    const resetModel = (prisma as { passwordResetToken?: unknown })
      .passwordResetToken;
    if (!resetModel) {
      return NextResponse.json({ error: E.prisma }, { status: 500 });
    }

    const tokenHash = hashPasswordResetToken(rawToken);
    const row = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    const now = new Date();
    if (!row || row.usedAt || row.expiresAt <= now) {
      return NextResponse.json({ error: E.token }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: row.userId },
        data: { passwordHash },
      });
      await tx.passwordResetToken.deleteMany({
        where: { userId: row.userId },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[auth/reset-password]", e);
    return NextResponse.json({ error: E.server }, { status: 500 });
  }
}
