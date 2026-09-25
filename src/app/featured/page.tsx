import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { VenueGrid } from "@/components/customer/home/venue-grid";
import { fetchVenuesWhere } from "@/lib/marketplace-venues";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Featured salons | ADNAVRA BLISS",
  description: "Featured salons and spas on ADNAVRA BLISS.",
};

export default async function FeaturedPage() {
  const businesses = await fetchVenuesWhere({ marketplacePriority: true }, "desc", 100);

  return (
    <main className="relative min-h-screen bg-[#FDF9F3]">
      <HomeHeader />

      <section className="px-6 lg:px-12 pt-10 pb-16 max-w-[1400px] mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2A1D12]">
          Hand-picked visibility
        </p>
        <h1 className="mt-1 text-2xl lg:text-3xl font-semibold tracking-tight text-[#1F1E1D]">
          Featured salons
        </h1>
        <p className="mt-2 text-sm text-[#8A8377]">
          {businesses.length} {businesses.length === 1 ? "salon" : "salons"} featured right now.
        </p>

        <div className="mt-8">
          <VenueGrid
            businesses={businesses}
            emptyText="Featured salons will appear here once a salon upgrades to a featured plan."
          />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
