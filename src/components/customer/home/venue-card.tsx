"use client";

import Link from "next/link";
import { Heart, MapPin, BadgeCheck, ArrowUpRight } from "lucide-react";
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
  fromPriceMinor?: number | null;
};

function formatFromPrice(minor: number): string {
  return (minor / 100).toLocaleString("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  });
}

export function VenueCard({
  name,
  slug,
  logoUrl,
  address,
  city,
  category,
  categories,
  salonTypes,
  featured,
  fromPriceMinor,
}: VenueCardProps) {
  const locationText = [address, city].filter(Boolean).join(" · ") || city || "Sri Lanka";
  // Prefer the full tag list; fall back to the legacy single category.
  // Salon-type tags (own column) come first so they survive the 2-tag slice.
  const tags: string[] = [...(salonTypes ?? []), ...(categories ?? [])].filter(
    (c): c is string => typeof c === "string" && c.length > 0,
  );
  const displayTags = (tags.length > 0 ? tags : category ? [category] : []).slice(0, 2);
  const badgeLabel = displayTags[0] ? getCategoryLabel(displayTags[0]) : null;

  return (
    <Link
      href={`/${slug}`}
      className="group card-lift relative flex w-[260px] shrink-0 flex-col overflow-hidden rounded-xl border border-[#E5DDD0] bg-white hover:border-[#CCC6BD]"
    >
      {/* Image / placeholder */}
      <div className="relative h-[156px] w-full overflow-hidden bg-[#F7F3ED]">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-sm font-semibold tracking-tight text-[#795831] border border-[#E5DDD0]">
              {name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        {/* Category badge, top-left */}
        {badgeLabel && (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#1F1E1D] shadow-sm">
            {badgeLabel}
          </span>
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
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#795831] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            <BadgeCheck className="h-3 w-3" /> Featured
          </span>
        )}
        <p className="line-clamp-1 flex items-center gap-1 text-[11px] font-medium text-[#795831]">
          <BadgeCheck className="h-3 w-3" /> Verified Partner &middot; {city ?? "Sri Lanka"}
        </p>
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

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <div>
            {fromPriceMinor != null ? (
              <>
                <p className="text-[10px] uppercase tracking-wide text-[#8A8377]">From</p>
                <p className="text-sm font-semibold text-[#1F1E1D]">{formatFromPrice(fromPriceMinor)}</p>
              </>
            ) : (
              <span />
            )}
          </div>
          <span className="icon-pop inline-flex items-center gap-1 rounded-lg bg-[#2A1D12] px-3 py-2 text-[11px] font-semibold text-white group-hover:bg-[#17100A]">
            Book <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
