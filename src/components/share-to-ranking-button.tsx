"use client";

import { Loader2, Share2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DateCourse } from "@/types/course";

type MeUser = { id: string; email: string; name: string };

const T = {
  shareFail: "\uacf5\uc720\ud558\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.",
  checking: "\uacc4\uc815 \ud655\uc778 \uc911\u2026",
  loginHint:
    "\ub85c\uadf8\uc778\ud558\uba74 \uc774 \ucf54\uc2a4\ub97c \ub7ad\ud0b9\uc5d0 \uacf5\uc720\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.",
  loginCta: "\ub85c\uadf8\uc778\ud558\uace0 \uacf5\uc720\ud558\uae30",
  done: "\ub7ad\ud0b9\uc5d0 \uacf5\uc720\ub418\uc5c8\uc2b5\ub2c8\ub2e4.",
  viewShared: "\uacf5\uc720 \ud398\uc774\uc9c0",
  viewRanking: "\ub7ad\ud0b9 \ubcf4\uae30",
  cta: "\ub7ad\ud0b9\uc5d0 \uacf5\uc720\ud558\uae30",
} as const;

export function ShareToRankingButton({
  course,
  loginNext = "/course",
}: {
  course: DateCourse;
  loginNext?: string;
}) {
  const [user, setUser] = useState<MeUser | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [sharedId, setSharedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = (await res.json()) as { user: MeUser | null };
        if (!cancelled) setUser(data.user ?? null);
      } catch {
        if (!cancelled) setUser(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const share = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/shared-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course }),
      });
      const data = (await res.json().catch(() => null)) as
        | { id?: string; error?: string }
        | null;
      if (!res.ok) {
        throw new Error(data?.error || T.shareFail);
      }
      if (data?.id) setSharedId(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : T.shareFail);
    } finally {
      setBusy(false);
    }
  }, [course]);

  if (user === undefined) {
    return (
      <div className="flex min-h-12 items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {T.checking}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-3 text-sm">
        <p className="text-muted-foreground">{T.loginHint}</p>
        <Link
          href={`/login?next=${encodeURIComponent(loginNext)}`}
          className={cn(
            buttonVariants({ size: "sm" }),
            "mt-3 inline-flex h-10 rounded-lg touch-manipulation"
          )}
        >
          {T.loginCta}
        </Link>
      </div>
    );
  }

  if (sharedId) {
    return (
      <div className="flex w-full flex-col gap-2 rounded-xl border border-[#FF6B6B]/25 bg-[#FF6B6B]/5 px-4 py-3 sm:flex-1">
        <p className="text-sm font-medium text-foreground">{T.done}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/course/shared/${sharedId}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-10 flex-1 touch-manipulation rounded-lg border-[#FF6B6B]/40 text-center"
            )}
          >
            {T.viewShared}
          </Link>
          <Link
            href="/ranking"
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-10 flex-1 touch-manipulation rounded-lg text-center"
            )}
          >
            {T.viewRanking}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2 sm:flex-1">
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full touch-manipulation rounded-xl border-[#FF6B6B]/40"
        onClick={() => void share()}
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Share2 className="size-4" />
        )}
        {T.cta}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
