import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { VenueGrid } from "@/components/customer/home/venue-grid";
import { fetchVenues } from "@/lib/marketplace-venues";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Near you | ADNAVRA BLISS",
  description: "Salons and spas near you on ADNAVRA BLISS.",
};

export default async function NearYouPage() {
  // Placeholder ordering until live geolocation-based ranking (Phase 4)
  // replaces this — mirrors the homepage rail's fallback logic.
  let businesses = await fetchVenues("desc", 100, 8);
  if (businesses.length === 0) {
    businesses = await fetchVenues("desc", 100, 0);
  }

  return (
    <main className="relative min-h-screen bg-[#FDF9F3]">
      <HomeHeader />

      <section className="px-6 lg:px-12 pt-10 pb-16 max-w-[1200px] mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2A1D12]">
          Close by
        </p>
        <h1 className="mt-1 text-2xl lg:text-3xl font-semibold tracking-tight text-[#1F1E1D]">
          Near you
        </h1>
        <p className="mt-2 text-sm text-[#8A8377]">
          {businesses.length} {businesses.length === 1 ? "salon" : "salons"} near you.
        </p>

        <div className="mt-8">
          <VenueGrid
            businesses={businesses}
            emptyText="Salons near you will appear here once you share a location."
          />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
