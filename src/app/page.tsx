"use client";

import { ChevronDown, MapPin, Navigation, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LoadingCourseOverlay } from "@/components/loading-course-overlay";
import { Slider } from "@/components/ui/slider";
import { reverseGeocodeToNeighborhoodLabel } from "@/lib/kakao-reverse-geocode";
import {
  COURSE_KEYWORD_BLOCKED_MESSAGE,
  isCourseKeywordBlocked,
} from "@/lib/keyword-policy";
import {
  DEFAULT_AREA,
  HAN_RIVER_AREA,
  SEOUL_GU,
} from "@/lib/seoul-areas";
import { cn } from "@/lib/utils";
import {
  DATE_STYLES,
  type DateStyle,
  type TimeOfDay,
} from "@/types/course";

const STORAGE_KEY = "dateSeoulCourse";

function geolocationErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "위치 권한이 꺼져 있어요. 브라우저 주소창의 권한 설정에서 위치를 허용해 주세요.";
    case err.TIMEOUT:
      return "위치 확인 시간이 초과됐어요. 잠시 후 다시 시도하거나 지역 선택을 이용해 주세요.";
    case err.POSITION_UNAVAILABLE:
      return "현재 기기에서 위치 정보를 가져오지 못했어요. 네트워크/GPS 상태를 확인해 주세요.";
    default:
      return "현재 위치를 가져오지 못했습니다. 권한을 확인해 주세요.";
  }
}

export default function HomePage() {
  const router = useRouter();
  const [budgetMan, setBudgetMan] = useState(10);
  const [locationMode, setLocationMode] = useState<"area" | "current">("area");
  const [area, setArea] = useState<string>(DEFAULT_AREA);
  const [currentLocationLabel, setCurrentLocationLabel] = useState("");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("오후");
  const [dateStyle, setDateStyle] = useState<DateStyle | null>(null);
  const [peopleCount, setPeopleCount] = useState(2);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const budgetWon = budgetMan * 10_000;
  const effectiveLocation =
    locationMode === "current" && currentLocationLabel.trim()
      ? currentLocationLabel.trim()
      : area;

  const handleUseCurrentLocation = () => {
    setError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("이 브라우저에서는 위치를 사용할 수 없어요.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationMode("current");
        try {
          const areaLabel = await reverseGeocodeToNeighborhoodLabel(
            latitude,
            longitude
          );
          setCurrentLocationLabel(
            areaLabel ?? "현재 위치 근처 (동·구 이름을 불러오지 못했어요)"
          );
        } finally {
          setGeoLoading(false);
        }
      },
      (firstErr) => {
        // Retry once with relaxed options (faster/less strict on some devices).
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            setLocationMode("current");
            try {
              const areaLabel = await reverseGeocodeToNeighborhoodLabel(
                latitude,
                longitude
              );
              setCurrentLocationLabel(
                areaLabel ?? "현재 위치 근처 (동·구 이름을 불러오지 못했어요)"
              );
            } finally {
              setGeoLoading(false);
            }
          },
          (secondErr) => {
            setGeoLoading(false);
            setError(
              geolocationErrorMessage(
                secondErr && typeof secondErr.code === "number"
                  ? secondErr
                  : firstErr
              )
            );
          },
          { enableHighAccuracy: false, timeout: 20_000, maximumAge: 300_000 }
        );
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 0 }
    );
  };

  const submit = async () => {
    setError(null);
    const kw = keyword.trim();
    if (kw.length > 0 && isCourseKeywordBlocked(kw)) {
      setError(COURSE_KEYWORD_BLOCKED_MESSAGE);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/generate-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget: budgetWon,
          location: effectiveLocation,
          time_of_day: timeOfDay,
          people_count: peopleCount,
          ...(dateStyle ? { date_style: dateStyle } : {}),
          ...(kw ? { keyword: kw.slice(0, 200) } : {}),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (data && (data as { error?: string }).error) ||
            "코스를 만들지 못했어요."
        );
      }
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
      router.push("/course");
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh min-h-screen bg-background">
      {loading ? <LoadingCourseOverlay /> : null}
      <div
        className={cn(
          "mx-auto flex min-h-dvh min-h-screen max-w-lg flex-col px-[max(1rem,env(safe-area-inset-left))] pb-8 pe-[max(1rem,env(safe-area-inset-right))] pt-4 md:max-w-xl md:pb-16 md:pt-9",
          "max-md:pb-[max(6.5rem,env(safe-area-inset-bottom))]"
        )}
      >
        <header className="mb-6 text-center md:mb-8">
          <h1 className="text-balance text-[1.65rem] font-semibold leading-snug tracking-tight text-foreground sm:text-3xl md:text-4xl">
            오늘 데이트,
            <br />
            예산에 맞게
          </h1>
          <p className="mt-2.5 text-pretty text-sm leading-relaxed text-muted-foreground md:mt-3">
            예산·동네·키워드를 입력하면 AI가 코스를 생성하고, 지도에 동선을 표시합니다.
          </p>
        </header>

        <Card className="border-0 shadow-md shadow-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="size-5 text-[#FF6B6B]" />
              코스 만들기
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-7 md:space-y-8">
            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <Label className="text-base font-medium">
                  예산 (선택한 인원 총액)
                </Label>
                <span className="text-lg font-semibold tabular-nums text-[#FF6B6B]">
                  {budgetMan}만 원
                </span>
              </div>
              <div className="relative">
                <div
                  className="pointer-events-none absolute inset-x-0 top-1/2 z-0 h-0.5 -translate-y-1/2 rounded-full bg-[#FF6B6B]"
                  aria-hidden
                />
                <Slider
                  className="relative z-10"
                  min={1}
                  max={30}
                  step={1}
                  value={[budgetMan]}
                  onValueChange={(v) => {
                    const n = Array.isArray(v) ? v[0] : v;
                    setBudgetMan(
                      typeof n === "number" && !Number.isNaN(n) ? n : 1
                    );
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] tabular-nums text-muted-foreground">
                <span>1만</span>
                <span>30만</span>
              </div>
              <p className="text-xs text-muted-foreground">
                약 {budgetWon.toLocaleString("ko-KR")}원 기준으로 추천합니다.
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">위치</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={locationMode === "area" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "min-h-11 touch-manipulation md:min-h-9",
                    locationMode === "area" && "shadow-sm"
                  )}
                  onClick={() => {
                    setLocationMode("area");
                    setError(null);
                  }}
                >
                  <MapPin className="size-4" />
                  지역 선택
                </Button>
                <Button
                  type="button"
                  variant={locationMode === "current" ? "default" : "outline"}
                  size="sm"
                  disabled={geoLoading}
                  className={cn(
                    "min-h-11 touch-manipulation md:min-h-9",
                    locationMode === "current" && "shadow-sm"
                  )}
                  onClick={() => {
                    if (locationMode === "current" && currentLocationLabel) {
                      return;
                    }
                    handleUseCurrentLocation();
                  }}
                >
                  <Navigation className="size-4" />
                  {geoLoading ? "위치 확인 중..." : "현재 위치"}
                </Button>
              </div>
              {locationMode === "area" ? (
                <div className="relative">
                  <select
                    className="flex min-h-11 w-full appearance-none rounded-lg border border-input bg-card px-3 py-2 pr-12 text-base outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring md:min-h-0 md:h-11 md:text-sm"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  >
                    <optgroup label={"\ud55c\uac15"}>
                      <option value={HAN_RIVER_AREA}>{HAN_RIVER_AREA}</option>
                    </optgroup>
                    <optgroup
                      label={"\uc11c\uc6b8\ud2b9\ubcc4\uc2dc \uc790\uce58\uad6c"}
                    >
                      {SEOUL_GU.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                  {currentLocationLabel ||
                    "「현재 위치」를 눌러 주변 동·구를 불러오면 그 근처를 기준으로 코스가 생성됩니다."}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">데이트 시간대</Label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "오전" as const, hint: "브런치·가벼운 산책" },
                    { id: "오후" as const, hint: "카페·전시·쇼핑" },
                    { id: "종일" as const, hint: "아침부터 저녁까지" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTimeOfDay(t.id)}
                    className={cn(
                      "touch-manipulation rounded-xl border px-2 py-3.5 text-center transition-all md:py-3",
                      timeOfDay === t.id
                        ? "border-[#FF6B6B] bg-[#FF6B6B]/10 shadow-sm"
                        : "border-border bg-card hover:border-[#FF6B6B]/40"
                    )}
                  >
                    <div className="text-sm font-semibold">{t.id}</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {t.hint}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Label className="text-base font-medium">데이트 스타일</Label>
                <span className="text-xs text-muted-foreground">선택 사항</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DATE_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() =>
                      setDateStyle((prev) => (prev === style ? null : style))
                    }
                    className={cn(
                      "touch-manipulation rounded-xl border px-2 py-3 text-center text-sm font-semibold transition-all md:py-2.5",
                      dateStyle === style
                        ? "border-[#FF6B6B] bg-[#FF6B6B]/10 shadow-sm"
                        : "border-border bg-card hover:border-[#FF6B6B]/40"
                    )}
                  >
                    {style}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                같은 스타일을 다시 누르면 선택이 해제됩니다. 미선택 시 스타일
                제약 없이 생성됩니다.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Label htmlFor="keyword" className="text-base font-medium">
                  {"\ud0a4\uc6cc\ub4dc"}
                </Label>
                <span className="text-xs text-muted-foreground">
                  {"\uc120\ud0dd \uc0ac\ud56d"}
                </span>
              </div>
              <textarea
                id="keyword"
                rows={2}
                maxLength={200}
                placeholder={
                  "\uc608: \uc11d\ucd0c\ud638\uc218, \ube61\uc138\uac8c, \ud55c\uac15 \uc704\uc8fc\u2026"
                }
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="min-h-[4.5rem] w-full resize-y rounded-lg border border-input bg-card px-3 py-2.5 text-base outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:min-h-[3.5rem] md:text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {
                  "\uc7a5\uc18c\u00b7\ubd84\uc704\uae30\u00b7\uc77c\uc815 \ubc00\ub3c4 \ub4f1 \uc790\uc720\ub86d\uac8c \uc801\uc73c\uba74 \ucf54\uc2a4\uc5d0 \ubc18\uc601\ud574\uc694. \ube44\uc6b0\uba74 \uc9c0\uae08\uacfc \uac19\uc774 \uc0dd\uc131\ub429\ub2c8\ub2e4."
                }
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="people" className="text-base font-medium">
                인원
              </Label>
              <div className="relative">
                <select
                  id="people"
                  className="flex min-h-11 w-full appearance-none rounded-lg border border-input bg-card px-3 py-2 pr-12 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-11 md:min-h-0 md:text-sm"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(Number(e.target.value))}
                >
                  {[2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n}명
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
              </div>
            </div>

            {error ? (
              <p
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <Button
              type="button"
              className="hidden h-12 w-full touch-manipulation rounded-xl text-base font-semibold shadow-md shadow-[#FF6B6B]/25 md:inline-flex"
              onClick={submit}
              disabled={loading}
            >
              코스 만들기
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              방금 만든 코스는 이 브라우저 탭에만 보관됩니다.{" "}
              <Link href="/course" className="underline underline-offset-2">
                마지막 코스 보기
              </Link>
              {" · "}
              <Link href="/my-courses" className="underline underline-offset-2">
                계정에 저장한 코스
              </Link>
            </p>
          </CardContent>
        </Card>

        <footer className="mt-auto pt-8 text-center text-xs text-muted-foreground md:pt-10">
          © {new Date().getFullYear()} Date Seoul · 서울 데이트 MVP
        </footer>
      </div>
      <div
        className="fixed inset-x-0 bottom-0 z-30 md:hidden"
        style={{
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto max-w-lg px-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))]">
          <div className="rounded-2xl border border-border/60 bg-card/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-card/90">
            <Button
              type="button"
              className="h-12 w-full touch-manipulation rounded-xl text-base font-semibold shadow-md shadow-[#FF6B6B]/25"
              onClick={submit}
              disabled={loading}
            >
              코스 만들기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
