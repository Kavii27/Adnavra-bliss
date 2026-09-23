import { Dot } from "lucide-react";
import { Suspense } from "react";
import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { VenueRail } from "@/components/customer/home/venue-rail";
import { SearchBar } from "@/components/customer/search/search-bar";
import { BrowseByCity } from "@/components/customer/home/browse-by-city";
import { BrowseByCategory } from "@/components/customer/home/browse-by-category";
import { HowItWorks } from "@/components/customer/home/how-it-works";
import { TrustStatsBar } from "@/components/customer/home/trust-stats-bar";
import { OwnerCtaBanner } from "@/components/customer/home/owner-cta-banner";
import { db } from "@/lib/db";
import { SRI_LANKA_LOCATIONS } from "@/lib/sri-lanka-locations";

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
  const [recommended, newest, nearYou] = await Promise.all([
    fetchVenues("asc", 8, 0),
    fetchVenues("desc", 8, 0),
    // "Near you" — client-side re-fetch will replace this once location is known (Phase 4).
    // For now use a different offset so the rail is not literally identical to "New".
    fetchVenues("desc", 8, 8),
  ]);

  // Fallback for nearYou when there are not enough rows to offset
  const nearYouDisplay = nearYou.length > 0 ? nearYou : newest.slice(0, 8);

  const [businessCount, categoryCounts] = await Promise.all([
    db.business.count().catch(() => 0),
    fetchCategoryCounts(),
  ]);

  return (
    <main className="min-h-screen bg-[#FDF9F3]">
      <HomeHeader />

      {/* Hero — centered badge, headline + serif-italic accent line, search bar, trust stats */}
      <section className="relative overflow-visible border-b border-[#E5DDD0]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 brand-gradient-bg opacity-[0.06]" />
          <div className="hero-grid absolute inset-0" />
        </div>
        <div className="relative overflow-visible px-6 lg:px-12 pt-16 lg:pt-20 pb-10 max-w-[820px] mx-auto text-center">
          <span className="reveal-up inline-flex items-center gap-2 rounded-full border border-[#E5DDD0] bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#795831] in-view">
            <Dot className="h-3 w-3 -ml-1 text-[#795831]" />
            Sri Lanka&apos;s curated salon &amp; spa directory
          </span>

          <h1 className="mt-5 text-4xl lg:text-[46px] font-semibold tracking-[-1.25px] leading-[1.08] text-[#1F1E1D]">
            Book your next appointment.
            <br />
            <span className="font-serif italic font-normal text-[#795831]">
              Discover Sri Lanka&apos;s finest salons &amp; spas.
            </span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[#4A4640] max-w-2xl mx-auto">
            Instantly explore and reserve verified hairstylists, skin clinics, luxury wellness
            spas, and beauty suites across the island.
          </p>

          <div id="search" className="mt-8 relative z-10 overflow-visible scroll-mt-24">
            <Suspense fallback={<div className="h-[56px] rounded-full bg-white border border-[#E5DDD0] animate-pulse" />}>
              <SearchBar variant="hero" />
            </Suspense>
          </div>
        </div>

        {/* Trust stats — the one and only trust row, inside the hero */}
        <div className="relative border-t border-[#E5DDD0]/70">
          <TrustStatsBar businessCount={businessCount} />
        </div>
      </section>

      {/* Browse by category — numbered 01–08 card grid */}
      <BrowseByCategory counts={categoryCounts} />

      {/* Recommended salons & spas — featured grid, tabs kept as rails below for New/Near you */}
      <div id="salons" className="scroll-mt-28 max-w-[1200px] mx-auto">
        <VenueRail
          title="Recommended salons & spas"
          businesses={recommended}
          href="/customer/search"
          emptyText="Recommended salons will appear here once businesses join."
          layout="grid"
        />
        <VenueRail
          title="New to ADNAVRA"
          businesses={newest}
          href="/customer/search"
          emptyText="New arrivals will show here as salons sign up."
        />
        <VenueRail
          title="Near you"
          businesses={nearYouDisplay}
          href="/customer/search"
          emptyText="Salons near you will appear here once you share a location."
        />
      </div>

      {/* How does it work — 3-step "Book in three easy steps" */}
      <HowItWorks />

      {/* Browse by city — popular-city chips + search + collapsible full district list */}
      <BrowseByCity locations={SRI_LANKA_LOCATIONS} />

      {/* For salon owners — dark CTA banner with metrics */}
      <OwnerCtaBanner />

      <SiteFooter />
    </main>
  );
}
