import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { ContactForm } from "@/components/marketing/contact-form";
import { ContactMapWrapper } from "@/components/marketing/contact-map-wrapper";

export const metadata = {
  title: "Contact us | ADNAVRA BLISS",
  description: "Get in touch with the ADNAVRA team — questions, support, or partnership enquiries.",
};

// Approximate Colombo, Sri Lanka coordinates — swap for the exact office
// location once available.
const OFFICE_COORDS: [number, number] = [6.9271, 79.8612];

export default function ContactPage() {
  return (
    <main className="relative min-h-screen bg-[#FDF9F3]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 overflow-hidden">
        <div className="absolute inset-0 brand-gradient-bg opacity-[0.06]" />
      </div>

      <div className="relative">
        <HomeHeader />

        <section className="px-6 lg:px-12 pt-12 lg:pt-16 pb-6 max-w-[1200px] mx-auto text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E5DDD0] bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#795831]">
            We&apos;d love to hear from you
          </span>
          <h1 className="mt-5 text-4xl lg:text-[46px] font-semibold tracking-[-1.25px] leading-[1.08] text-[#1F1E1D]">
            Contact us
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[#4A4640] max-w-lg mx-auto">
            Have a question about ADNAVRA, need help getting started, or want to discuss a plan for
            your salon? Send a message and the team will get back to you quickly.
          </p>
        </section>

        <section className="px-6 lg:px-12 pb-16 max-w-[1200px] mx-auto">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            {/* Left: contact details + map */}
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-[#E5DDD0] bg-white p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7F3ED] text-[#795831]">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#1F1E1D]">Email</p>
                    <a
                      href="mailto:hello@adnavra.lk"
                      className="text-sm text-[#795831] hover:underline"
                    >
                      hello@adnavra.lk
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7F3ED] text-[#795831]">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#1F1E1D]">Phone</p>
                    <a href="tel:+94112345678" className="text-sm text-[#795831] hover:underline">
                      +94 11 234 5678
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7F3ED] text-[#795831]">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#1F1E1D]">Location</p>
                    <p className="text-sm text-[#4A4640]">Colombo, Sri Lanka</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F7F3ED] text-[#795831]">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#1F1E1D]">Response time</p>
                    <p className="text-sm text-[#4A4640]">Typically within one business day</p>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="overflow-hidden rounded-2xl border border-[#E5DDD0] bg-white h-[280px]">
                <ContactMapWrapper center={OFFICE_COORDS} label="ADNAVRA — Colombo, Sri Lanka" />
              </div>
            </div>

            {/* Right: contact form */}
            <div className="rounded-2xl border border-[#E5DDD0] bg-white p-6 lg:p-8">
              <h2 className="text-lg font-semibold text-[#1F1E1D]">Send us a message</h2>
              <p className="mt-1 text-sm text-[#8A7F6E]">
                Fill in the form below and we&apos;ll get back to you as soon as we can.
              </p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
