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
  fromPriceMinor?: number | null;
};

export function VenueGrid({
  businesses,
  emptyText = "No salons to show yet.",
}: {
  businesses: Venue[];
  emptyText?: string;
}) {
  if (businesses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E5DDD0] bg-white p-10 text-center">
        <p className="text-sm text-[#8A8377]">{emptyText}</p>
        <p className="mt-1 text-xs text-[#C9C1B4]">
          Salons will appear here as soon as they join ADNAVRA.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 [&>div]:w-full [&_a]:w-full">
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
