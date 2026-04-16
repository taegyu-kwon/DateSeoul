"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Clock, Wallet } from "lucide-react";
import Link from "next/link";
import { BudgetBreakdownChart } from "@/components/budget-breakdown-chart";
import { CourseMap } from "@/components/course-map";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatKRW } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DateCourse } from "@/types/course";

export function CourseDetailView({
  course,
  backHref,
  backLabel,
  bottom,
  beforeBottom,
  headerEyebrow = "오늘의 코스",
}: {
  course: DateCourse;
  backHref: string;
  backLabel: string;
  bottom: ReactNode;
  beforeBottom?: ReactNode;
  headerEyebrow?: string;
}) {
  const spots = [...course.spots].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-dvh min-h-screen bg-background pb-[max(4rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-lg px-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))] pt-6 md:max-w-3xl md:px-4 md:pt-10">
        <Link
          href={backHref}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 mb-6 inline-flex gap-1 text-muted-foreground"
          )}
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Link>

        <header className="mb-6 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-[#FF6B6B]">
            {headerEyebrow}
          </p>
          <h1 className="text-balance text-2xl font-bold tracking-tight md:text-3xl">
            {course.course_title}
          </h1>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm shadow-sm">
              <Wallet className="size-3.5 text-[#FF6B6B]" />
              총 {formatKRW(course.total_estimated_cost)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm shadow-sm">
              <Clock className="size-3.5 text-[#FF6B6B]" />
              약 {course.total_duration_hours}시간
            </span>
            <span className="inline-flex items-center rounded-full border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 px-3 py-1 text-sm font-medium text-[#FF6B6B]">
              {course.course_vibe}
            </span>
          </div>
        </header>

        <section className="mb-8 rounded-2xl border border-black/5 bg-white shadow-sm">
          <CourseMap
            spots={course.spots}
            className="h-[clamp(240px,42vh,400px)] w-full min-h-[240px] rounded-xl md:h-[400px] md:min-h-[400px]"
          />
        </section>

        <section className="mb-10 min-w-0 overflow-x-hidden rounded-2xl border border-black/5 bg-white p-4 shadow-sm md:p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">예산 비중</h2>
          <BudgetBreakdownChart breakdown={course.budget_breakdown ?? undefined} />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">스팟 순서</h2>
          {spots.map((spot) => (
            <Card
              key={`${spot.order}-${spot.name}`}
              className="overflow-hidden border-0 shadow-md shadow-black/[0.06]"
            >
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div
                    className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#FF6B6B]/10 text-base font-bold tabular-nums text-[#FF6B6B] ring-1 ring-[#FF6B6B]/15"
                    aria-label={`${spot.order}번째 장소`}
                  >
                    {spot.order}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-medium text-[#FF6B6B]">
                          {spot.category}
                        </p>
                        <h3 className="text-lg font-semibold leading-snug">
                          {spot.name}
                        </h3>
                      </div>
                      <div className="text-right text-xs text-muted-foreground tabular-nums">
                        <div>인당 약 {formatKRW(spot.estimated_cost_per_person)}</div>
                        <div>{spot.duration_minutes}분</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{spot.description}</p>
                    <p className="text-xs leading-relaxed text-foreground/80">
                      💡 {spot.tip}
                    </p>
                    <p className="text-xs text-muted-foreground">{spot.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {beforeBottom ? <div className="mt-10">{beforeBottom}</div> : null}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {bottom}
        </div>
      </div>
    </div>
  );
}
