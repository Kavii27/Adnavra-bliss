import { Suspense } from "react";
import { HomeHeader } from "@/components/customer/home/home-header";
import { AdBanner } from "@/components/customer/home/ad-banner";
import { SiteFooter } from "@/components/marketing/site-footer";
import { VenueRailRow } from "@/components/customer/home/venue-rail-row";
import { SearchBar } from "@/components/customer/search/search-bar";
import { BrowseByCategory } from "@/components/customer/home/browse-by-category";
import { BrowseBySalonType } from "@/components/customer/home/browse-by-salon-type";
import { HowItWorks } from "@/components/customer/home/how-it-works";
import { TrustStatsBar } from "@/components/customer/home/trust-stats-bar";
import { OwnerCtaBanner } from "@/components/customer/home/owner-cta-banner";
import { db } from "@/lib/db";
import { fetchVenues, fetchFeaturedVenues, fetchCategoryCounts } from "@/lib/marketplace-venues";
import { getHomepageBannerSetting } from "@/lib/platform-settings";

export default async function MarketplaceHome() {
  const [recommended, nearYou, featured, categoryCounts, homepageBanner] = await Promise.all([
    fetchVenues("asc", 8, 0),
    // "Near you" — teaser row on the homepage; the full /near-you page uses real geolocation.
    // For now use a different offset so the rail is not literally identical to "Recommended".
    fetchVenues("desc", 8, 8),
    fetchFeaturedVenues(8),
    fetchCategoryCounts(),
    getHomepageBannerSetting().catch(() => null),
  ]);
  const banner = homepageBanner?.banner;

  // Fallback for nearYou when there are not enough rows to offset
  const nearYouDisplay = nearYou.length > 0 ? nearYou : recommended.slice(0, 8);

  const businessCount = await db.business.count().catch(() => 0);

  return (
    <main className="relative min-h-screen bg-[#FDF9F3]">
      {/* Background texture — placed at the very top of the page so it runs
          continuously from behind the navbar into the hero, instead of
          starting partway down the section. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-155 lg:h-175 overflow-hidden">
        <div className="absolute inset-0 brand-gradient-bg opacity-[0.06]" />
        <div className="hero-grid absolute inset-0" />
      </div>

      <div className="relative">
        <HomeHeader />
        <AdBanner imageUrl={banner?.imageUrl} />

        {/* Hero — search + trust stats */}
        <section className="relative border-b border-[#E5DDD0]">
          <div className="relative px-6 lg:px-12 pt-12 lg:pt-16 pb-10 max-w-[1400px] mx-auto">
            {/* Search bar — full width */}
            <div id="search" className="relative z-10 scroll-mt-24">
              <Suspense fallback={<div className="h-[76px] rounded-2xl bg-white border border-[#E5DDD0] animate-pulse" />}>
                <SearchBar variant="hero" />
              </Suspense>
            </div>
          </div>

          {/* Trust stats — the one and only trust row, inside the hero */}
          <div className="relative border-t border-[#E5DDD0]/70">
            <TrustStatsBar businessCount={businessCount} />
          </div>
        </section>

      {/* Browse categories & services — moved here from the navbar */}
      <BrowseByCategory counts={categoryCounts} limit={8} />
      <BrowseBySalonType limit={8} />

      {/* Salons & spas — stacked rows, each with its own "See all >" link (no filter tabs) */}
      <div id="salons" className="scroll-mt-28 max-w-[1400px] mx-auto">
        <VenueRailRow
          title="Featured salons"
          href="/featured"
          businesses={featured}
          emptyText="Featured salons will appear here once a salon upgrades to a featured plan."
        />
        <VenueRailRow
          title="Recommended"
          href="/recommended"
          businesses={recommended}
          emptyText="Recommended salons will appear here once businesses join."
        />
        <VenueRailRow
          title="Near you"
          href="/near-you"
          businesses={nearYouDisplay}
          emptyText="Salons near you will appear here once you share a location."
        />
      </div>

      {/* How does it work — 3-step "Book in three easy steps" */}
      <HowItWorks />

      {/* For salon owners — dark CTA banner with metrics */}
      <OwnerCtaBanner />

      <SiteFooter />
      </div>
    </main>
  );
}

