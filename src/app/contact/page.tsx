import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#FDF9F3]">
      <HomeHeader />
      <section className="max-w-[800px] mx-auto px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight text-[#1F1E1D]">Contact us</h1>
        <p className="mt-4 text-[#4A4640] leading-relaxed">
          Have a question about ADNAVRA, need help getting started, or want to discuss a plan for your
          salon? Reach out and the team will get back to you quickly.
        </p>
        <div className="mt-8 rounded-lg border border-[#E5DDD0] bg-white p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-[#1F1E1D]">Email</p>
            <a href="mailto:hello@adnavra.lk" className="text-sm text-[#795831] hover:underline">
              hello@adnavra.lk
            </a>
          </div>
          <div>
            <p className="text-sm font-medium text-[#1F1E1D]">Phone</p>
            <a href="tel:+94112345678" className="text-sm text-[#795831] hover:underline">
              +94 11 234 5678
            </a>
          </div>
          <div>
            <p className="text-sm font-medium text-[#1F1E1D]">Location</p>
            <p className="text-sm text-[#4A4640]">Colombo, Sri Lanka</p>
          </div>
        </div>
        <p className="mt-6 text-sm text-[#8A7F6E]">
          Response time is typically within one business day.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
