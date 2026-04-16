"use client";

import { Bookmark, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DateCourse } from "@/types/course";

type MeUser = { id: string; email: string; name: string };

export function SaveCourseButton({ course }: { course: DateCourse }) {
  const [user, setUser] = useState<MeUser | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
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

  const save = useCallback(async () => {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/saved-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course }),
      });
      const data = (await res.json().catch(() => null)) as
        | { id?: string; error?: string }
        | null;
      if (!res.ok) {
        throw new Error(data?.error || "저장하지 못했어요.");
      }
      if (data?.id) setSavedId(data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요.");
    } finally {
      setSaving(false);
    }
  }, [course]);

  if (user === undefined) {
    return (
      <div className="flex min-h-12 items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        계정 확인 중…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-3 text-sm">
        <p className="text-muted-foreground">
          로그인하면 이 코스를 계정에 저장해 두었다가 나중에 다시 볼 수 있어요.
        </p>
        <Link
          href="/login?next=/course"
          className={cn(
            buttonVariants({ size: "sm" }),
            "mt-3 inline-flex h-10 rounded-lg touch-manipulation"
          )}
        >
          로그인하고 저장하기
        </Link>
      </div>
    );
  }

  if (savedId) {
    return (
      <div className="flex w-full flex-col gap-2 rounded-xl border border-[#FF6B6B]/25 bg-[#FF6B6B]/5 px-4 py-3 sm:flex-1">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Check className="size-4 text-[#FF6B6B]" />
          계정에 저장했어요.
        </p>
        <Link
          href={`/course/saved/${savedId}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-10 w-full touch-manipulation rounded-lg border-[#FF6B6B]/40 sm:w-auto"
          )}
        >
          저장된 페이지로 보기
        </Link>
        <Link
          href="/my-courses"
          className="text-center text-xs text-muted-foreground underline underline-offset-2"
        >
          저장한 코스 목록
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2 sm:flex-1">
      <Button
        type="button"
        className="h-12 w-full touch-manipulation rounded-xl bg-[#FF6B6B] text-primary-foreground shadow-md shadow-[#FF6B6B]/25 hover:bg-[#FF6B6B]/90"
        onClick={() => void save()}
        disabled={saving}
      >
        {saving ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Bookmark className="size-4" />
        )}
        이 코스를 계정에 저장
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
