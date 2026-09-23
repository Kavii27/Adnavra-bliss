import Image from "next/image";
import { BadgeCheck, Zap } from "lucide-react";
import { Suspense } from "react";
import { CustomerHeader } from "@/components/customer/customer-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { VenueRail } from "@/components/customer/home/venue-rail";
import { SearchBar } from "@/components/customer/search/search-bar";
import { BrowseByCity } from "@/components/customer/home/browse-by-city";
import { BrowseByCategory } from "@/components/customer/home/browse-by-category";
import { HowItWorks } from "@/components/customer/home/how-it-works";
import { AdvancedSearch } from "@/components/customer/home/advanced-search";
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
          select: { category: true },
        },
      },
    });
    return businesses.map((b) => {
      const svcCategories = b.services.map((s) => s.category);
      const primary = mostCommonCategory(svcCategories) ?? b.categories[0] ?? null;
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
      };
    });
  } catch {
    return [];
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

  const businessCount = await db.business.count().catch(() => 0);

  return (
    <main className="min-h-screen bg-[#FDF9F3]">
      <CustomerHeader hideBusinessLink hideMenu />

      {/* Hero — headline per Phase 3 spec, soft gradient, SearchBar inline */}
      <section className="relative overflow-visible border-b border-[#E5DDD0]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 brand-gradient-bg opacity-[0.06]" />
        </div>
        <div className="relative overflow-visible px-6 lg:px-12 py-16 lg:py-20 max-w-[900px] mx-auto text-center">
          <div className="flex items-center justify-center gap-2">
            <Image src="/logo.png" alt="ADNAVRA BLISS logo" width={24} height={24} className="h-6 w-6 rounded-md object-contain" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#795831]">
              ADNAVRA BLISS
            </span>
          </div>
          <h1 className="mt-4 text-4xl lg:text-[42px] font-semibold tracking-[-1.25px] leading-[1.05] text-[#1F1E1D]">
            Book local selfcare services
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[#4A4640] max-w-2xl mx-auto">
            Discover trusted salons, barbers, spas and beauty experts near you — compare services and book
            instantly.
          </p>

          <div className="mt-8 relative z-10 overflow-visible">
            <Suspense fallback={<div className="h-[56px] rounded-full bg-white border border-[#E5DDD0] animate-pulse" />}>
              <SearchBar variant="hero" />
            </Suspense>
          </div>

          {/* Trust-indicator row */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#8A8377]">
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-3.5 w-3.5 text-[#795831]" />
              {businessCount > 0
                ? `${businessCount} ${businessCount === 1 ? "salon" : "salons"} across Sri Lanka`
                : "Salons across Sri Lanka"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-3.5 w-3.5 text-[#795831]" />
              Verified salons
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-[#795831]" />
              Instant confirmation
            </span>
          </div>
        </div>
      </section>

      {/* Advance search (collapsible) */}
      <div className="pt-8">
        <AdvancedSearch />
      </div>

      {/* Browse by category */}
      <BrowseByCategory />

      <div className="max-w-[1200px] mx-auto">
        <VenueRail
          title="Recommended"
          businesses={recommended}
          href="/customer/search"
          emptyText="Recommended salons will appear here once businesses join."
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

      {/* How does it work */}
      <HowItWorks />

      {/* Browse by city — popular-city chips + search + collapsible full district list */}
      <BrowseByCity locations={SRI_LANKA_LOCATIONS} />

      <SiteFooter />
    </main>
  );
}
