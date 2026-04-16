import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteAuthNav } from "@/components/site-auth-nav";
import { cn } from "@/lib/utils";

/** CSS 번들 오류 시에도 배경이 흰색으로 보이지 않도록 하는 폴백 */
const APP_SURFACE = "#fff9f0";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: APP_SURFACE,
};

export const metadata: Metadata = {
  title: "데이트 서울 | Date Seoul",
  description:
    "예산과 위치에 맞춘 서울 데이트 코스를 AI가 제안하고, 지도로 동선을 보여 드려요.",
  openGraph: {
    title: "데이트 서울",
    description: "서울 커플을 위한 예산 기반 데이트 코스 추천",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className="min-h-full overflow-x-hidden bg-background font-sans"
      style={{ backgroundColor: APP_SURFACE }}
      suppressHydrationWarning
    >
      <body
        className={cn(
          "min-h-dvh min-h-screen overflow-x-hidden bg-background font-sans text-foreground antialiased"
        )}
        style={{ backgroundColor: APP_SURFACE }}
      >
        <SiteAuthNav />
        {children}
      </body>
    </html>
  );
}
