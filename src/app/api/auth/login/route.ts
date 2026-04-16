import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "\uc774\uba54\uc77c\uacfc \ube44\ubc00\ubc88\ud638\ub97c \uc785\ub825\ud574 \uc8fc\uc138\uc694." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "\uc774\uba54\uc77c \ub610\ub294 \ube44\ubc00\ubc88\ud638\uac00 \uc62c\ubc14\ub974\uc9c0 \uc54a\uc544\uc694." },
        { status: 401 }
      );
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "\uc774\uba54\uc77c \ub610\ub294 \ube44\ubc00\ubc88\ud638\uac00 \uc62c\ubc14\ub974\uc9c0 \uc54a\uc544\uc694." },
        { status: 401 }
      );
    }

    const token = await signSession({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    const res = NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (e) {
    if (e instanceof Error && e.message.includes("AUTH_SECRET")) {
      return NextResponse.json(
        { error: "\uc11c\ubc84 \uc124\uc815(AUTH_SECRET)\uc774 \uc5c6\uc5b4\uc694. .env.local\uc744 \ud655\uc778\ud574 \uc8fc\uc138\uc694." },
        { status: 500 }
      );
    }
    console.error("[auth/login]", e);
    return NextResponse.json(
      { error: "\ub85c\uadf8\uc778 \ucc98\ub9ac \uc911 \uc624\ub958\uac00 \ub0ac\uc5b4\uc694." },
      { status: 500 }
    );
  }
}
