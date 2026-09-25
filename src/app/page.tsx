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
import { fetchVenuesWhere } from "@/lib/marketplace-venues";

type Venue = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  category: string | null;
  categories: string[];
  salonTypes: string[];
  featured: boolean;
  fromPriceMinor: number | null;
};

function mostCommonCategory(categories: (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const c of categories) {
    if (!c) continue;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [k, v] of counts) {
    if (v > bestCount) {
      best = k;
      bestCount = v;
    }
  }
  return best;
}

async function fetchVenues(order: "asc" | "desc", take: number, skip = 0): Promise<Venue[]> {
  try {
    const businesses = await db.business.findMany({
      orderBy: { createdAt: order },
      take,
      skip,
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        address: true,
        city: true,
        categories: true,
        salonTypes: true,
        marketplacePriority: true,
        services: {
          where: { isActive: true },
          select: { category: true, price: true },
        },
      },
    });
    return businesses.map((b) => {
      const svcCategories = b.services.map((s) => s.category);
      const primary = mostCommonCategory(svcCategories) ?? b.categories[0] ?? null;
      const prices = b.services.map((s) => s.price).filter((p): p is number => typeof p === "number");
      const fromPriceMinor = prices.length > 0 ? Math.min(...prices) : null;
      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        logoUrl: b.logoUrl,
        address: b.address,
        city: b.city,
        category: primary,
        categories: b.categories,
        salonTypes: b.salonTypes ?? [],
        featured: b.marketplacePriority,
        fromPriceMinor,
      };
    });
  } catch {
    return [];
  }
}

async function fetchCategoryCounts(): Promise<Record<string, number>> {
  try {
    const rows = await db.service.groupBy({
      by: ["category"],
      where: { isActive: true, category: { not: null } },
      _count: { _all: true },
    });
    const map: Record<string, number> = {};
    for (const r of rows) {
      if (r.category) map[r.category] = r._count._all;
    }
    return map;
  } catch {
    return {};
  }
}

export default async function MarketplaceHome() {
  const [recommended, nearYou, featured, categoryCounts] = await Promise.all([
    fetchVenues("asc", 8, 0),
    // "Near you" — teaser row on the homepage; the full /near-you page uses real geolocation.
    // For now use a different offset so the rail is not literally identical to "Recommended".
    fetchVenues("desc", 8, 8),
    fetchVenuesWhere({ marketplacePriority: true }, "desc", 8),
    fetchCategoryCounts(),
  ]);

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
        <AdBanner />

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

