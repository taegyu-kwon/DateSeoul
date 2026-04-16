"use client";

import Script from "next/script";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { kakaoMapSdkSrc } from "@/lib/kakao-map-sdk";
import { SEOUL_GU } from "@/lib/seoul-areas";
import { cn } from "@/lib/utils";

type PlaceRow = {
  id: string;
  name: string;
  address: string;
  category: string | null;
  visitCount: number;
  gu: string | null;
};

const GU_CENTER: Record<string, { lat: number; lng: number }> = {
  강남구: { lat: 37.5172, lng: 127.0473 },
  강동구: { lat: 37.5301, lng: 127.1238 },
  강북구: { lat: 37.6397, lng: 127.0255 },
  강서구: { lat: 37.5509, lng: 126.8495 },
  관악구: { lat: 37.4784, lng: 126.9516 },
  광진구: { lat: 37.5384, lng: 127.0822 },
  구로구: { lat: 37.4954, lng: 126.8874 },
  금천구: { lat: 37.4569, lng: 126.8956 },
  노원구: { lat: 37.6542, lng: 127.0568 },
  도봉구: { lat: 37.6688, lng: 127.0472 },
  동대문구: { lat: 37.5744, lng: 127.0396 },
  동작구: { lat: 37.5124, lng: 126.9393 },
  마포구: { lat: 37.5663, lng: 126.9019 },
  서대문구: { lat: 37.5792, lng: 126.9368 },
  서초구: { lat: 37.4837, lng: 127.0324 },
  성동구: { lat: 37.5633, lng: 127.0371 },
  성북구: { lat: 37.5894, lng: 127.0167 },
  송파구: { lat: 37.5145, lng: 127.1059 },
  양천구: { lat: 37.517, lng: 126.8666 },
  영등포구: { lat: 37.5264, lng: 126.8962 },
  용산구: { lat: 37.5323, lng: 126.99 },
  은평구: { lat: 37.6027, lng: 126.9291 },
  종로구: { lat: 37.5735, lng: 126.979 },
  중구: { lat: 37.5638, lng: 126.9976 },
  중랑구: { lat: 37.6066, lng: 127.0927 },
};

const M = {
  all: "전체",
  mapTitle: "지역 선택",
  mapHint: "선택한 구의 인기 데이트 장소만 모아 보여드려요.",
  emptyByGu: "선택한 구에 집계된 장소가 없어요.",
  visits: "방문",
} as const;

type GuOverlay = {
  node: HTMLButtonElement;
  overlay: {
    setMap: (map: unknown) => void;
  };
};

export function PlaceRankingClient({ rows }: { rows: PlaceRow[] }) {
  const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "";
  const [selectedGu, setSelectedGu] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const overlayRef = useRef<Record<string, GuOverlay>>({});

  const filtered = useMemo(() => {
    if (!selectedGu) return rows;
    return rows.filter((r) => r.gu === selectedGu);
  }, [rows, selectedGu]);

  const markSdkReady = useCallback(() => {
    if (typeof window !== "undefined" && window.kakao?.maps) {
      setSdkReady(true);
      setLoadError(false);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (!key || typeof window === "undefined") return;
    if (markSdkReady()) return;
    const t = window.setInterval(() => {
      if (markSdkReady()) {
        window.clearInterval(t);
      }
    }, 60);
    const max = window.setTimeout(() => window.clearInterval(t), 15_000);
    return () => {
      window.clearInterval(t);
      window.clearTimeout(max);
    };
  }, [key, markSdkReady]);

  useEffect(() => {
    if (!sdkReady || !mapRef.current || !window.kakao?.maps) return;
    if (typeof window.kakao.maps.load !== "function") {
      setLoadError(true);
      return;
    }

    window.kakao.maps.load(() => {
      try {
        const { kakao } = window;
        const map = new kakao.maps.Map(mapRef.current as HTMLDivElement, {
          center: new kakao.maps.LatLng(37.5665, 126.978),
          level: 8,
        });
        mapInstanceRef.current = map;

        const next: Record<string, GuOverlay> = {};
        for (const gu of SEOUL_GU) {
          const c = GU_CENTER[gu];
          if (!c) continue;

          const node = document.createElement("button");
          node.type = "button";
          node.className =
            "flex min-w-[3rem] items-center justify-center rounded-full border px-2 py-1 text-[11px] font-semibold shadow-sm outline-none focus:outline-none focus-visible:outline-none";
          node.style.outline = "none";
          node.style.setProperty("-webkit-tap-highlight-color", "transparent");
          node.textContent = gu;
          node.onclick = (e) => {
            e.preventDefault();
            setSelectedGu((prev) => (prev === gu ? null : gu));
          };

          const overlay = new kakao.maps.CustomOverlay({
            position: new kakao.maps.LatLng(c.lat, c.lng),
            content: node,
            yAnchor: 1,
          });
          overlay.setMap(map);
          next[gu] = { node, overlay };
        }
        overlayRef.current = next;

        // Map tiles can fail to paint if container layout settles late.
        const safeRelayout = () => {
          try {
            map.relayout();
          } catch {
            // noop
          }
        };
        requestAnimationFrame(safeRelayout);
        window.setTimeout(safeRelayout, 200);
      } catch (e) {
        console.error("[PlaceRankingClient] map init failed:", e);
        setLoadError(true);
      }
    });

    return () => {
      Object.values(overlayRef.current).forEach((o) => o.overlay.setMap(null));
      overlayRef.current = {};
      mapInstanceRef.current = null;
    };
  }, [sdkReady]);

  useEffect(() => {
    const map = mapInstanceRef.current as
      | {
          panTo: (latLng: unknown) => void;
        }
      | null;
    if (!map || !window.kakao?.maps) return;

    for (const gu of SEOUL_GU) {
      const item = overlayRef.current[gu];
      if (!item) continue;
      const active = selectedGu === gu;
      item.node.style.background = active ? "#ff6b6b" : "white";
      item.node.style.color = active ? "white" : "#334155";
      item.node.style.borderColor = active ? "#ff6b6b" : "#cbd5e1";
    }

    if (selectedGu && GU_CENTER[selectedGu]) {
      const c = GU_CENTER[selectedGu];
      const pos = new window.kakao.maps.LatLng(c.lat, c.lng);
      map.panTo(pos);
    }
  }, [selectedGu]);

  return (
    <>
      {key ? (
        <Script
          src={kakaoMapSdkSrc()}
          strategy="afterInteractive"
          onLoad={() => queueMicrotask(() => markSdkReady())}
          onError={() => setLoadError(true)}
        />
      ) : null}

      <div className="mb-3 rounded-xl border border-border bg-card p-3">
        <p className="text-sm font-semibold text-foreground">{M.mapTitle}</p>
        <p className="mt-1 text-xs text-muted-foreground">{M.mapHint}</p>

        <div className="mt-2 rounded-lg border border-border/70 bg-muted/20 p-2">
          <div className="relative h-[16rem] w-full overflow-hidden rounded-md bg-gradient-to-b from-[#fffdf9] to-[#f5f1ea]">
            <div
              ref={mapRef}
              className={cn(
                "absolute inset-0",
                !key || loadError ? "opacity-0" : "opacity-100"
              )}
            />
            {!key || loadError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4 text-center">
                <p className="text-xs font-medium text-foreground">
                  지도를 불러오지 못했어요.
                </p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  카카오 콘솔 Web 플랫폼에 현재 주소(포트 포함)를 등록해 주세요.
                  {typeof window !== "undefined"
                    ? ` (${window.location.origin})`
                    : ""}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedGu(null)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs outline-none focus:outline-none focus-visible:outline-none",
              selectedGu === null
                ? "border-[#FF6B6B] bg-[#FF6B6B]/10 text-[#FF6B6B]"
                : "border-border bg-background text-muted-foreground"
            )}
          >
            {M.all}
          </button>
          {SEOUL_GU.map((gu) => (
            <button
              key={gu}
              type="button"
              onClick={() => setSelectedGu((prev) => (prev === gu ? null : gu))}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs outline-none focus:outline-none focus-visible:outline-none",
                selectedGu === gu
                  ? "border-[#FF6B6B] bg-[#FF6B6B]/10 text-[#FF6B6B]"
                  : "border-border bg-background text-muted-foreground"
              )}
            >
              {gu}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-muted-foreground/25 bg-muted/15 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">{M.emptyByGu}</p>
        </div>
      ) : (
        <ol className="space-y-2">
          {filtered.map((r, index) => {
            const rank = index + 1;
            return (
              <li
                key={`${r.id}-${selectedGu ?? "all"}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
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
                  <p className="truncate font-medium leading-snug text-foreground">
                    {r.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {r.address}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {r.visitCount.toLocaleString("ko-KR")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{M.visits}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground">
                  <MapPin className="size-3" />
                  {r.gu || r.category || "장소"}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
