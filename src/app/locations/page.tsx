import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { BrowseByCity } from "@/components/customer/home/browse-by-city";
import { SRI_LANKA_LOCATIONS } from "@/lib/sri-lanka-locations";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getServerT();
  return {
    title: t("locations.metaTitle"),
    description: t("locations.metaDesc"),
  };
}

export default function LocationsPage() {
  return (
    <main className="relative min-h-screen bg-[#FDF9F3]">
      <HomeHeader />

      {/* Ad slot: reserved for a future backend-driven banner below the header. */}

      <BrowseByCity locations={SRI_LANKA_LOCATIONS} />

      <SiteFooter />
    </main>
  );
}

