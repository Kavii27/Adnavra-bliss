"use client";

import { VenueCard } from "./venue-card";
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
  fromPriceMinor?: number | null;
};

export function VenueGrid({
  businesses,
  emptyText,
}: {
  businesses: Venue[];
  emptyText?: string;
}) {
  const { t } = useLocale();
  const resolvedEmpty = emptyText ?? t("venue.defaultEmpty");
  if (businesses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E5DDD0] bg-white p-10 text-center">
        <p className="text-sm text-[#8A8377]">{resolvedEmpty}</p>
        <p className="mt-1 text-xs text-[#C9C1B4]">
          {t("venue.defaultEmptySub")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 [&>div]:w-full [&_a]:w-full">
      {businesses.map((b) => (
        <div key={b.id}>
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
            fromPriceMinor={b.fromPriceMinor}
          />
        </div>
      ))}
    </div>
  );
}
