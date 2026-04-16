"use client";

function HeartPictogram({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        d="M12 21.35 10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
    </svg>
  );
}

export function LoadingCourseOverlay() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-6 px-6">
        <div className="relative flex size-20 items-center justify-center">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#FF6B6B]/30" />
          <span className="relative inline-flex size-14 items-center justify-center rounded-full bg-[#FF6B6B] text-white shadow-lg">
            <HeartPictogram className="size-7" />
          </span>
        </div>
        <p className="animate-pulse text-lg font-medium text-foreground">
          코스 생성 중…
        </p>
        <p className="max-w-xs text-center text-sm text-muted-foreground">
          장소를 조합하는 데 시간이 걸릴 수 있습니다.
          <br />
          잠시만 기다려 주세요.
        </p>
      </div>
    </div>
  );
}
