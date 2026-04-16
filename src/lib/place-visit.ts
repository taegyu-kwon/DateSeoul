import type { Prisma, PrismaClient } from "@prisma/client";
import type { DateCourse } from "@/types/course";
import { placeKeyFromSpot } from "@/lib/place-key";

type PlaceWriter = Pick<PrismaClient, "place"> | Pick<Prisma.TransactionClient, "place">;

export async function recordPlaceVisitsFromCourse(
  db: PlaceWriter,
  course: DateCourse
): Promise<void> {
  const uniq = new Map<
    string,
    {
      name: string;
      address: string;
      lat: number;
      lng: number;
      category: string | null;
    }
  >();

  for (const spot of course.spots) {
    const name = spot.name.trim();
    const address = spot.address.trim();
    if (!name || !address) continue;
    if (!Number.isFinite(spot.lat) || !Number.isFinite(spot.lng)) continue;

    const key = placeKeyFromSpot({
      name,
      lat: spot.lat,
      lng: spot.lng,
    });
    if (uniq.has(key)) continue;
    uniq.set(key, {
      name,
      address,
      lat: spot.lat,
      lng: spot.lng,
      category: spot.category ?? null,
    });
  }

  for (const [placeKey, p] of Array.from(uniq.entries())) {
    await db.place.upsert({
      where: { placeKey },
      create: {
        placeKey,
        name: p.name,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        category: p.category,
        visitCount: 1,
      },
      update: {
        name: p.name,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        category: p.category,
        visitCount: { increment: 1 },
      },
    });
  }
}
