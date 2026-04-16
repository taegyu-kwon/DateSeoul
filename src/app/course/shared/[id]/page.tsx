"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CourseDetailView } from "@/components/course-detail-view";
import { SharedCourseLikeBar } from "@/components/shared-course-like-bar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DateCourse } from "@/types/course";

type Meta = {
  id: string;
  title: string;
  likeCount: number;
  createdAt: string;
  authorName: string;
  liked: boolean;
};

const S = {
  badUrl: "\uc798\ubabb\ub41c \uc8fc\uc18c\uc608\uc694.",
  loadFail: "\ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.",
  noData: "\ucf54\uc2a4 \ub370\uc774\ud130\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.",
  loading: "\ubd88\ub7ec\uc624\ub294 \uc911\u2026",
  ranking: "\ub7ad\ud0b9",
  home: "\ud648",
  sharedEyebrow: "\uacf5\uc720 \ucf54\uc2a4",
  toList: "\ubaa9\ub85d\uc73c\ub85c",
  makeMine: "\ub0b4 \ucf54\uc2a4 \ub9cc\ub4e4\uae30",
} as const;

export default function SharedCoursePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [course, setCourse] = useState<DateCourse | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setError(S.badUrl);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/shared-courses/${id}`);
        const data = (await res.json()) as {
          course?: DateCourse;
          meta?: Meta;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error || S.loadFail);
        }
        if (!data.course?.spots?.length || !data.meta) {
          throw new Error(S.noData);
        }
        if (!cancelled) {
          setCourse(data.course);
          setMeta(data.meta);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : S.loadFail);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-dvh min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
        <p className="text-muted-foreground">{S.loading}</p>
      </div>
    );
  }

  if (error || !course || !meta) {
    return (
      <div className="flex min-h-dvh min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
        <p className="max-w-sm text-muted-foreground">{error}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/ranking" className={cn(buttonVariants(), "rounded-xl")}>
            {S.ranking}
          </Link>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            {S.home}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <CourseDetailView
      course={course}
      backHref="/ranking"
      backLabel={S.ranking}
      headerEyebrow={S.sharedEyebrow}
      beforeBottom={
        <SharedCourseLikeBar
          sharedId={meta.id}
          initialLiked={meta.liked}
          initialCount={meta.likeCount}
          authorName={meta.authorName}
        />
      }
      bottom={
        <>
          <Link
            href="/ranking"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 flex-1 touch-manipulation rounded-xl border-[#FF6B6B]/40 text-center"
            )}
          >
            {S.toList}
          </Link>
          <Link
            href="/"
            className={cn(
              buttonVariants(),
              "h-12 flex-1 touch-manipulation rounded-xl text-center shadow-md shadow-[#FF6B6B]/25"
            )}
          >
            {S.makeMine}
          </Link>
        </>
      }
    />
  );
}
