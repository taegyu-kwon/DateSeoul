"use client";

import { Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const L = {
  agree: "\uacf5\uac10",
  cancelAgree: "\uacf5\uac10 \ucde8\uc18c",
  ranking: "\ub7ad\ud0b9",
  loginNote:
    "\ub85c\uadf8\uc778\ud55c \uc0ac\uc6a9\uc790\ub9cc \uacf5\uac10\uc744 \ub0a0 \uc218 \uc788\uc2b5\ub2c8\ub2e4.",
  err: "\uc624\ub958\uac00 \ub0ac\uc2b5\ub2c8\ub2e4.",
} as const;

export function SharedCourseLikeBar({
  sharedId,
  initialLiked,
  initialCount,
  authorName,
}: {
  sharedId: string;
  initialLiked: boolean;
  initialCount: number;
  authorName: string;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/shared-courses/${sharedId}/like`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        liked?: boolean;
        likeCount?: number;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || L.err);
      }
      if (typeof data.liked === "boolean" && typeof data.likeCount === "number") {
        setLiked(data.liked);
        setCount(data.likeCount);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : L.err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{authorName}</span>
          <span className="mx-1.5 text-border">·</span>
          <span className="tabular-nums">
            {L.agree} {count.toLocaleString("ko-KR")}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={liked ? "default" : "outline"}
            size="lg"
            className={cn(
              "h-11 gap-2 touch-manipulation rounded-xl",
              liked && "bg-[#FF6B6B] text-white hover:bg-[#FF6B6B]/90",
              "focus-visible:border-border focus-visible:ring-muted-foreground/30"
            )}
            disabled={busy}
            onClick={() => void toggle()}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Heart
                className={cn("size-4", liked && "fill-current")}
                aria-hidden
              />
            )}
            {liked ? L.cancelAgree : L.agree}
          </Button>
          <Link
            href="/ranking"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "h-11 touch-manipulation rounded-xl text-muted-foreground"
            )}
          >
            {L.ranking}
          </Link>
        </div>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <p className="mt-3 text-xs text-muted-foreground">{L.loginNote}</p>
    </div>
  );
}
