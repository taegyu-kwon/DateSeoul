"use client";

import { Heart, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const L = {
  like: "\uc88b\uc544\uc694",
  unlike: "\uc88b\uc544\uc694 \ucde8\uc18c",
  loginToLike: "\ub85c\uadf8\uc778 \ud6c4 \uc88b\uc544\uc694",
  err: "\uc624\ub958\uac00 \ub0ac\uc5b4\uc694.",
} as const;

export type RankingRowData = {
  id: string;
  title: string;
  likeCount: number;
  createdAt: string;
  authorName: string;
};

export function RankingRow({
  rank,
  row,
  initiallyLiked,
  loggedIn,
}: {
  rank: number;
  row: RankingRowData;
  initiallyLiked: boolean;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initiallyLiked);
  const [count, setCount] = useState(row.likeCount);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function onLikeClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setActionError(null);
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent("/ranking")}`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/shared-courses/${row.id}/like`, {
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
    } catch (err) {
      setActionError(err instanceof Error ? err.message : L.err);
    } finally {
      setBusy(false);
    }
  }

  const a11yLabel = !loggedIn
    ? L.loginToLike
    : liked
      ? L.unlike
      : L.like;

  return (
    <li className="flex items-stretch overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors hover:border-[#FF6B6B]/35">
      <Link
        href={`/course/shared/${row.id}`}
        className="flex min-h-[3.75rem] min-w-0 flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-[#FF6B6B]/[0.04]"
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold tabular-nums",
            rank <= 3
              ? "bg-[#FF6B6B]/15 text-[#FF6B6B]"
              : "bg-muted text-muted-foreground"
          )}
        >
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug text-foreground">{row.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {row.authorName}
            <span className="mx-1">{"\u00b7"}</span>
            {new Date(row.createdAt).toLocaleDateString("ko-KR", {
              dateStyle: "medium",
            })}
          </p>
        </div>
      </Link>

      <div
        className="w-px shrink-0 self-stretch bg-border/80"
        aria-hidden
      />

      <button
        type="button"
        onClick={(e) => void onLikeClick(e)}
        disabled={busy}
        aria-pressed={loggedIn ? liked : undefined}
        aria-label={a11yLabel}
        className={cn(
          "flex min-h-[3.75rem] min-w-[4.25rem] shrink-0 flex-col items-center justify-center gap-0.5 px-3 py-2.5 touch-manipulation transition-colors",
          "outline-none hover:bg-muted/40 active:bg-muted/60",
          "focus-visible:ring-2 focus-visible:ring-muted-foreground/35 focus-visible:ring-offset-0",
          liked && loggedIn
            ? "text-[#FF6B6B]"
            : "text-muted-foreground"
        )}
      >
        {busy ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
        ) : (
          <Heart
            className={cn(
              "size-5",
              liked && loggedIn && "fill-[#FF6B6B] text-[#FF6B6B]"
            )}
            aria-hidden
          />
        )}
        <span className="text-xs font-semibold tabular-nums text-foreground">
          {count.toLocaleString("ko-KR")}
        </span>
        {actionError ? (
          <span className="max-w-[5rem] text-center text-[9px] leading-tight text-destructive">
            {actionError}
          </span>
        ) : null}
      </button>
    </li>
  );
}
