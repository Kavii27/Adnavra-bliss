import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#FDF9F3]">
      <SiteHeader />
      <section className="max-w-[800px] mx-auto px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight text-[#1F1E1D]">Help and support</h1>
        <p className="mt-4 text-[#4A4640] leading-relaxed">
          Need help booking or managing your salon? Find quick answers below or reach out directly.
        </p>

        <div className="mt-10 space-y-6">
          <div className="rounded-lg border border-[#E5DDD0] bg-white p-6">
            <h2 className="text-base font-semibold text-[#1F1E1D]">How do I book an appointment?</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#4A4640]">
              Search for a salon on the marketplace, open its profile, choose a service and a time slot, and
              confirm your booking. You will receive a confirmation once the salon accepts the appointment.
            </p>
          </div>

          <div className="rounded-lg border border-[#E5DDD0] bg-white p-6">
            <h2 className="text-base font-semibold text-[#1F1E1D]">Can I cancel or reschedule?</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#4A4640]">
              Please cancel at least 24 hours before your appointment so the salon can offer the slot to another
              customer. Contact the salon directly using the phone number on its profile, or manage your booking
              from your account activity page once you are signed in.
            </p>
          </div>

          <div className="rounded-lg border border-[#E5DDD0] bg-white p-6">
            <h2 className="text-base font-semibold text-[#1F1E1D]">How do I contact a salon?</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#4A4640]">
              Each salon profile lists its address, phone, and other contact details provided by the business.
              Use those details to reach the salon directly for questions about services, pricing, or directions.
            </p>
          </div>

          <div className="rounded-lg border border-[#E5DDD0] bg-white p-6">
            <h2 className="text-base font-semibold text-[#1F1E1D]">I own a salon. How do I get started?</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#4A4640]">
              Create a business account, complete your profile and services, and share your ADNAVRA booking link
              or QR code with customers. Visit the For business page or contact us for onboarding help.
            </p>
          </div>

          <div className="rounded-lg border border-[#E5DDD0] bg-white p-6">
            <p className="text-sm font-medium text-[#1F1E1D]">Still need help?</p>
            <p className="mt-1 text-sm text-[#4A4640]">
              Email us at{" "}
              <a href="mailto:hello@adnavra.lk" className="text-[#795831] hover:underline">
                hello@adnavra.lk
              </a>{" "}
              and we will get back to you within one business day.
            </p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
