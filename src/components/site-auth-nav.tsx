import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

const NAV = {
  ranking: "\ub7ad\ud0b9",
  nameSuffix: "\ub2d8",
} as const;

export async function SiteAuthNav() {
  const user = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-card/85 pt-[env(safe-area-inset-top)] backdrop-blur-md supports-[backdrop-filter]:bg-card/70">
      <div className="mx-auto flex max-w-lg items-center gap-2 px-[max(1rem,env(safe-area-inset-left))] py-2.5 pe-[max(1rem,env(safe-area-inset-right))] md:max-w-xl md:gap-3 md:py-3">
        <Link
          href="/"
          className="mr-auto touch-manipulation py-1 text-base font-black tracking-tight text-[#FF6B6B] hover:opacity-90 md:text-lg"
        >
          Date Seoul
        </Link>
        <Link
          href="/ranking"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "h-9 min-h-11 shrink-0 touch-manipulation px-2 text-muted-foreground md:h-8 md:min-h-0 md:px-3"
          )}
        >
          {NAV.ranking}
        </Link>
        {user ? (
          <>
            <Link
              href="/my-courses"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-9 min-h-11 shrink-0 touch-manipulation px-2 text-muted-foreground md:h-8 md:min-h-0 md:px-3"
              )}
            >
              <span className="sm:hidden">저장</span>
              <span className="hidden sm:inline">저장한 코스</span>
            </Link>
            <span className="max-w-[28%] truncate text-xs text-muted-foreground sm:max-w-[36%] sm:text-sm">
              {`${user.name}${NAV.nameSuffix}`}
            </span>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "h-9 min-h-11 touch-manipulation px-3 text-muted-foreground md:h-8 md:min-h-0"
              )}
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "sm" }),
                "h-9 min-h-11 touch-manipulation rounded-lg bg-primary px-3 text-primary-foreground shadow-sm md:h-8 md:min-h-0"
              )}
            >
              회원가입
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
