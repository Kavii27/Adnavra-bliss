import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { HowItWorks } from "@/components/customer/home/how-it-works";
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getServerT();
  return {
    title: t("howpage.metaTitle"),
    description: t("howpage.metaDesc"),
  };
}

export default function HowItWorksPage() {
  return (
    <main className="relative min-h-screen bg-[#FDF9F3]">
      <HomeHeader />

      {/* Ad slot: reserved for a future backend-driven banner below the header. */}

      <HowItWorks />

      <SiteFooter />
    </main>
  );
}
