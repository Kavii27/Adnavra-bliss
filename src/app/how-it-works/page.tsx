import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { HowItWorks } from "@/components/customer/home/how-it-works";

export const metadata = {
  title: "How it works | ADNAVRA BLISS",
  description: "Book verified salons and spas in three easy steps — browse, choose a time, get instant confirmation.",
};

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
