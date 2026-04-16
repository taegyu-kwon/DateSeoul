import { kakaoMapSdkSrc } from "@/lib/kakao-map-sdk";

let scriptInflight: Promise<void> | null = null;

function kakaoSdkScriptEl(): HTMLScriptElement | null {
  return document.querySelector<HTMLScriptElement>(
    'script[src*="dapi.kakao.com/v2/maps/sdk.js"]'
  );
}

/** 카카오 Maps JS가 window에 올라올 때까지 (이미 페이지에 스크립트가 있으면 그걸 사용) */
function ensureKakaoScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window"));
  }
  if (window.kakao?.maps) {
    return Promise.resolve();
  }
  if (scriptInflight) return scriptInflight;

  scriptInflight = new Promise((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY?.trim();
    if (!key) {
      scriptInflight = null;
      reject(new Error("no map key"));
      return;
    }

    const finish = () => {
      if (window.kakao?.maps) resolve();
      else {
        scriptInflight = null;
        reject(new Error("kakao"));
      }
    };

    const existing = kakaoSdkScriptEl();
    if (existing) {
      if (existing.getAttribute("data-kakao-loaded") === "1") {
        queueMicrotask(finish);
        return;
      }
      existing.addEventListener(
        "load",
        () => {
          existing.setAttribute("data-kakao-loaded", "1");
          finish();
        },
        { once: true }
      );
      existing.addEventListener(
        "error",
        () => {
          scriptInflight = null;
          reject(new Error("script"));
        },
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = kakaoMapSdkSrc();
    script.addEventListener("load", () => {
      script.setAttribute("data-kakao-loaded", "1");
      finish();
    });
    script.addEventListener("error", () => {
      scriptInflight = null;
      reject(new Error("script"));
    });
    document.head.appendChild(script);
  });

  return scriptInflight;
}

function runAfterKakaoMapsLoad(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      window.kakao.maps.load(() => resolve());
    } catch {
      reject(new Error("kakao.maps.load"));
    }
  });
}

type KakaoAddressDoc = {
  address_name?: string;
  region_1depth_name?: string;
  region_2depth_name?: string;
  region_3depth_name?: string;
};

type Coord2AddrResult = {
  address?: KakaoAddressDoc;
  road_address?: KakaoAddressDoc | null;
};

/** 좌표 → "서울 강남구 역삼동" 형태 (카카오 지번 주소 기준) */
export async function reverseGeocodeToNeighborhoodLabel(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    await ensureKakaoScript();
    await runAfterKakaoMapsLoad();
  } catch {
    return null;
  }

  if (!window.kakao?.maps?.services?.Geocoder) {
    return null;
  }

  const { kakao } = window;

  return new Promise((resolve) => {
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.coord2Address(
      lng,
      lat,
      (result: Coord2AddrResult[], status: unknown) => {
        if (status !== kakao.maps.services.Status.OK || !result?.[0]) {
          resolve(null);
          return;
        }
        const doc = result[0].address ?? result[0].road_address;
        if (!doc) {
          resolve(null);
          return;
        }
        const r1 = doc.region_1depth_name?.trim() ?? "";
        const r2 = doc.region_2depth_name?.trim() ?? "";
        const r3 = doc.region_3depth_name?.trim() ?? "";
        const joined = [r1, r2, r3].filter(Boolean).join(" ");
        if (joined) {
          resolve(joined);
          return;
        }
        const name = doc.address_name?.trim();
        resolve(name ?? null);
      }
    );
  });
}
