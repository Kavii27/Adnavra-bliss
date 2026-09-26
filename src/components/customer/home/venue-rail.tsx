"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { VenueCard } from "./venue-card";
import { Reveal } from "./reveal";
import { useLocale } from "@/lib/i18n/locale-context";

type Venue = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  category?: string | null;
  categories?: string[] | null;
  salonTypes?: string[] | null;
  featured?: boolean | null;
  boosted?: boolean | null;
  fromPriceMinor?: number | null;
};

type VenueRailProps = {
  title: string;
  businesses: Venue[];
  href?: string;
  emptyText?: string;
  /** Render as a wrapping grid (matches reference layout) instead of a horizontal scroll rail. */
  layout?: "rail" | "grid";
};

export function VenueRail({ title, businesses, href, emptyText, layout = "rail" }: VenueRailProps) {
  const { t } = useLocale();
  const resolvedEmpty = emptyText ?? t("venue.noVenues");
  return (
    <section className="py-8">
      <div className="flex items-center justify-between px-6 lg:px-10 max-w-[1600px] mx-auto">
        <h2 className="text-lg font-semibold tracking-tight text-[#1F1E1D]">{title}</h2>
        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm font-medium text-[#795831] hover:underline"
          >
            {t("home.seeAll")} <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      {businesses.length === 0 ? (
        <div className="px-6 lg:px-10 max-w-[1600px] mx-auto mt-4">
          <div className="rounded-xl border border-dashed border-[#E5DDD0] bg-white p-8 text-center">
            <p className="text-sm text-[#8A8377]">{resolvedEmpty}</p>
            <p className="mt-1 text-xs text-[#C9C1B4]">
              {t("venue.defaultEmptySub")}
            </p>
          </div>
        </div>
      ) : layout === "grid" ? (
        <Reveal
          className="mt-4 px-6 lg:px-10 max-w-[1600px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 reveal-stagger"
        >
          {businesses.slice(0, 4).map((b) => (
            <div key={b.id} className="w-full [&>a]:w-full">
              <VenueCard
                id={b.id}
                name={b.name}
                slug={b.slug}
                logoUrl={b.logoUrl}
                address={b.address}
                city={b.city}
                category={b.category}
                categories={b.categories}
                salonTypes={b.salonTypes}
                featured={b.featured}
                boosted={b.boosted}
                fromPriceMinor={b.fromPriceMinor}
              />
            </div>
          ))}
        </Reveal>
      ) : (
        <div className="mt-4 overflow-x-auto scrollbar-thin">
          <div className="flex gap-4 px-6 lg:px-10 max-w-[1600px] mx-auto pb-2">
            {businesses.map((b) => (
              <VenueCard
                key={b.id}
                id={b.id}
                name={b.name}
                slug={b.slug}
                logoUrl={b.logoUrl}
                address={b.address}
                city={b.city}
                category={b.category}
                categories={b.categories}
                salonTypes={b.salonTypes}
                featured={b.featured}
                boosted={b.boosted}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
