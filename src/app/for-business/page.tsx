import Link from "next/link";
import {
  Smartphone,
  Clock,
  LayoutDashboard,
  Users,
  QrCode,
  BarChart3,
  Store,
  Calendar,
  MessageCircle,
  MapPin,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";

const FEATURES = [
  {
    icon: Smartphone,
    title: "Dedicated online booking page",
    desc: "A professional, mobile-friendly page at your own ADNAVRA URL. Your salon's always-on digital storefront.",
  },
  {
    icon: Clock,
    title: "24/7 appointment booking",
    desc: "Customers book any time, without needing to call or message during business hours.",
  },
  {
    icon: LayoutDashboard,
    title: "Salon management dashboard",
    desc: "A simple dashboard to manage services, pricing, availability, and incoming appointments.",
  },
  {
    icon: Users,
    title: "Staff and team management",
    desc: "Assign appointments to specific staff members and manage individual schedules.",
  },
  {
    icon: Users,
    title: "Customer database",
    desc: "Every booking builds a centralized customer record and booking history.",
  },
  {
    icon: QrCode,
    title: "Unique QR code",
    desc: "A dedicated QR code that opens your booking page instantly, perfect for in-salon use.",
  },
  {
    icon: BarChart3,
    title: "Business analytics",
    desc: "Understand bookings, popular services, and business performance over time.",
  },
  {
    icon: Store,
    title: "Marketplace discoverability",
    desc: "Be found by new customers browsing the ADNAVRA marketplace by location and service.",
  },
];

export default function ForBusinessPage() {
  return (
    <main className="min-h-screen bg-[#fdf9f3]">
      <HomeHeader />

      {/* Hero - angled toward salon owners */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 brand-gradient-bg opacity-[0.06]" />
        <div className="relative px-6 lg:px-12 py-20 max-w-[1200px] mx-auto">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-[#fdcf9e]/60 px-3 py-1 text-xs font-medium text-[#2A1D12]">
              For salons and beauty businesses in Sri Lanka
            </p>
            <h1 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-[-1.5px] text-[#2A1D12]">
              Run your salon, not your inbox.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#4a4640] max-w-prose">
              ADNAVRA gives your business a dedicated booking page, a dashboard to manage every
              appointment, and a QR code that turns any surface into a booking point. Built for
              independent owners, growing teams, and multi-location salons across Sri Lanka.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup">
                <Button className="bg-[#2A1D12] hover:bg-[#4a4640] text-white shadow-sm">
                  Get started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="mt-3 text-sm text-[#4a4640]">
              Already have an account?{" "}
                <Link href="/login" className="font-medium text-[#2A1D12] hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* What you get - reuses FEATURES from home */}
      <section className="px-6 lg:px-12 py-16 max-w-[1200px] mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight text-[#2A1D12] text-center">
          Everything you need to take bookings online
        </h2>
        <p className="mt-2 text-center text-[#4a4640] max-w-2xl mx-auto">
          One platform for your online presence, your daily schedule, and your customer relationships.
        </p>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-lg bg-white border border-[#ccc6bd]/40 p-8">
              <f.icon className="h-5 w-5 text-[#2A1D12]" />
              <h3 className="mt-3 text-lg font-semibold text-[#2A1D12]">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#4a4640]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why it matters for owners */}
      <section className="px-6 lg:px-12 py-16 max-w-[1200px] mx-auto">
        <div className="rounded-2xl bg-[#2A1D12] text-[#fdf9f3] p-10 lg:p-14 grid lg:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-semibold">Less time on the phone, more time with clients</h2>
            <p className="mt-3 text-sm text-[#ccc6bd] leading-relaxed">
              Salon owners across Sri Lanka spend hours each week coordinating bookings by phone and
              WhatsApp. ADNAVRA moves that work to a booking page and dashboard that runs on its own, so
              your team can focus on the work that actually earns revenue.
            </p>
            <Link href="/signup" className="inline-flex mt-6">
              <Button className="bg-white text-[#2A1D12] hover:bg-[#fdf9f3] shadow-sm">Create your booking page</Button>
            </Link>
            <p className="mt-4 text-sm text-[#ccc6bd]">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-white hover:underline">
                Log in
              </Link>
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "Bookings come in overnight, without a phone call.",
              "Customer records and history stay in one place.",
              "Staff schedules are visible and easy to coordinate.",
              "Your salon is discoverable to new customers nearby.",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#2A1D12] shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* QR + benefits */}
      <section className="px-6 lg:px-12 py-16 max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-[#2A1D12]">
            A QR code for every surface in your salon
          </h2>
          <p className="mt-3 text-[#4a4640] leading-relaxed">
            Every subscription includes a unique QR code linked to your booking page. No app download
            required for customers. Print it for reception, mirrors, business cards, and social posts.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[#4a4640]">
            {[
              "Reception desk and waiting area",
              "Business cards and flyers",
              "Mirrors and retail displays",
              "Instagram, Facebook, and WhatsApp",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#2A1D12]" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-[#ccc6bd]/40 bg-white p-8 flex flex-col items-center text-center">
          <QrCode className="h-32 w-32 text-[#2A1D12]" />
          <p className="mt-4 text-sm font-medium text-[#2A1D12]">Scan to open your booking page</p>
          <p className="text-xs text-[#7b766f] mt-1">Generated automatically when your profile goes live</p>
        </div>
      </section>

      {/* Business benefits */}
      <section className="px-6 lg:px-12 py-16 max-w-[1200px] mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight text-[#2A1D12] text-center">
          Built for how salons in Sri Lanka actually work
        </h2>
        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: MessageCircle,
              title: "Fewer interruptions",
              desc: "Stop pausing services to answer booking calls. Customers book on their own.",
            },
            {
              icon: Calendar,
              title: "Fewer no-shows",
              desc: "Centralized bookings and confirmations reduce missed and double-booked appointments.",
            },
            {
              icon: LayoutDashboard,
              title: "One place for everything",
              desc: "Services, staff schedules, and customer history in a single dashboard.",
            },
            {
              icon: MapPin,
              title: "Be found nearby",
              desc: "Show up in the ADNAVRA marketplace when customers search by location and service.",
            },
          ].map((b) => (
            <div key={b.title} className="rounded-lg bg-white border border-[#ccc6bd]/40 p-6">
              <b.icon className="h-5 w-5 text-[#2A1D12]" />
              <h3 className="mt-3 text-sm font-semibold text-[#2A1D12]">{b.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#4a4640]">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 lg:px-12 py-16">
        <div className="max-w-[1000px] mx-auto rounded-2xl bg-[#2A1D12] text-white p-12 text-center">
          <h2 className="text-3xl font-semibold">Your business deserves to be discovered</h2>
          <p className="mt-3 text-white/85 max-w-xl mx-auto text-sm">
            Join salons across Sri Lanka already taking bookings without the phone tag. Set up your
            booking page in minutes.
          </p>
          <Link href="/signup" className="inline-flex mt-6">
            <Button variant="secondary">Get started today</Button>
          </Link>
          <p className="mt-4 text-sm text-white/70">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-white hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

