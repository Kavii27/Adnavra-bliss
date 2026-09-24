import { db } from "@/lib/db";

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

async function fetchVenuesWhere(
  where: WhereClause,
  order: "asc" | "desc",
  take: number,
  skip = 0,
): Promise<Venue[]> {
  try {
    const businesses = await db.business.findMany({
      where,
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

/** Plain, unfiltered venue fetch (used by "Recommended", "Near you", "New"). */
export async function fetchVenues(order: "asc" | "desc", take: number, skip = 0): Promise<Venue[]> {
  return fetchVenuesWhere(undefined, order, take, skip);
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
