"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { safeNextPath } from "@/lib/safe-next-path";
import { cn } from "@/lib/utils";

const MSG = {
  title: "\ube44\ubc00\ubc88\ud638 \uc7ac\uc124\uc815",
  newPwd: "\uc0c8 \ube44\ubc00\ubc88\ud638",
  confirm: "\uc0c8 \ube44\ubc00\ubc88\ud638 \ud655\uc778",
  submit: "\ube44\ubc00\ubc88\ud638 \ubcc0\uacbd",
  loading: "\ucc98\ub9ac \uc911\u2026",
  mismatch:
    "\ube44\ubc00\ubc88\ud638\uac00 \uc11c\ub85c \uc77c\uce58\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.",
  minLen: "\ube44\ubc00\ubc88\ud638\ub294 8\uc790 \uc774\uc0c1\uc774\uc5b4\uc57c \ud569\ub2c8\ub2e4.",
  noToken:
    "\uc720\ud6a8\ud55c \ub9c1\ud06c\uac00 \uc5c6\uc2b5\ub2c8\ub2e4. \ube44\ubc00\ubc88\ud638 \ucc3e\uae30\ub97c \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.",
  success: "\ube44\ubc00\ubc88\ud638\uac00 \ubcc0\uacbd\ub418\uc5c8\uc2b5\ub2c8\ub2e4. \ub85c\uadf8\uc778\ud574 \uc8fc\uc138\uc694.",
  generic: "\uc624\ub958\uac00 \ub0ac\uc5b4\uc694.",
  forgotAgain: "\ube44\ubc00\ubc88\ud638 \ucc3e\uae30",
  login: "\ub85c\uadf8\uc778",
} as const;

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const nextPath = safeNextPath(searchParams.get("next"));
  const loginHref =
    nextPath !== "/"
      ? `/login?next=${encodeURIComponent(nextPath)}`
      : "/login";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(MSG.minLen);
      return;
    }
    if (password !== confirm) {
      setError(MSG.mismatch);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || MSG.generic);
      }
      setSuccess(true);
      setTimeout(() => {
        router.push(loginHref);
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : MSG.generic);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-dvh min-h-screen bg-background px-4 pb-16 pt-8">
        <div className="mx-auto max-w-lg md:max-w-xl">
          <Card className="border-0 shadow-md shadow-black/5">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{MSG.noToken}</p>
              <Link
                href="/forgot-password"
                className={cn(
                  buttonVariants(),
                  "mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl"
                )}
              >
                {MSG.forgotAgain}
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh min-h-screen bg-background px-[max(1rem,env(safe-area-inset-left))] pb-[max(2.5rem,env(safe-area-inset-bottom))] pe-[max(1rem,env(safe-area-inset-right))] pt-6 md:px-4 md:pb-16 md:pt-8">
      <div className="mx-auto max-w-lg md:max-w-xl">
        <Card className="border-0 shadow-md shadow-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{MSG.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <p className="text-sm text-foreground">{MSG.success}</p>
            ) : (
              <form className="space-y-4" onSubmit={submit}>
                <div className="space-y-2">
                  <Label htmlFor="password">{MSG.newPwd}</Label>
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
                  <Label htmlFor="confirm">{MSG.confirm}</Label>
                  <input
                    id="confirm"
                    name="confirm"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
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
                    {MSG.login}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          {MSG.loading}
        </div>
      }
    >
      <ResetForm />
    </Suspense>
  );
}
