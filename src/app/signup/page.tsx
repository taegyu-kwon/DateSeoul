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
  title: "\ud68c\uc6d0\uac00\uc785",
  name: "\uc774\ub984",
  email: "\uc774\uba54\uc77c",
  login: "\ub85c\uadf8\uc778",
  pwdMismatch: "\ube44\ubc00\ubc88\ud638 \ud655\uc778\uc774 \uc77c\uce58\ud558\uc9c0 \uc54a\uc544\uc694.",
  generic: "\uc624\ub958\uac00 \ub0ac\uc5b4\uc694.",
  pwdLabel: "\ube44\ubc00\ubc88\ud638 (8\uc790 \uc774\uc0c1)",
  pwd2Label: "\ube44\ubc00\ubc88\ud638 \ud655\uc778",
  loading: "\ucc98\ub9ac \uc911\u2026",
  submit: "\uac00\uc785\ud558\uae30",
  hasAccount: "\uc774\ubbf8 \uacc4\uc815\uc774 \uc788\ub098\uc694?",
};

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== password2) {
      setError(MSG.pwdMismatch);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "\uac00\uc785\uc5d0 \uc2e4\ud328\ud588\uc5b4\uc694.");
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
                <Label htmlFor="name">{MSG.name}</Label>
                <input
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
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
                <Label htmlFor="password">{MSG.pwdLabel}</Label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-11 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password2">{MSG.pwd2Label}</Label>
                <input
                  id="password2"
                  name="password2"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
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
              {MSG.hasAccount}{" "}
              <Link
                href={
                  nextPath !== "/"
                    ? `/login?next=${encodeURIComponent(nextPath)}`
                    : "/login"
                }
                className={cn(
                  "font-medium text-[#FF6B6B] underline-offset-2 hover:underline"
                )}
              >
                {MSG.login}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          {MSG.loading}
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
