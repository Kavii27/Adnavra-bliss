"use client";

import { useState } from "react";
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

type Tab = {
  key: string;
  label: string;
  businesses: Venue[];
  emptyText?: string;
};

export function VenueRailTabs({
  tabs,
  href = "/customer/search",
}: {
  tabs: Tab[];
  href?: string;
}) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  const { t } = useLocale();
  const current = tabs.find((tab) => tab.key === active) ?? tabs[0];

  return (
    <section className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 lg:px-10 max-w-[1600px] mx-auto">
        <h2 className="text-lg font-semibold tracking-tight text-[#1F1E1D]">
          {t("venue.spasTitle")}
        </h2>

        <div className="flex items-center gap-3">
          {/* Filter tabs — top right of the row */}
          <div className="flex items-center gap-1 rounded-full border border-[#E5DDD0] bg-white p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActive(tab.key)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                  active === tab.key
                    ? "bg-[#2A1D12] text-white shadow-sm"
                    : "text-[#4A4640] hover:text-[#1F1E1D]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {href ? (
            <Link
              href={href}
              className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-[#795831] hover:underline"
            >
              {t("home.seeAll")} <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>

      {!current || current.businesses.length === 0 ? (
        <div className="px-6 lg:px-10 max-w-[1600px] mx-auto mt-4">
          <div className="rounded-xl border border-dashed border-[#E5DDD0] bg-white p-8 text-center">
            <p className="text-sm text-[#8A8377]">
              {current?.emptyText ?? t("venue.noVenues")}
            </p>
            <p className="mt-1 text-xs text-[#C9C1B4]">
              {t("venue.defaultEmptySub")}
            </p>
          </div>
        </div>
      ) : (
        <Reveal
          key={current.key}
          className="mt-4 px-6 lg:px-10 max-w-[1600px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 reveal-stagger"
        >
          {current.businesses.slice(0, 12).map((b) => (
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
      )}
    </section>
  );
}
