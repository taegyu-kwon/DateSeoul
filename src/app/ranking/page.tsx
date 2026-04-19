import { Trophy } from "lucide-react";
import Link from "next/link";
import { RankingRow } from "@/components/ranking-row";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const R = {
  title: "\ub7ad\ud0b9",
  subtitle:
    "\uacf5\uac10 \uc218\ub97c \uae30\uc900\uc73c\ub85c \uc815\ub82c\ud569\ub2c8\ub2e4.",
  tabCourses: "\ucf54\uc2a4 \ub7ad\ud0b9",
  tabPlaces: "\uc7a5\uc18c \ub7ad\ud0b9",
  empty: "\uc544\uc9c1 \uacf5\uc720\ub41c \ucf54\uc2a4\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.",
  cta: "\ucf54\uc2a4 \ub9cc\ub4e4\uae30",
} as const;

export default async function RankingPage() {
  const user = await getSession();

  const rows = await prisma.sharedCourse.findMany({
    take: 50,
    orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      likeCount: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  });

  let likedIds = new Set<string>();
  if (user && rows.length > 0) {
    const likes = await prisma.courseLike.findMany({
      where: {
        userId: user.id,
        sharedCourseId: { in: rows.map((r) => r.id) },
      },
      select: { sharedCourseId: true },
    });
    likedIds = new Set(likes.map((l) => l.sharedCourseId));
  }

  const rowData = rows.map((r) => ({
    id: r.id,
    title: r.title,
    likeCount: r.likeCount,
    createdAt: r.createdAt.toISOString(),
    authorName: r.user.name,
  }));

  return (
    <div className="mx-auto max-w-lg px-[max(1rem,env(safe-area-inset-left))] pb-12 pe-[max(1rem,env(safe-area-inset-right))] pt-6 md:max-w-xl md:pt-10">
      <div className="mb-6 flex items-center gap-2">
        <Trophy className="-mt-1 size-7 text-[#FF6B6B]" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{R.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{R.subtitle}</p>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Link
          href="/ranking"
          className={cn(
            buttonVariants({ size: "sm" }),
            "h-10 rounded-xl text-center font-semibold"
          )}
          aria-current="page"
        >
          {R.tabCourses}
        </Link>
        <Link
          href="/ranking/places"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-10 rounded-xl text-center"
          )}
        >
          {R.tabPlaces}
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-muted-foreground/25 bg-muted/15 px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">{R.empty}</p>
          <Link
            href="/"
            className={cn(
              buttonVariants(),
              "mt-6 inline-flex rounded-xl shadow-md shadow-[#FF6B6B]/25"
            )}
          >
            {R.cta}
          </Link>
        </div>
      ) : (
        <ol className="space-y-2">
          {rowData.map((r, index) => {
            const rank = index + 1;
            const liked = user ? likedIds.has(r.id) : false;
            return (
              <RankingRow
                key={r.id}
                rank={rank}
                row={r}
                initiallyLiked={liked}
                loggedIn={!!user}
              />
            );
          })}
        </ol>
      )}
    </div>
  );
}
