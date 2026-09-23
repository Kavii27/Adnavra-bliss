import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { VenueCard } from "./venue-card";

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
};

type VenueRailProps = {
  title: string;
  businesses: Venue[];
  href?: string;
  emptyText?: string;
};

export function VenueRail({ title, businesses, href, emptyText }: VenueRailProps) {
  return (
    <section className="py-8">
      <div className="flex items-center justify-between px-6 lg:px-12 max-w-[1200px] mx-auto">
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
        <div className="px-6 lg:px-12 max-w-[1200px] mx-auto mt-4">
          <div className="rounded-xl border border-dashed border-[#E5DDD0] bg-white p-8 text-center">
            <p className="text-sm text-[#8A8377]">{emptyText ?? "No venues to show yet."}</p>
            <p className="mt-1 text-xs text-[#C9C1B4]">
              Salons will appear here as soon as they join ADNAVRA.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto scrollbar-thin">
          <div className="flex gap-4 px-6 lg:px-12 max-w-[1200px] mx-auto pb-2">
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
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
