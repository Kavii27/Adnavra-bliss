"use client";

import Link from "next/link";
import { MapPin, BadgeCheck, ArrowUpRight } from "lucide-react";
import { taxonomyLabelKey } from "@/lib/categories";
import { useLocale } from "@/lib/i18n/locale-context";

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
  const { t } = useLocale();
  // Prefer the full tag list; fall back to the legacy single category.
  // Salon-type tags (own column) come first so they survive the 2-tag slice.
  const tags: string[] = [...(salonTypes ?? []), ...(categories ?? [])].filter(
    (c): c is string => typeof c === "string" && c.length > 0,
  );
  const displayTags = (tags.length > 0 ? tags : category ? [category] : []).slice(0, 2);
  const badgeLabel = displayTags[0] ? t(taxonomyLabelKey(displayTags[0])) : null;

  return (
    <Link
      href={`/${slug}`}
      className="group card-lift relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-[#E5DDD0] bg-white hover:border-[#CCC6BD]"
    >
      {/* Image / logo area */}
      <div className="relative h-[156px] w-full overflow-hidden bg-[#F7F3ED]">
        {logoUrl ? (
          // Logo is shown fully (contain), not cropped into a circle.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-white text-sm font-semibold tracking-tight text-[#795831] border border-[#E5DDD0]">
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
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {featured === true && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#795831] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            <BadgeCheck className="h-3 w-3" /> {t("venue.featured")}
          </span>
        )}
        <p className="line-clamp-1 flex items-center gap-1 text-[11px] font-medium text-[#795831]">
          <BadgeCheck className="h-3 w-3" /> {t("venue.verified")} &middot; {city ?? "Sri Lanka"}
        </p>
        <p className="line-clamp-1 text-[14px] font-semibold leading-tight text-[#1F1E1D]">{name}</p>
        <p className="line-clamp-1 flex items-center gap-1 text-xs leading-relaxed text-[#8A8377]">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{locationText}</span>
        </p>
        {displayTags.length > 0 && (
          <span className="mt-1 flex flex-wrap gap-1">
            {displayTags.map((tag) => (
              <span key={tag} className="inline-flex w-fit rounded-full bg-[#F7F3ED] px-2.5 py-1 text-[11px] font-medium tracking-wide text-[#4A4640]">
                {t(taxonomyLabelKey(tag))}
              </span>
            ))}
          </span>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <div>
            {fromPriceMinor != null ? (
              <>
                <p className="text-[10px] uppercase tracking-wide text-[#8A8377]">{t("venue.from")}</p>
                <p className="text-sm font-semibold text-[#1F1E1D]">{formatFromPrice(fromPriceMinor)}</p>
              </>
            ) : (
              <span />
            )}
          </div>
          <span className="icon-pop inline-flex items-center gap-1 rounded-lg bg-[#2A1D12] px-3 py-2 text-[11px] font-semibold text-white group-hover:bg-[#17100A]">
            {t("venue.visit")} <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
