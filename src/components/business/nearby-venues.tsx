"use client";

import { useEffect, useState } from "react";
import { VenueRail } from "@/components/customer/home/venue-rail";

type NearbyVenue = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  distanceKm?: number | null;
};

// Props driven by the business profile's own coordinates
export function NearbyVenues({
  businessId,
  latitude,
  longitude,
  radiusKm = 15,
}: {
  businessId: string;
  latitude: number;
  longitude: number;
  radiusKm?: number;
}) {
  const [venues, setVenues] = useState<NearbyVenue[] | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams({
      lat: String(latitude),
      lng: String(longitude),
      radiusKm: String(radiusKm),
    });
    fetch(`/api/marketplace/search?${qs.toString()}`)
      .then((r) => r.json())
      .then((j) => {
        const raw: NearbyVenue[] = Array.isArray(j.data) ? j.data : [];
        // Exclude the current business itself
        const filtered = raw.filter((v) => v.id !== businessId);
        // marketplace search already sorts by distance; keep first 8
        setVenues(filtered.slice(0, 8));
      })
      .catch(() => setVenues([]));
  }, [businessId, latitude, longitude, radiusKm]);

  if (venues === null) {
    return (
      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight text-[#1F1E1D]">Nearby venues</h2>
        <div className="mt-4 flex gap-4 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[220px] w-[260px] shrink-0 animate-pulse rounded-xl border border-[#E5DDD0] bg-[#F7F3ED]" />
          ))}
        </div>
      </section>
    );
  }

  if (venues.length === 0) return null;

  // Map to VenueRail shape (category not returned by search API — omit, VenueRail handles null)
  const businesses = venues.map((v) => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    logoUrl: v.logoUrl,
    address: v.address,
    city: v.city,
    category: null as string | null,
  }));

  return (
    <div className="mt-10 [&>section]:px-0 [&>section]:mx-0">
      <VenueRail title="Nearby venues" businesses={businesses} href="/customer/search" emptyText="No nearby venues found." />
    </div>
  );
}
