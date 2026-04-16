import { NextResponse } from "next/server";
import { getPublicBaseUrl } from "@/lib/auth/public-base-url";
import { safeNextPath } from "@/lib/safe-next-path";
import {
  generatePasswordResetRawToken,
  hashPasswordResetToken,
} from "@/lib/auth/reset-token";
import { sendPasswordResetEmail } from "@/lib/auth/send-password-reset-email";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RESET_TTL_MS = 60 * 60 * 1000;
const PRISMA_SYNC_ERROR =
  "\uc11c\ubc84 \uc778\uc99d \uc124\uc815\uc744 \uc5c5\ub370\uc774\ud2b8 \uc911\uc785\ub2c8\ub2e4. \uc7a0\uc2dc \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.";

/** Same message whether or not the email exists (do not leak accounts). */
const PUBLIC_MESSAGE =
  "\ub4f1\ub85d\ub41c \uc774\uba54\uc77c\uc774 \uc788\uc73c\uba74 \ube44\ubc00\ubc88\ud638 \uc7ac\uc124\uc815 \ub9c1\ud06c\ub97c \ubcf4\ub0c8\uc2b5\ub2c8\ub2e4. \uba54\uc77c\uc774 \uc5c6\uc73c\uba74 \uc190\ub2d8\uc758 \uc8fc\uc18c\ub85c \ub3c4\ucc29\ud560 \ub54c\uae4c\uc9c0 \uc2dc\uac04\uc774 \uc904\uc5b4\ub4e4 \uc218 \uc788\uc2b5\ub2c8\ub2e4.";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; next?: string };
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: true, message: PUBLIC_MESSAGE });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ ok: true, message: PUBLIC_MESSAGE });
    }

    const resetModel = (prisma as { passwordResetToken?: unknown })
      .passwordResetToken;
    if (!resetModel) {
      return NextResponse.json({ error: PRISMA_SYNC_ERROR }, { status: 500 });
    }

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    const raw = generatePasswordResetRawToken();
    const tokenHash = hashPasswordResetToken(raw);
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    });

    const base = getPublicBaseUrl(req);
    const nextPath = safeNextPath(body.next);
    const nextQs =
      nextPath !== "/"
        ? `&next=${encodeURIComponent(nextPath)}`
        : "";
    const resetUrl = `${base}/reset-password?token=${encodeURIComponent(raw)}${nextQs}`;

    const send = await sendPasswordResetEmail(user.email, resetUrl);

    const payload: {
      ok: true;
      message: string;
      devPreviewUrl?: string;
    } = { ok: true, message: PUBLIC_MESSAGE };

    if (send.ok && send.devPreviewUrl) {
      payload.devPreviewUrl = send.devPreviewUrl;
    }
    if (!send.ok) {
      console.error("[auth/forgot-password] email send failed:", send.reason);
    }

    return NextResponse.json(payload);
  } catch (e) {
    console.error("[auth/forgot-password]", e);
    return NextResponse.json(
      {
        error:
          "\uc694\uccad\uc744 \ucc98\ub9ac\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4. \uc7a0\uc2dc \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.",
      },
      { status: 500 }
    );
  }
}
