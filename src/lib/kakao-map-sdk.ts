const KAKAO_SDK_BASE = "https://dapi.kakao.com/v2/maps/sdk.js";

/** Geocoder 등 services 라이브러리 포함 (역지오코딩·지도 공통) */
export function kakaoMapSdkSrc(): string {
  const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "";
  return `${KAKAO_SDK_BASE}?appkey=${encodeURIComponent(key)}&autoload=false&libraries=services`;
}
