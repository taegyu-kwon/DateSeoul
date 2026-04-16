"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CourseDetailView } from "@/components/course-detail-view";
import { SavedCourseManage } from "@/components/saved-course-manage";
import { ShareToRankingButton } from "@/components/share-to-ranking-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DateCourse } from "@/types/course";

export default function SavedCoursePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [course, setCourse] = useState<DateCourse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setError("잘못된 주소예요.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/saved-courses/${id}`);
        const data = (await res.json()) as { course?: DateCourse; error?: string };
        if (!res.ok) {
          throw new Error(data.error || "불러오지 못했어요.");
        }
        if (!data.course?.spots?.length) {
          throw new Error("코스 데이터가 없어요.");
        }
        if (!cancelled) setCourse(data.course);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "불러오지 못했어요.");
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
        <p className="text-muted-foreground">불러오는 중…</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex min-h-dvh min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
        <p className="max-w-sm text-muted-foreground">{error}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/my-courses" className={cn(buttonVariants(), "rounded-xl")}>
            저장한 코스
          </Link>
          <Link
            href="/login?next=/my-courses"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
          >
            로그인
          </Link>
        </div>
      </div>
    );
  }

  return (
    <CourseDetailView
      course={course}
      backHref="/my-courses"
      backLabel="저장한 코스"
      headerEyebrow="저장한 코스"
      beforeBottom={
        <div className="space-y-4">
          <ShareToRankingButton
            course={course}
            loginNext={`/course/saved/${id}`}
          />
          <SavedCourseManage
            savedId={id}
            course={course}
            onCourseUpdated={setCourse}
          />
        </div>
      }
      bottom={
        <>
          <Link
            href="/my-courses"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 flex-1 touch-manipulation rounded-xl border-[#FF6B6B]/40 text-center"
            )}
          >
            목록으로
          </Link>
          <Link
            href="/"
            className={cn(
              buttonVariants(),
              "h-12 flex-1 touch-manipulation rounded-xl text-center shadow-md shadow-[#FF6B6B]/25"
            )}
          >
            새 코스 만들기
          </Link>
        </>
      }
    />
  );
}
