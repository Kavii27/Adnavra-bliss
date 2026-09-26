import { db } from "@/lib/db";
import { rankBusinessIds } from "@/lib/ranking-service";

export type Venue = {
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
  boosted: boolean; // true while an active SalonBoost is running
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

type WhereClause = NonNullable<Parameters<typeof db.business.findMany>[0]>["where"];

// How many extra candidate rows to pull beyond what was actually requested,
// so boosted/featured salons that are NOT the most recently created can
// still be correctly ranked to the top after re-scoring. At the current
// scale (tens to low hundreds of salons) this comfortably covers the whole
// table in one query. If the salon count grows into the thousands, this
// should move to a database-side ranked query instead of ranking in JS.
const CANDIDATE_POOL_CAP = 500;

async function fetchVenuesWhere(
  where: WhereClause,
  order: "asc" | "desc",
  take: number,
  skip = 0,
): Promise<Venue[]> {
  try {
    // Pull a wider candidate pool than requested so re-ranking (below) can
    // promote a boosted/high-plan salon to the top even if it isn't among
    // the most recently created rows within just `take`.
    const poolSize = Math.min(CANDIDATE_POOL_CAP, Math.max(take + skip, take * 4));

    const businesses = await db.business.findMany({
      where,
      orderBy: { createdAt: order },
      take: poolSize,
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

    if (businesses.length === 0) return [];

    // Re-rank the candidate pool with the SAME engine the search page
    // uses — no distance data here (these lists aren't location-scoped),
    // so distanceKm is null for every entry and distanceWeight has no
    // effect, which is the correct behavior for "Recommended"/category/
    // salon-type lists.
    const distanceById = new Map<string, number | null>(businesses.map((b) => [b.id, null]));
    const ranked = await rankBusinessIds(
      businesses.map((b) => b.id),
      distanceById,
    );

    // "Featured" must reflect the admin's Featured-eligible toggle, not a
    // hardcoded plan-key check — rankBusinessIds doesn't return eligibility
    // flags, so read the active subscription's plan directly. A salon counts
    // as plan-featured only while its subscription is ACTIVE and unexpired
    // (same active definition the ranking engine uses).
    let featuredEligibleIds = new Set<string>();
    let eligibilityLoaded = false;
    try {
      const now = new Date();
      const subs = await db.businessSubscription.findMany({
        where: {
          businessId: { in: businesses.map((b) => b.id) },
          status: "ACTIVE",
          OR: [{ endDate: null }, { endDate: { gt: now } }],
        },
        include: { plan: true },
      });
      featuredEligibleIds = new Set(subs.filter((s) => s.plan.isFeaturedEligible).map((s) => s.businessId));
      eligibilityLoaded = true;
    } catch {
      eligibilityLoaded = false;
    }

    const byId = new Map(businesses.map((b) => [b.id, b]));
    const orderedIds = [...ranked.keys()];
    // rankBusinessIds returns every id it was given, so this covers the
    // whole pool; slice AFTER ranking, not before, so ranking can actually
    // change who ends up in the visible page.
    const page = orderedIds.slice(skip, skip + take);

    return page.map((id) => {
      const b = byId.get(id)!;
      const svcCategories = b.services.map((s) => s.category);
      const primary = mostCommonCategory(svcCategories) ?? b.categories[0] ?? null;
      const prices = b.services.map((s) => s.price).filter((p): p is number => typeof p === "number");
      const fromPriceMinor = prices.length > 0 ? Math.min(...prices) : null;
      const rank = ranked.get(id);
      // "Featured" is true from EITHER the plain manual flag OR the
      // salon's plan being featured-eligible — either should show the
      // Featured badge, per the original design intent of both fields.
      // Falls back to the plan-key heuristic only if the eligibility query
      // above failed (transient DB error), so the page still renders.
      const planFeaturedFallback =
        !eligibilityLoaded && !!rank?.planKey && rank.planKey.toLowerCase() !== "silver";
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
        featured: b.marketplacePriority || featuredEligibleIds.has(id) || planFeaturedFallback,
        boosted: Boolean(rank?.isBoosted),
        fromPriceMinor,
      };
    });
  } catch {
    return [];
  }
}

/** Plain, unfiltered venue fetch (used by "Recommended", "Near you", "New"). */
export async function fetchVenues(order: "asc" | "desc", take: number, skip = 0): Promise<Venue[]> {
  return fetchVenuesWhere(undefined, order, take, skip);
}

/**
 * Featured venues: salons with the manual priority flag OR a
 * featured-eligible plan. Ranks the full candidate pool first, then keeps
 * only featured ones — so a boosted/high-plan salon correctly appears here
 * even if it isn't recently created.
 */
export async function fetchFeaturedVenues(take = 100): Promise<Venue[]> {
  const pool = await fetchVenuesWhere(undefined, "desc", CANDIDATE_POOL_CAP);
  return pool.filter((v) => v.featured).slice(0, take);
}

/**
 * Every business tagged with the given category or salon-type slug, or that
 * has at least one active service in that category — same matching rules
 * used by the marketplace search API.
 */
export async function fetchVenuesByCategory(slug: string, take = 200): Promise<Venue[]> {
  return fetchVenuesWhere(
    {
      OR: [
        { categories: { has: slug } },
        { salonTypes: { has: slug } },
        { services: { some: { category: slug, isActive: true } } },
      ],
    },
    "desc",
    take,
  );
}

export async function fetchCategoryCounts(): Promise<Record<string, number>> {
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
