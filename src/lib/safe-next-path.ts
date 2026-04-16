/** 로그인 후 등에서 사용할 상대 경로만 허용 (오픈 리다이렉트 방지) */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "/";
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/";
  return t;
}
