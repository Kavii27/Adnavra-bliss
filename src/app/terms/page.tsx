import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#faf6ef]">
      <HomeHeader />
      <section className="max-w-[800px] mx-auto px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight text-[#3a2f22]">Terms of service</h1>
        {/* TODO: replace with reviewed legal copy before launch */}
        <p className="mt-2 text-xs text-[#a89880]">
          Placeholder copy, to be replaced by lawyer-reviewed text before launch.
        </p>
        <div className="mt-6 space-y-4 text-[#475467] leading-relaxed">
          <p>
            By accessing or using ADNAVRA, you agree to these terms. If you do not agree, please do not
            use the platform.
          </p>
          <h2 className="text-lg font-semibold text-[#3a2f22] mt-8">Accounts and subscriptions</h2>
          <p>
            Salon subscriptions are billed monthly at the selected plan rate. A one-time setup fee
            applies at onboarding. Plans can be upgraded at any time, and subscriptions can be cancelled
            at the end of any billing cycle. Fees are quoted in Sri Lankan Rupees (LKR).
          </p>
          <h2 className="text-lg font-semibold text-[#3a2f22] mt-8">Acceptable use</h2>
          <p>
            Users must provide accurate information, keep login credentials secure, and use the platform
            only for lawful purposes. ADNAVRA reserves the right to suspend accounts that violate these
            terms or misuse the service.
          </p>
          <h2 className="text-lg font-semibold text-[#3a2f22] mt-8">Availability and support</h2>
          <p>
            ADNAVRA aims for high availability but does not guarantee uninterrupted service. Support
            levels vary by subscription plan, with priority support included in Professional and Premium
            tiers.
          </p>
          <h2 className="text-lg font-semibold text-[#3a2f22] mt-8">Limitation of liability</h2>
          <p>
            To the extent permitted by law, ADNAVRA is not liable for indirect or consequential losses
            arising from use of the platform. Nothing in these terms limits liability where such
            limitation is not permitted by applicable law.
          </p>
          <h2 className="text-lg font-semibold text-[#3a2f22] mt-8">Contact</h2>
          <p>
            Questions about these terms can be directed to{" "}
            <a href="mailto:hello@adnavra.lk" className="text-[#2A1D12] hover:underline">
              hello@adnavra.lk
            </a>
            .
          </p>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

