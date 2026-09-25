import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { BrowseBySalonType } from "@/components/customer/home/browse-by-salon-type";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getServerT();
  return {
    title: t("cat.metaTypesTitle"),
    description: t("cat.metaTypesDesc"),
  };
}

export default function SalonTypesPage() {
  return (
    <main className="relative min-h-screen bg-[#FDF9F3]">
      <HomeHeader />
      <BrowseBySalonType />
      <SiteFooter />
    </main>
  );
}
