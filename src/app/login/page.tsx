"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { safeNextPath } from "@/lib/safe-next-path";
import { cn } from "@/lib/utils";

const MSG = {
  title: "\ub85c\uadf8\uc778",
  email: "\uc774\uba54\uc77c",
  pwd: "\ube44\ubc00\ubc88\ud638",
  loading: "\ucc98\ub9ac \uc911\u2026",
  submit: "\ub85c\uadf8\uc778",
  noAccount: "\uacc4\uc815\uc774 \uc5c6\ub098\uc694?",
  signup: "\ud68c\uc6d0\uac00\uc785",
  fail: "\ub85c\uadf8\uc778\uc5d0 \uc2e4\ud328\ud588\uc5b4\uc694.",
  generic: "\uc624\ub958\uac00 \ub0ac\uc5b4\uc694.",
  forgot: "\ube44\ubc00\ubc88\ud638\ub97c \uc78a\uc73c\uc168\ub098\uc694?",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || MSG.fail);
      }
      router.push(nextPath);
      router.refresh();
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
          </CardHeader>
          <CardContent>
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
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <Label htmlFor="password">{MSG.pwd}</Label>
                  <Link
                    href={
                      nextPath !== "/"
                        ? `/forgot-password?next=${encodeURIComponent(nextPath)}`
                        : "/forgot-password"
                    }
                    className="text-xs font-medium text-[#FF6B6B] underline-offset-2 hover:underline"
                  >
                    {MSG.forgot}
                  </Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {MSG.noAccount}{" "}
              <Link
                href={
                  nextPath !== "/"
                    ? `/signup?next=${encodeURIComponent(nextPath)}`
                    : "/signup"
                }
                className={cn(
                  "font-medium text-[#FF6B6B] underline-offset-2 hover:underline"
                )}
              >
                {MSG.signup}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          {MSG.loading}
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
