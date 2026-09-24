"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { VenueCard } from "./venue-card";
import { Reveal } from "./reveal";

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

/**
 * A single marketplace row: title on the left, "See all >" on the right —
 * no filter tabs. Used to stack multiple rows (Recommended near you,
 * New to Adnavra Bliss, etc.) on the homepage.
 */
export function VenueRailRow({
  title,
  businesses,
  emptyText = "No venues to show yet.",
  href = "/customer/search",
}: {
  title: string;
  businesses: Venue[];
  emptyText?: string;
  href?: string;
}) {
  return (
    <section className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <h2 className="text-lg font-semibold tracking-tight text-[#1F1E1D]">{title}</h2>

        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm font-medium text-[#795831] hover:underline"
          >
            See all <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      {businesses.length === 0 ? (
        <div className="px-6 lg:px-12 max-w-[1400px] mx-auto mt-4">
          <div className="rounded-xl border border-dashed border-[#E5DDD0] bg-white p-8 text-center">
            <p className="text-sm text-[#8A8377]">{emptyText}</p>
            <p className="mt-1 text-xs text-[#C9C1B4]">
              Salons will appear here as soon as they join ADNAVRA.
            </p>
          </div>
        </div>
      ) : (
        <Reveal className="mt-4 grid grid-cols-2 gap-5 px-6 pb-2 sm:grid-cols-3 lg:grid-cols-5 lg:px-12 max-w-[1400px] mx-auto reveal-stagger">
          {businesses.slice(0, 5).map((b) => (
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
        </Reveal>
      )}
    </section>
  );
}
