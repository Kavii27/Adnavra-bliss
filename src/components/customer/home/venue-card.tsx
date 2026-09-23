"use client";

import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import { getCategoryLabel } from "@/lib/categories";

type VenueCardProps = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  address?: string | null;
  city?: string | null;
  category?: string | null;
  categories?: string[] | null;
  salonTypes?: string[] | null;
  featured?: boolean | null;
};

export function VenueCard({ name, slug, logoUrl, address, city, category, categories, salonTypes, featured }: VenueCardProps) {
  const locationText = [address, city].filter(Boolean).join(" · ") || city || "Sri Lanka";
  // Prefer the full tag list; fall back to the legacy single category.
  // Salon-type tags (own column) come first so they survive the 2-tag slice.
  const tags: string[] = [...(salonTypes ?? []), ...(categories ?? [])].filter(
    (c): c is string => typeof c === "string" && c.length > 0,
  );
  const displayTags = (tags.length > 0 ? tags : category ? [category] : []).slice(0, 2);

  return (
    <Link
      href={`/${slug}`}
      className="group relative flex w-[260px] shrink-0 flex-col overflow-hidden rounded-xl border border-[#E5DDD0] bg-white transition hover:border-[#CCC6BD] hover:shadow-[0_4px_16px_rgba(16,24,40,0.08)]"
    >
      {/* Image / placeholder */}
      <div className="relative h-[156px] w-full overflow-hidden bg-[#F7F3ED]">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={name}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-sm font-semibold tracking-tight text-[#795831] border border-[#E5DDD0]">
              {name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        {/* Save heart — inert visual only, Task 3.2 */}
        <button
          type="button"
          aria-label="Save"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur border border-white shadow-sm hover:bg-white transition"
        >
          <Heart className="h-4 w-4 text-[#4A4640]" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {featured === true && (
          <span className="inline-flex w-fit items-center rounded-full bg-[#795831] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Featured
          </span>
        )}
        <p className="line-clamp-1 text-[14px] font-semibold leading-tight text-[#1F1E1D]">{name}</p>
        <p className="line-clamp-1 flex items-center gap-1 text-xs leading-relaxed text-[#8A8377]">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{locationText}</span>
        </p>
        {displayTags.length > 0 && (
          <span className="mt-1 flex flex-wrap gap-1">
            {displayTags.map((t) => (
              <span key={t} className="inline-flex w-fit rounded-full bg-[#F7F3ED] px-2.5 py-1 text-[11px] font-medium tracking-wide text-[#4A4640]">
                {getCategoryLabel(t)}
              </span>
            ))}
          </span>
        )}
      </div>
    </Link>
  );
}
