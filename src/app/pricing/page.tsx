import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PricingSection } from "@/components/marketing/pricing-section";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#faf6ef]">
      <SiteHeader />
      <section className="px-6 lg:px-12 py-16 max-w-[1200px] mx-auto">
        <PricingSection />
      </section>
      <SiteFooter />
    </main>
  );
}
