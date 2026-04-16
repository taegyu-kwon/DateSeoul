"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { safeNextPath } from "@/lib/safe-next-path";
import { cn } from "@/lib/utils";

const MSG = {
  title: "\ube44\ubc00\ubc88\ud638 \ucc3e\uae30",
  desc: "\uac00\uc785\ud55c \uc774\uba54\uc77c\uc744 \uc785\ub825\ud558\uba74 \uc7ac\uc124\uc815 \ub9c1\ud06c\ub97c \ubcf4\ub0c5\ub2c8\ub2e4.",
  email: "\uc774\uba54\uc77c",
  submit: "\ub9c1\ud06c \ubcf4\ub0b4\uae30",
  loading: "\ucc98\ub9ac \uc911\u2026",
  backLogin: "\ub85c\uadf8\uc778\uc73c\ub85c",
  generic: "\uc624\ub958\uac00 \ub0ac\uc5b4\uc694.",
  devHint:
    "\uac1c\ubc1c \ubaa8\ub4dc: \uc774\uba54\uc77c \ubbf8\uc124\uc815 \uc2dc \uc544\ub798 \ub9c1\ud06c\ub85c \uc9c1\uc811 \uc7ac\uc124\uc815\ud560 \uc218 \uc788\uc5b4\uc694.",
} as const;

function ForgotForm() {
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const loginHref =
    nextPath !== "/"
      ? `/login?next=${encodeURIComponent(nextPath)}`
      : "/login";

  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDevUrl(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, next: nextPath }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        devPreviewUrl?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || MSG.generic);
      }
      setMessage(data.message ?? null);
      if (data.devPreviewUrl) setDevUrl(data.devPreviewUrl);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : MSG.generic);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh min-h-screen bg-background px-[max(1rem,env(safe-area-inset-left))] pb-[max(2.5rem,env(safe-area-inset-bottom))] pe-[max(1rem,env(safe-area-inset-right))] pt-6 md:px-4 md:pb-16 md:pt-8">
      <div className="mx-auto max-w-lg md:max-w-xl">
        <Card className="border-0 shadow-md shadow-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{MSG.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{MSG.desc}</p>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-foreground">
                  {message}
                </p>
                {devUrl ? (
                  <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/10 p-3 text-xs">
                    <p className="mb-2 text-amber-900 dark:text-amber-100">
                      {MSG.devHint}
                    </p>
                    <a
                      href={devUrl}
                      className="break-all font-mono text-[11px] text-[#FF6B6B] underline underline-offset-2"
                    >
                      {devUrl}
                    </a>
                  </div>
                ) : null}
                <Link
                  href={loginHref}
                  className={cn(
                    buttonVariants(),
                    "inline-flex h-11 w-full items-center justify-center rounded-xl font-semibold"
                  )}
                >
                  {MSG.backLogin}
                </Link>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={submit}>
                <div className="space-y-2">
                  <Label htmlFor="email">{MSG.email}</Label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                {error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl font-semibold shadow-md shadow-[#FF6B6B]/25"
                  disabled={loading}
                >
                  {loading ? MSG.loading : MSG.submit}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  <Link
                    href={loginHref}
                    className={cn(
                      "font-medium text-[#FF6B6B] underline-offset-2 hover:underline"
                    )}
                  >
                    {MSG.backLogin}
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          {MSG.loading}
        </div>
      }
    >
      <ForgotForm />
    </Suspense>
  );
}
