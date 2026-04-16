"use client";

import { ChevronRight, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Row = { id: string; title: string; createdAt: string };

export default function MyCoursesPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/saved-courses");
        const data = (await res.json()) as {
          courses?: Row[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error || "목록을 불러오지 못했어요.");
        }
        if (!cancelled) setRows(data.courses ?? []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "목록을 불러오지 못했어요.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows === null && !error) {
    return (
      <div className="flex min-h-dvh min-h-screen flex-col items-center justify-center gap-3 bg-background px-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 md:max-w-xl">
        <p className="text-center text-sm text-destructive">{error}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/login?next=/my-courses" className={cn(buttonVariants(), "rounded-xl")}>
            로그인
          </Link>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            홈
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-[max(1rem,env(safe-area-inset-left))] pb-12 pe-[max(1rem,env(safe-area-inset-right))] pt-6 md:max-w-xl md:pt-10">
      <h1 className="text-2xl font-bold tracking-tight">저장한 코스</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        코스 결과 화면에서「이 코스를 계정에 저장」을 누르면 여기에 쌓여요.
      </p>

      {!rows?.length ? (
        <div className="mt-10 rounded-2xl border border-dashed border-muted-foreground/25 bg-muted/15 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">아직 저장한 코스가 없어요.</p>
          <Link
            href="/"
            className={cn(
              buttonVariants(),
              "mt-6 inline-flex rounded-xl shadow-md shadow-[#FF6B6B]/25"
            )}
          >
            코스 만들기
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <div className="flex min-h-[3.5rem] items-stretch gap-2 rounded-xl border border-border bg-card py-2 ps-4 pe-2 shadow-sm transition-colors hover:border-[#FF6B6B]/35 hover:bg-[#FF6B6B]/[0.04]">
                <Link
                  href={`/course/saved/${r.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 py-1 pe-1"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug text-foreground">{r.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString("ko-KR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={deletingId !== null}
                  aria-label="코스 삭제"
                  onClick={(e) => {
                    e.preventDefault();
                    if (
                      !globalThis.confirm(
                        "이 코스를 삭제할까요? 되돌릴 수 없어요."
                      )
                    ) {
                      return;
                    }
                    setDeletingId(r.id);
                    void (async () => {
                      try {
                        const res = await fetch(`/api/saved-courses/${r.id}`, {
                          method: "DELETE",
                        });
                        const data = (await res.json()) as { error?: string };
                        if (!res.ok) {
                          throw new Error(
                            data.error || "삭제하지 못했어요."
                          );
                        }
                        setRows((prev) => (prev ?? []).filter((x) => x.id !== r.id));
                      } catch (err) {
                        globalThis.alert(
                          err instanceof Error
                            ? err.message
                            : "삭제하지 못했어요."
                        );
                      } finally {
                        setDeletingId(null);
                      }
                    })();
                  }}
                >
                  {deletingId === r.id ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Trash2 className="size-5" />
                  )}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
