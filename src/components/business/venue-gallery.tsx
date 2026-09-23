"use client";

import { useState } from "react";

export type VenuePhoto = {
  id: string;
  url: string;
  kind: string;
};

// Featured photo + a grid of clickable thumbnails ("The Space" section).
// Server page passes the gallery photos. Renders nothing when empty.
export function VenueGallery({ photos, venueName }: { photos: VenuePhoto[]; venueName: string }) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) return null;

  const index = Math.min(active, photos.length - 1);
  const current = photos[index];

  return (
    <div aria-label={`${venueName} photos`}>
      <div className="overflow-hidden rounded-2xl border border-[#E9E1D3] bg-[#F1E9DC] shadow-[0_2px_10px_rgba(30,28,26,0.08)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={`${venueName} photo ${index + 1} of ${photos.length}`}
          className="aspect-[16/9] w-full object-cover sm:aspect-[2/1]"
        />
      </div>

      {photos.length > 1 && (
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4" role="tablist" aria-label="Photo thumbnails">
          {photos.map((p, i) => {
            const selected = i === index;
            return (
              <button
                key={p.id}
                role="tab"
                aria-selected={selected}
                aria-label={`View photo ${i + 1}`}
                onClick={() => setActive(i)}
                className={`aspect-[4/3] overflow-hidden rounded-xl border-2 transition ${
                  selected ? "border-[#9A7B4F]" : "border-transparent opacity-75 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
