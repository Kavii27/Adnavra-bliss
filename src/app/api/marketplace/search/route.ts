import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rankBusinessIds } from "@/lib/ranking-service";

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * GET /api/marketplace/search?lat=&lng=&radiusKm=&category=&salonType=&q=
 * Public endpoint. Returns only non-sensitive fields needed for discovery.
 * Does not require auth, does not touch /api/businesses (owner-scoped route).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const radiusKm = parseFloat(searchParams.get("radiusKm") ?? "10");
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const salonTypeParam = searchParams.get("salonType") ?? searchParams.get("salonTypes");
  // Advanced search sends the salon-type picker as `category`, which the OR
  // below already matches against `salonTypes`; an explicit `salonType` param
  // is also honored for forward-compatibility.

  const businesses = await db.business.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      ...(category
        ? {
            OR: [
              { categories: { has: category } },
              { salonTypes: { has: category } },
              { services: { some: { category, isActive: true } } },
            ],
          }
        : {}),
      ...(salonTypeParam
        ? { salonTypes: { has: salonTypeParam } }
        : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      address: true,
      city: true,
      categories: true,
      salonTypes: true,
      latitude: true,
      longitude: true,
      marketplacePriority: true,
      subscription: { select: { plan: true } },
      images: {
        where: { kind: "cover" },
        take: 1,
        select: { url: true },
      },
    },
    take: 200,
  });

  const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lng);
  // Legacy flag kept for the (soon to be replaced) old Subscription model —
  // real ranking below now comes from the new BusinessSubscription/SalonBoost
  // system via lib/ranking-service.ts, not from this boolean.
  const withDistance = businesses
    .map(({ subscription, marketplacePriority, images, ...b }) => ({
      ...b,
      coverUrl: images[0]?.url ?? null,
      marketplacePriority: marketplacePriority && subscription?.plan === "PREMIUM",
      distanceKm: hasCoords ? distanceKm(lat, lng, b.latitude!, b.longitude!) : null,
    }))
    .filter((b) => !hasCoords || b.distanceKm! <= radiusKm);

  const distanceById = new Map(withDistance.map((b) => [b.id, b.distanceKm]));
  const rankingById = await rankBusinessIds(
    withDistance.map((b) => b.id),
    distanceById
  );

  // Every business is scored (Silver included) — a plan never fully hides
  // another one from search; boosting/priority just changes the order.
  const ranked = withDistance
    .map((b) => ({ ...b, ...(rankingById.get(b.id) ?? { score: 0, isBoosted: false, planKey: null }) }))
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({ data: ranked });
}
