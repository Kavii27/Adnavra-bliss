import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { BrowseByCategory } from "@/components/customer/home/browse-by-category";
import { db } from "@/lib/db";

export const metadata = {
  title: "Browse categories & services | ADNAVRA BLISS",
  description: "Explore every salon and spa category available on ADNAVRA — hair, nails, skincare, massage, and more.",
};

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

export default async function CategoriesPage() {
  const categoryCounts = await fetchCategoryCounts();

  return (
    <main className="relative min-h-screen bg-[#FDF9F3]">
      <HomeHeader />

      {/* Ad slot: reserved for a future backend-driven banner below the header. */}

      <BrowseByCategory counts={categoryCounts} />

      <SiteFooter />
    </main>
  );
}
