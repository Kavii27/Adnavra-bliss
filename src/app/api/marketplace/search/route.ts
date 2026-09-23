import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
    },
    take: 200,
  });

  const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lng);
  // Step 6.4 — Featured follows the Premium plan, not just the flag. The flag
  // is the owner's opt-in (marketing → priority placement, PREMIUM-gated; or
  // the Step-9 admin screen which sets it on upgrade). Gating it here keeps a
  // stale `true` from boosting a salon after it downgrades off PREMIUM.
  const withDistance = businesses
    .map(({ subscription, marketplacePriority, ...b }) => ({
      ...b,
      marketplacePriority: marketplacePriority && subscription?.plan === "PREMIUM",
      distanceKm: hasCoords ? distanceKm(lat, lng, b.latitude!, b.longitude!) : null,
    }))
    .filter((b) => !hasCoords || b.distanceKm! <= radiusKm)
    // Priority placement (PREMIUM campaigns feature) sorts boosted salons
    // first; distance still decides order within each tier.
    .sort((a, b) => {
      if (a.marketplacePriority !== b.marketplacePriority) return a.marketplacePriority ? -1 : 1;
      return (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
    });

  return NextResponse.json({ data: withDistance });
}
