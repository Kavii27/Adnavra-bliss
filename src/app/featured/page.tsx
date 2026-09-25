import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { VenueGrid } from "@/components/customer/home/venue-grid";
import { fetchVenuesWhere } from "@/lib/marketplace-venues";
import { getServerT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getServerT();
  return {
    title: t("cat.metaFeaturedTitle"),
    description: t("cat.metaFeaturedDesc"),
  };
}

export default async function FeaturedPage() {
  const t = await getServerT();
  const businesses = await fetchVenuesWhere({ marketplacePriority: true }, "desc", 100);

  return (
    <main className="relative min-h-screen bg-[#FDF9F3]">
      <HomeHeader />

      <section className="px-6 lg:px-12 pt-10 pb-16 max-w-[1400px] mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2A1D12]">
          {t("cat.eyebrowFeatured")}
        </p>
        <h1 className="mt-1 text-2xl lg:text-3xl font-semibold tracking-tight text-[#1F1E1D]">
          {t("home.featured")}
        </h1>
        <p className="mt-2 text-sm text-[#8A8377]">
          {businesses.length} {businesses.length === 1 ? t("cat.one") : t("cat.other")} {t("cat.featuredNow")}
        </p>

        <div className="mt-8">
          <VenueGrid
            businesses={businesses}
            emptyText={t("cat.emptyFeatured")}
          />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
