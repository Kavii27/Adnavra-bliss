"use client";

import { useEffect, useState } from "react";

type Ad = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  destinationUrl: string;
};

/**
 * Renders whatever live ad(s) the admin has scheduled for `placement`
 * (see AdvertisementPlacement.key — homepage_top, homepage_middle,
 * search_results, category_page, city_page, salon_profile, booking_page).
 * Fetches from the existing public /api/marketplace/ads route, which
 * already handles scheduling, priority rotation, and impression logging
 * server-side. Renders nothing if there is no live ad for this slot, so
 * it is always safe to drop into a page unconditionally.
 */
export function AdSlot({ placement, className }: { placement: string; className?: string }) {
  const [ads, setAds] = useState<Ad[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/marketplace/ads?placement=${encodeURIComponent(placement)}`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json: { data?: Ad[] }) => {
        if (!cancelled) setAds(json.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setAds([]);
      });
    return () => {
      cancelled = true;
    };
  }, [placement]);

  if (!ads || ads.length === 0) return null;

  return (
    <div className={className ?? "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-12"}>
      <div className={`grid gap-4 ${ads.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {ads.map((ad) => (
          <a
            key={ad.id}
            href={ad.destinationUrl}
            target={ad.destinationUrl.startsWith("/") ? undefined : "_blank"}
            rel={ad.destinationUrl.startsWith("/") ? undefined : "noreferrer"}
            onClick={() => {
              // Fire-and-forget — never block navigation on this.
              fetch(`/api/marketplace/ads/${ad.id}/click`, { method: "POST" }).catch(() => {});
            }}
            className="group block overflow-hidden rounded-2xl border border-[#E5DDD0] shadow-[0_2px_10px_rgba(31,30,29,0.06)] transition hover:shadow-[0_8px_24px_rgba(31,30,29,0.12)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="h-auto w-full object-cover transition duration-300 group-hover:scale-[1.01]"
            />
          </a>
        ))}
      </div>
    </div>
  );
}
