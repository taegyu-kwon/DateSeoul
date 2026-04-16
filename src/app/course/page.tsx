"use client";

import { RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CourseDetailView } from "@/components/course-detail-view";
import { SaveCourseButton } from "@/components/save-course-button";
import { ShareToRankingButton } from "@/components/share-to-ranking-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DateCourse } from "@/types/course";

const STORAGE_KEY = "dateSeoulCourse";

export default function CoursePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [course, setCourse] = useState<DateCourse | null>(null);
  const [parseError, setParseError] = useState(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setCourse(null);
        return;
      }
      const data = JSON.parse(raw) as DateCourse;
      if (!data?.spots?.length) {
        setParseError(true);
        return;
      }
      setCourse(data);
    } catch {
      setParseError(true);
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-dvh min-h-screen flex-col items-center justify-center bg-background px-[max(1.5rem,env(safe-area-inset-left))] pe-[max(1.5rem,env(safe-area-inset-right))] text-center">
        <p className="text-muted-foreground">불러오는 중…</p>
      </div>
    );
  }

  if (parseError || !course) {
    return (
      <div className="flex min-h-dvh min-h-screen flex-col items-center justify-center gap-6 bg-background px-[max(1.5rem,env(safe-area-inset-left))] pe-[max(1.5rem,env(safe-area-inset-right))] text-center">
        <p className="max-w-sm text-muted-foreground">
          {parseError
            ? "저장된 코스를 읽지 못했어요."
            : "아직 만든 코스가 없어요. 먼저 코스를 만들어 볼까요?"}
        </p>
        <Link
          href="/"
          className={cn(buttonVariants(), "inline-flex rounded-xl")}
        >
          홈으로
        </Link>
      </div>
    );
  }

  return (
    <CourseDetailView
      course={course}
      backHref="/"
      backLabel="돌아가기"
      bottom={
        <>
          <ShareToRankingButton course={course} />
          <SaveCourseButton course={course} />
          <Button
            type="button"
            variant="outline"
            className="h-12 flex-1 touch-manipulation rounded-xl border-[#FF6B6B]/40"
            onClick={() => {
              window.sessionStorage.removeItem(STORAGE_KEY);
              router.push("/");
            }}
          >
            <RefreshCcw className="size-4" />
            다시 생성하기
          </Button>
        </>
      }
    />
  );
}
