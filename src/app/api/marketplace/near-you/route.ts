import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Haversine distance in km
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }
  const businesses = await db.business.findMany({
    where: { latitude: { not: null }, longitude: { not: null } },
    select: {
      id: true, name: true, slug: true, logoUrl: true, address: true, city: true,
      categories: true, salonTypes: true, latitude: true, longitude: true, marketplacePriority: true,
      services: { where: { isActive: true }, select: { category: true, price: true } },
    },
    take: 300,
  });
  const ranked = businesses
    .map((b) => ({ ...b, distanceKm: distanceKm(lat, lng, b.latitude as number, b.longitude as number) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 24);
  return NextResponse.json({ data: ranked });
}
