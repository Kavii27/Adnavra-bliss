import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#faf6ef]">
      <SiteHeader />
      <section className="max-w-[800px] mx-auto px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight text-[#3a2f22]">Privacy policy</h1>
        {/* TODO: replace with reviewed legal copy before launch */}
        <p className="mt-2 text-xs text-[#a89880]">
          Placeholder copy, to be replaced by lawyer-reviewed text before launch.
        </p>
        <div className="mt-6 space-y-4 text-[#475467] leading-relaxed">
          <p>
            ADNAVRA respects your privacy and is committed to protecting personal information collected
            through the platform. This policy describes what information is collected, how it is used,
            and the choices available to you.
          </p>
          <h2 className="text-lg font-semibold text-[#3a2f22] mt-8">Information we collect</h2>
          <p>
            When you create an account, book an appointment, or contact support, we collect information
            such as your name, email address, phone number, and booking details. Salons provide
            business information including services, pricing, and availability.
          </p>
          <h2 className="text-lg font-semibold text-[#3a2f22] mt-8">How we use information</h2>
          <p>
            Information is used to provide booking services, manage appointments, communicate confirmations
            and updates, improve the platform, and comply with legal obligations. ADNAVRA does not sell
            personal data to third parties.
          </p>
          <h2 className="text-lg font-semibold text-[#3a2f22] mt-8">Data retention and security</h2>
          <p>
            Data is retained only as long as needed to provide services and meet legal requirements.
            Industry-standard security measures are applied to protect stored information.
          </p>
          <h2 className="text-lg font-semibold text-[#3a2f22] mt-8">Contact</h2>
          <p>
            Questions about this policy can be directed to{" "}
            <a href="mailto:hello@adnavra.lk" className="text-[#8a6d4f] hover:underline">
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
