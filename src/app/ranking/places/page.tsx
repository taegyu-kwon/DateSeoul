import { Trophy } from "lucide-react";
import Link from "next/link";
import { PlaceRankingClient } from "@/components/place-ranking-client";
import { buttonVariants } from "@/components/ui/button";
import { extractSeoulGuFromAddress } from "@/lib/address-gu";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const L = {
  title: "\ub7ad\ud0b9",
  subtitle:
    "\ucf54\uc2a4\uc5d0\uc11c \uac00\uc7a5 \ub9ce\uc774 \ub4f1\uc7a5\ud55c \ub370\uc774\ud2b8 \uc7a5\uc18c\uc5d0\uc694.",
  tabCourses: "\ucf54\uc2a4 \ub7ad\ud0b9",
  tabPlaces: "\uc7a5\uc18c \ub7ad\ud0b9",
  empty:
    "\uc544\uc9c1 \uc9d1\uacc4\ub41c \uc7a5\uc18c\uac00 \uc5c6\uc5b4\uc694. \ucf54\uc2a4\ub97c \uc800\uc7a5\ud558\uac70\ub098 \uacf5\uc720\ud558\uba74 \uc7a5\uc18c \ubc29\ubb38 \uc218\uac00 \ub204\uc801\ub429\ub2c8\ub2e4.",
  cta: "\ucf54\uc2a4 \ub9cc\ub4e4\uae30",
} as const;

export default async function PlaceRankingPage() {
  const rows = await prisma.place.findMany({
    take: 100,
    orderBy: [{ visitCount: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      address: true,
      category: true,
      visitCount: true,
    },
  });

  return (
    <div className="mx-auto max-w-lg px-[max(1rem,env(safe-area-inset-left))] pb-12 pe-[max(1rem,env(safe-area-inset-right))] pt-6 md:max-w-xl md:pt-10">
      <div className="mb-6 flex items-center gap-2">
        <Trophy className="-mt-1 size-7 text-[#FF6B6B]" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{L.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{L.subtitle}</p>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Link
          href="/ranking"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-10 rounded-xl text-center"
          )}
        >
          {L.tabCourses}
        </Link>
        <Link
          href="/ranking/places"
          className={cn(
            buttonVariants({ size: "sm" }),
            "h-10 rounded-xl text-center font-semibold"
          )}
          aria-current="page"
        >
          {L.tabPlaces}
        </Link>
      </div>

      <PlaceRankingClient
        rows={rows.map((r) => ({
          id: r.id,
          name: r.name,
          address: r.address,
          category: r.category,
          visitCount: r.visitCount,
          gu: extractSeoulGuFromAddress(r.address),
        }))}
      />
      {rows.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-muted-foreground/25 bg-muted/15 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">{L.empty}</p>
          <Link
            href="/"
            className={cn(
              buttonVariants(),
              "mt-4 inline-flex rounded-xl shadow-md shadow-[#FF6B6B]/25"
            )}
          >
            {L.cta}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
