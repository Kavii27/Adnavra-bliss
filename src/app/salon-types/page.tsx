import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { BrowseBySalonType } from "@/components/customer/home/browse-by-salon-type";

export const metadata = {
  title: "Browse by salon type | ADNAVRA BLISS",
  description: "Explore salons by type — gents, ladies, unisex, bridal, home visits, spa & resort, and kids friendly.",
};

export default function SalonTypesPage() {
  return (
    <main className="relative min-h-screen bg-[#FDF9F3]">
      <HomeHeader />
      <BrowseBySalonType />
      <SiteFooter />
    </main>
  );
}
