import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
    };
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "\uc774\uba54\uc77c, \ube44\ubc00\ubc88\ud638, \uc774\ub984\uc744 \ubaa8\ub450 \uc785\ub825\ud574 \uc8fc\uc138\uc694." },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "\uc774\uba54\uc77c \ud615\uc2dd\uc774 \uc62c\ubc14\ub974\uc9c0 \uc54a\uc544\uc694." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "\ube44\ubc00\ubc88\ud638\ub294 8\uc790 \uc774\uc0c1\uc774\uc5b4\uc57c \ud574\uc694." },
        { status: 400 }
      );
    }
    if (name.length < 2) {
      return NextResponse.json(
        { error: "\uc774\ub984\uc740 2\uc790 \uc774\uc0c1 \uc785\ub825\ud574 \uc8fc\uc138\uc694." },
        { status: 400 }
      );
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: "\uc774\ubbf8 \uac00\uc785\ub41c \uc774\uba54\uc77c\uc774\uc5d0\uc694." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });

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
    console.error("[auth/register]", e);
    return NextResponse.json(
      { error: "\uac00\uc785 \ucc98\ub9ac \uc911 \uc624\ub958\uac00 \ub0ac\uc5b4\uc694. \uc7a0\uc2dc \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694." },
      { status: 500 }
    );
  }
}
