"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { kakaoMapSdkSrc } from "@/lib/kakao-map-sdk";
import type { CourseSpot } from "@/types/course";

/** 서울시청 근처 — 좌표가 없을 때만 */
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

interface CourseMapProps {
  spots: CourseSpot[];
  className?: string;
}

function isValidCoord(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

export function CourseMap({ spots, className }: CourseMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlaysRef = useRef<unknown[]>([]);
  const [sdkReady, setSdkReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "";

  const ordered = useMemo(
    () => [...spots].sort((a, b) => a.order - b.order),
    [spots]
  );

  const normalizedSpots = useMemo(() => {
    const valid = ordered.filter((s) => isValidCoord(s.lat, s.lng));
    if (valid.length > 0) return valid;
    return ordered.length
      ? ordered.map((s, i) => ({
          ...s,
          lat: DEFAULT_CENTER.lat + i * 0.002,
          lng: DEFAULT_CENTER.lng + i * 0.002,
        }))
      : [];
  }, [ordered]);

  const markSdkReady = useCallback(() => {
    if (typeof window !== "undefined" && window.kakao?.maps) {
      setSdkReady(true);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (!key || typeof window === "undefined") return;
    if (markSdkReady()) return;
    const t = window.setInterval(() => {
      if (markSdkReady()) window.clearInterval(t);
    }, 50);
    const max = window.setTimeout(() => window.clearInterval(t), 15_000);
    return () => {
      window.clearInterval(t);
      window.clearTimeout(max);
    };
  }, [key, markSdkReady]);

  const initMap = useCallback(() => {
    if (!containerRef.current || !key || !window.kakao?.maps) return;
    if (normalizedSpots.length === 0) return;

    window.kakao.maps.load(() => {
      try {
        const { kakao } = window;
        const el = containerRef.current;
        if (!el || !kakao?.maps) return;

        el.innerHTML = "";
        const first = normalizedSpots[0];
        const center = new kakao.maps.LatLng(first.lat, first.lng);
        const map = new kakao.maps.Map(el, {
          center,
          level: 5,
        });

        overlaysRef.current.forEach((o) => {
          if (
            o &&
            typeof (o as { setMap?: (v: unknown) => void }).setMap === "function"
          ) {
            (o as { setMap: (v: unknown) => void }).setMap(null);
          }
        });
        overlaysRef.current = [];

        normalizedSpots.forEach((spot) => {
          const pos = new kakao.maps.LatLng(spot.lat, spot.lng);
          const markerEl = document.createElement("div");
          markerEl.className =
            "flex size-7 items-center justify-center rounded-full border-2 border-white bg-[#FF6B6B] text-xs font-bold text-white shadow-md";
          markerEl.textContent = String(spot.order);

          const overlay = new kakao.maps.CustomOverlay({
            position: pos,
            content: markerEl,
            yAnchor: 1,
          });
          overlay.setMap(map);
          overlaysRef.current.push(overlay);
        });

        if (normalizedSpots.length > 1) {
          const bounds = new kakao.maps.LatLngBounds();
          normalizedSpots.forEach((s) =>
            bounds.extend(new kakao.maps.LatLng(s.lat, s.lng))
          );
          map.setBounds(bounds);
        }

        const safeRelayout = () => {
          try {
            map.relayout();
          } catch {
            /* 일부 환경에서 컨테이너 레이아웃 전에 호출 시 실패할 수 있음 */
          }
        };
        requestAnimationFrame(safeRelayout);
        window.setTimeout(safeRelayout, 200);
      } catch (err) {
        console.error("[DateSeoul] Kakao map init failed:", err);
        setLoadError(true);
      }
    });
  }, [key, normalizedSpots]);

  useEffect(() => {
    if (!sdkReady || !key) return;
    initMap();
  }, [sdkReady, initMap, key]);

  const boxClass =
    className ??
    "h-[clamp(248px,40vh,400px)] w-full min-h-[248px] rounded-xl md:h-[400px] md:min-h-[400px]";

  if (!key) {
    return (
      <div
        className={
          className ??
          "flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-6 text-center text-sm text-muted-foreground"
        }
      >
        지도를 표시하려면 .env.local에 NEXT_PUBLIC_KAKAO_MAP_KEY를 설정해 주세요.
      </div>
    );
  }

  if (loadError) {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground ${boxClass}`}
      >
        <p className="font-medium text-foreground">
          지도를 불러오지 못했습니다.
        </p>
        <p className="max-w-sm text-xs leading-relaxed">
          카카오 디벨로퍼스 → 내 애플리케이션 → <strong>JavaScript 키</strong>(REST
          키 아님)를 쓰는지, 그리고 앱 설정 → <strong>플랫폼</strong> → Web에{" "}
          <strong className="text-foreground">
            {origin || "지금 브라우저 주소(포트 포함)"}
          </strong>
          가 등록돼 있는지 확인해 주세요.{" "}
          <code className="rounded bg-muted px-1">localhost:3000</code>만 넣었는데{" "}
          <code className="rounded bg-muted px-1">:3004</code>로 접속하면 지도가 막힙니다.
        </p>
        <p className="text-xs">
          <code className="rounded bg-muted px-1">.env.local</code> 수정 후 개발 서버를
          한번 재시작해야 합니다.
        </p>
      </div>
    );
  }

  if (normalizedSpots.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 p-6 text-center text-sm text-muted-foreground ${boxClass}`}
      >
        표시할 장소 좌표가 없습니다.
      </div>
    );
  }

  return (
    <>
      <Script
        src={kakaoMapSdkSrc()}
        strategy="afterInteractive"
        onLoad={(e) => {
          const el = e.currentTarget as HTMLScriptElement;
          el.setAttribute("data-kakao-loaded", "1");
          queueMicrotask(() => markSdkReady());
        }}
        onError={() => setLoadError(true)}
      />
      <div
        ref={containerRef}
        className={boxClass}
        role="presentation"
      />
    </>
  );
}
