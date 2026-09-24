"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  MapPin,
  ShieldCheck,
  X,
  Check,
  Lock,
  QrCode,
  Sparkles,
  Wand2,
  Store,
  Users,
  Palette,
  BarChart3,
  Nfc,
  CalendarCheck,
  TrendingUp,
  Star,
  ChevronDown,
  Calendar,
  BadgeCheck,
  MousePointerClick,
} from "lucide-react";
import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

/* ------------------------------------------------------------------ */
/* Design tokens (from the ADNAVRA Bliss reference design)             */
/* ------------------------------------------------------------------ */
const c = {
  primary: "#2A1D12",
  primaryContainer: "#2A1D12",
  onPrimary: "#ffffff",
  secondary: "#795831",
  secondaryContainer: "#fdcf9e",
  onSecondaryContainer: "#785730",
  secondaryFixed: "#ffddba",
  onSecondaryFixed: "#2b1700",
  surface: "#fdf9f3",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f7f3ed",
  surfaceContainer: "#f1ede7",
  surfaceContainerHigh: "#ebe8e2",
  onSurface: "#1c1c18",
  onSurfaceVariant: "#4a4640",
  outline: "#7b766f",
  outlineVariant: "#ccc6bd",
};

const heroImg = "/hero-salon.png";
const colorLabImg ="/booking.jpeg";
const stylingImg ="/schedule.jpeg";
const chairImg = "/serve.jpeg";
const revenueImg ="/grow.jpeg";
const qrCardImg ="/qr-code.jpeg";
const bannerImg = "/atmospheric-banner.png";

function Eyebrow({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-1 rounded-full shadow-sm ${
        tone === "light" ? "bg-[#f7f3ed]" : "bg-[#f3ebdd] backdrop-blur"
      }`}
    >
      <span className="w-2 h-2 rounded-full bg-[#795831]" />
      <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#795831]">
        {children}
      </span>
    </div>
  );
}

const pillars = [
  {
    n: "01",
    tag: "ATTRACT",
    title: "Get Discovered & Accept Bookings",
    blurb:
      "A branded storefront linked to Instagram, Google Maps, and your website — open for bookings around the clock.",
    img: colorLabImg,
    badge: "LIVE & BOOKABLE",
    kicker: "Client Acquisition",
    heading: "Get Discovered & Accept Bookings",
    detail:
      "Your salon appears exactly where guests are already looking — Instagram bio, Google listing, WhatsApp link. Every visitor can check real availability and lock a slot in under a minute, with zero calls or DMs required.",
    stat1: ["Booking Channels:", "IG, Google & Web"],
    stat2: ["Availability:", "24/7 Live"],
    footNote: "No Missed Enquiries",
    footSub: "Every guest can book instantly",
  },
  {
    n: "02",
    tag: "SCHEDULE",
    title: "Manage Staff, Chairs & Availability",
    blurb:
      "One master roster keeps every stylist, chair, and appointment perfectly in sync — with zero double-bookings.",
    img: stylingImg,
    badge: "ROSTER SYNCED",
    kicker: "Operations Control",
    heading: "Manage Staff, Chairs & Availability",
    detail:
      "Assign stylists, block chair time, and balance the day's schedule from one live view. Buffer windows, shift hours, and treatment durations are all handled automatically, so nothing overlaps.",
    stat1: ["Chair Conflicts:", "0.00%"],
    stat2: ["Schedule Updates:", "Real-Time"],
    footNote: "Zero Double-Books",
    footSub: "Smart buffer windows",
  },
  {
    n: "03",
    tag: "SERVE",
    title: "Remember Every Client's Preferences",
    blurb:
      "Colour formulas, allergies, and favourite little details — saved and ready before the guest even sits down.",
    img: chairImg,
    badge: "GUEST PROFILE",
    kicker: "Client Experience",
    heading: "Remember Every Client's Preferences",
    detail:
      "Every visit builds a richer client profile: toner ratios, scalp sensitivities, preferred stylist, even their go-to tea. Stylists open the guest card and know exactly how to deliver the same experience, every time.",
    stat1: ["Client Notes:", "Securely Archived"],
    stat2: ["Recall Time:", "Instant"],
    footNote: "Consistently Personal",
    footSub: "Nothing forgotten, ever",
  },
  {
    n: "04",
    tag: "GROW",
    title: "Track Revenue & Performance",
    blurb:
      "See takings, rebooking rates, and your busiest hours at a glance — and make confident calls on where to grow.",
    img: revenueImg,
    badge: "LIVE ANALYTICS",
    kicker: "Business Intelligence",
    heading: "Track Revenue & Performance",
    detail:
      "Watch daily revenue, stylist commissions, and chair utilisation update in real time. Spot your peak hours and most profitable services in LKR, so every decision — from pricing to staffing — is backed by real numbers.",
    stat1: ["Revenue Tracking:", "Real-Time LKR"],
    stat2: ["Rebooking Rate:", "97% Avg."],
    footNote: "Data-Driven Growth",
    footSub: "Know what's working",
  },
];

const journeySteps = [
  { n: "01", tag: "DISCOVER", title: "Locate Sanctuary", desc: "Guests explore verified aesthetic salons across Colombo 03, 07, Galle, & Kandy." },
  { n: "02", tag: "CURATE", title: "Select Rituals", desc: "Transparent LKR menu pricing, exact durations, and dedicated stylist bios." },
  { n: "03", tag: "RESERVE", title: "Single-Tap Lock", desc: "No phone tag. Live chair confirmation locked directly in the salon master schedule." },
  { n: "04", tag: "SYNC", title: "Calm Reminders", desc: "Gentle WhatsApp reminders with appointment notes, directions, and valet access." },
  { n: "05", tag: "NURTURE", title: "Client Memory", desc: "Toner ratios, favorite herbal teas, and single-scan mirror rebooking ready for next visit." },
];

const features = [
  { icon: Store, title: "Dedicated Booking Storefront", desc: "Your custom link (e.g. bliss.lk/your-salon) crafted with high-fashion aesthetics for your Instagram bio.", tag: "Zero Coding Needed" },
  { icon: Users, title: "Staff & Roster Control", desc: "Individual calendars for senior stylists, therapists, and shampoo technicians with auto commission tallying.", tag: "Smart Roster Sync" },
  { icon: Palette, title: "Digital Client Formulations", desc: "Document exact toner ratios, foil placements, scalp sensitivities, and preferred tea choices securely in the cloud.", tag: "Encrypted Profiles" },
  { icon: BarChart3, title: "Peak Hour & Chair Analytics", desc: "Visual heatmaps showing Saturday rushes, dead weekday periods, and most profitable aesthetic rituals in LKR.", tag: "LKR Profit Intel" },
];

const activity = [
  { icon: CalendarCheck, title: "08:00 AM Daily Briefing", sub: "18 appointments synchronized across 4 stylists. All morning slots fully occupied.", time: "Just now" },
  { icon: TrendingUp, title: "Peak Capacity Alert", sub: "Saturday waitlist active: 6 clients requested notification if slots open.", time: "12m ago" },
  { icon: Star, title: "VIP Ritual Reserved", sub: "Sachini D. booked Signature Balayage & Hair Gloss (LKR 18,500).", time: "34m ago" },
];

const faqs = [
  { q: "Does ADNAVRA Bliss take a percentage of our booking revenue?", a: "Never. You retain 100% of every Sri Lankan Rupee your salon earns. We operate on a straightforward, predictable monthly tier with zero transaction cuts or hidden card fees." },
  { q: "How difficult is it to migrate our current client book and formulas?", a: "Our dedicated Sri Lankan hospitality concierge team assists you in Colombo or remotely. We import your client numbers, active appointment sheets, and stylist rosters in less than 24 hours." },
  { q: "Can stylists view each other's earnings or private clients?", a: "No. Our granular role-based permissions ensure stylists only see their own assigned appointments, daily schedule, and individual commissions. Salon-wide financial totals remain strictly restricted to proprietors." },
  { q: "Do clients need to install an app to book an appointment?", a: "No download is required. The booking portal opens instantaneously in any mobile browser via Instagram Bio links, Google Maps, or your mirror QR codes, eliminating friction completely." },
];

export default function AboutPage() {
  const [slot, setSlot] = useState(1);
  const [engine, setEngine] = useState<"client" | "owner">("client");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [hoveredPillar, setHoveredPillar] = useState<number | null>(null);

  return (
    <div
      className={`${playfair.variable} ${jakarta.variable} bg-[${c.surface}] text-[${c.onSurface}]`}
      style={{ fontFamily: "var(--font-jakarta), ui-sans-serif, sans-serif" }}
    >
      <HomeHeader />

      <main className="w-full bg-[#fdf9f3]">
        {/* ============================================================ */}
        {/* SECTION 1: HERO — organic image curve like the LUXE reference */}
        {/* This section starts at the very top of the page, same as         */}
        {/* <HomeHeader />. Because the header has NO background of its own  */}
        {/* on the right side, the clip-path below is what shows through    */}
        {/* behind the nav — that's what makes the nav + hero read as one   */}
        {/* single continuous curve, instead of two separate shapes.        */}
        {/* ============================================================ */}
        <section className="relative w-full min-h-[760px] lg:min-h-[820px] overflow-hidden bg-[#fdf9f3]">
          {/* Right-side salon image. The SVG clip-path creates the large flowing
              curve at BOTH the top and bottom, instead of a simple rounded card.
              The top edge of the path is a flat line at y=0 from x=760 to
              x=1440 — that flat strip is what sits directly behind the
              header's right-hand cluster (Marketplace / Sign up / menu). */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg
              className="absolute inset-0 w-full h-full hidden lg:block"
              viewBox="0 0 1440 820"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <clipPath id="heroOrganicClip" clipPathUnits="userSpaceOnUse">
                  <path d="M760 0H1440V820H1080C980 818 900 795 835 750C755 695 690 625 662 545C630 452 640 350 690 270C735 198 810 155 930 128C1035 104 1115 62 1180 0H760Z" />
                </clipPath>
              </defs>
              <image
                href={heroImg}
                x="620"
                y="0"
                width="820"
                height="820"
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#heroOrganicClip)"
              />
            </svg>

            {/* CSS fallback for tablets/mobile */}
            <div className="lg:hidden absolute right-0 top-[330px] w-[92%] h-[430px] rounded-[48%_0_0_48%/55%_0_0_55%] overflow-hidden">
              <img src={heroImg} alt="Luxury salon interior" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Hero content sits above the image */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-8 lg:px-14 pt-28 lg:pt-36 pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center min-h-[620px]">
              <div className="lg:col-span-6 xl:col-span-5 space-y-6 max-w-[610px]">
                <div className="inline-flex items-center gap-3 text-[#795831]">
                  <span className="text-xl leading-none">✦</span>
                  <span className="text-[11px] uppercase tracking-[0.25em] font-semibold">
                    The Smarter Way to Run a Salon
                  </span>
                </div>

                <h1 className="font-[family-name:var(--font-playfair)] text-[48px] leading-[0.98] sm:text-[64px] sm:leading-[1.02] lg:text-[72px] lg:leading-[0.98] text-[#171514] tracking-[-0.035em] font-medium">
                  Your salon,
                  <br />
                  <span className="italic font-normal text-[#795831]">beautifully</span>
                  <br />
                  in sync.
                </h1>

                <p className="text-[16px] leading-[27px] text-[#4a4640] max-w-[520px]">
                  From effortless online bookings to real-time staff schedules
                  and client insights, ADNAVRA Bliss brings your entire salon
                  operation into one bespoke hospitality operating architecture.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <Link
                    href="/signup"
                    className="group inline-flex items-center gap-5 pl-6 pr-2 py-2 rounded-full bg-[#2A1D12] text-white text-[15px] font-semibold hover:bg-[#17100A] transition-all shadow-[0_14px_32px_rgba(42,29,18,0.16)]"
                  >
                    Start Free
                    <span className="w-10 h-10 rounded-full bg-white text-[#795831] flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                  <Link
                    href="#rituals"
                    className="inline-flex items-center gap-3 text-[15px] font-semibold text-[#1c1c18]"
                  >
                    <span className="w-10 h-10 rounded-full border border-[#4a4640] flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 -rotate-45" />
                    </span>
                    Explore Platform
                  </Link>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-[#6b625c]">
                  <span className="font-medium">No booking fees</span>
                  <span className="text-[#b5a9a1]">•</span>
                  <span className="font-medium">24/7 instant booking</span>
                  <span className="text-[#b5a9a1]">•</span>
                  <span className="font-medium">Live Sri Lanka sync</span>
                </div>
              </div>

              {/* Floating booking card deliberately overlaps the curved image */}
              <div className="hidden lg:block absolute right-[4.5%] xl:right-[6%] bottom-[70px] z-20 w-[390px] rounded-[26px] bg-white/95 backdrop-blur-xl p-6 shadow-[0_24px_70px_rgba(55,42,38,0.16)] border border-white/70">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#795831] text-white flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-[0.18em] text-[#795831] font-bold">Live booking</span>
                      <span className="text-[11px] text-[#7b766f]">Today</span>
                    </div>
                    <h3 className="font-[family-name:var(--font-playfair)] text-[23px] text-[#171514] mt-1">Book your next ritual</h3>
                    <p className="text-[12px] text-[#6b625c] mt-1">Choose a stylist, service and available time in seconds.</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-5">
                  {['10:30 AM','11:15 AM','02:00 PM'].map((time, i) => (
                    <button key={time} onClick={() => setSlot(i)} className={`py-2.5 rounded-xl text-[11px] font-semibold transition-colors ${slot === i ? 'bg-[#2A1D12] text-white' : 'bg-[#f3eee9] text-[#4a4640] hover:bg-[#ebe4de]'}`}>
                      {time}
                    </button>
                  ))}
                </div>
                <Link href="/signup" className="mt-4 w-full py-3 rounded-xl bg-[#2A1D12] text-white text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-[#17100A] transition-colors">
                  Choose Date &amp; Time <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Soft decorative curve at the bottom of the hero */}
          <div className="absolute left-0 right-0 bottom-[-1px] h-24 lg:h-32 bg-[#fdf9f3] z-10 [clip-path:ellipse(65%_100%_at_18%_100%)]" />
        </section>

        {/* ============================================================ */}
        {/* TAGLINE / GHOST WATERMARK BANNER                                */}
        {/* ============================================================ */}
        <section className="relative w-full overflow-hidden bg-white border-y border-[#ccc6bd]/30 py-24 flex flex-col justify-center items-center">
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center select-none pointer-events-none overflow-hidden whitespace-nowrap opacity-[0.05] text-[90px] sm:text-[140px] md:text-[180px] lg:text-[220px] font-extrabold uppercase tracking-widest text-[#2A1D12] leading-none -z-0"
          >
            EFFORTLESS PRESTIGE
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-5 md:px-8 lg:px-14 text-center space-y-4">
            <Eyebrow>The Aesthetic Operating System</Eyebrow>

            <h2 className="font-[family-name:var(--font-playfair)] text-[36px] sm:text-[54px] md:text-[68px] lg:text-[80px] leading-[1.04] text-[#2A1D12] font-bold tracking-tight uppercase">
              EFFORTLESS PRESTIGE. <br className="hidden sm:inline" />
              <span className="italic font-normal text-[#795831]">
                ZERO CHAOS.
              </span>
            </h2>
            <div className="w-20 h-0.5 bg-[#795831]/60 mx-auto mt-2" />

            <p className="text-[16px] md:text-[19px] leading-relaxed text-[#4a4640] max-w-3xl mx-auto font-normal pt-1">
              ADNAVRA Bliss rearchitects the modern salon experience—replacing
              friction, frantic WhatsApp messages, and double-bookings with
              quiet digital precision.
            </p>
          </div>
        </section>

        {/* ============================================================ */}
        {/* STATS STRIP — 4 quick-glance numbers                            */}
        {/* ============================================================ */}
        <section className="relative w-full bg-[#fdf9f3] border-b border-[#ccc6bd]/30">
          <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-[#ccc6bd]/40">
            {[
              {
                stat: "24/7",
                title: "Online Self-Book",
                desc: "Zero phone interruptions during treatments",
              },
              {
                stat: "100%",
                title: "Realtime Roster Sync",
                desc: "Eliminate accidental double-booking entirely",
              },
              {
                stat: "0%",
                title: "Booking Commissions",
                desc: "Retain 100% of your guest and ritual revenue",
              },
              {
                stat: "< 3 min",
                title: "Booking Speed",
                desc: "Frictionless digital concierge checkout",
              },
            ].map((s) => (
              <div key={s.title} className="py-10 px-0 lg:px-8 first:pl-0">
                <div className="font-[family-name:var(--font-playfair)] text-[34px] sm:text-[40px] text-[#171514] font-bold tracking-tight leading-none">
                  {s.stat}
                </div>
                <div className="mt-3 text-[14px] text-[#795831] font-semibold">
                  {s.title}
                </div>
                <p className="mt-1 text-[13px] text-[#6b625c] leading-relaxed max-w-[220px]">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION: 4 SALON PILLARS (hover reveal)                         */}
        {/* ============================================================ */}
        <section className="relative w-full bg-[#2A1D12] border-y border-[#ccc6bd]/30 overflow-hidden" id="rituals">
          <div className="w-full bg-[#f7f3ed] border-b border-[#ccc6bd]/20 py-6 px-5 md:px-8 lg:px-14 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <Eyebrow>The Salon, Orchestrated</Eyebrow>
              <h2 className="font-[family-name:var(--font-playfair)] text-[26px] sm:text-[30px] text-[#2A1D12] font-semibold tracking-tight">
                THE SALON, ORCHESTRATED.{" "}
                <span className="italic font-normal text-[#795831] block sm:inline">
                  Four systems. One beautiful operating flow.
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-[#4a4640] font-medium">
              <MousePointerClick className="h-4 w-4 text-[#795831]" />
              <span>Hover any column to see it in action</span>
            </div>
          </div>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 h-auto lg:h-[680px] divide-y lg:divide-y-0 lg:divide-x divide-white/10">
            {pillars.map((p, i) => {
              const hovered = hoveredPillar === i;
              return (
                <div
                  key={p.n}
                  onMouseEnter={() => setHoveredPillar(i)}
                  onMouseLeave={() => setHoveredPillar(null)}
                  className="group relative h-[520px] lg:h-full overflow-hidden cursor-pointer select-none bg-[#2A1D12]"
                >
                  <img
                    alt={p.title}
                    className={`absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out ${hovered ? "scale-110" : ""}`}
                    src={p.img}
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-500 pointer-events-none ${hovered ? "opacity-0" : ""}`}
                  />

                  {/* Resting content */}
                  <div
                    className={`absolute inset-x-0 bottom-0 p-8 space-y-2 z-10 transition-all duration-500 pointer-events-none ${
                      hovered ? "opacity-0 translate-y-6" : ""
                    }`}
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#795831]" />
                      <span className="text-[11px] text-[#795831] font-bold uppercase tracking-wider">
                        {p.n} / {p.tag}
                      </span>
                    </div>
                    <h3 className="font-[family-name:var(--font-playfair)] text-[22px] text-white font-semibold leading-tight">
                      {p.title}
                    </h3>
                    <p className="text-[13px] text-stone-300 line-clamp-2">
                      {p.blurb}
                    </p>
                  </div>

                  {/* Hover reveal panel */}
                  <div
                    className={`absolute inset-0 z-20 bg-[#2A1D12]/90 backdrop-blur-xl text-white p-8 flex flex-col justify-between transform transition-transform duration-500 ease-in-out border-b-4 border-[#795831] shadow-2xl ${
                      hovered ? "translate-y-0" : "-translate-y-full"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-white/15 pb-4">
                      <span className="font-[family-name:var(--font-playfair)] text-3xl text-[#795831] font-bold">
                        {p.n}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#795831]/20 border border-[#795831]/40 text-[#ffddba] text-[11px] font-semibold tracking-wide uppercase">
                        <span className="w-2 h-2 rounded-full bg-[#795831] animate-ping" />
                        {p.badge}
                      </span>
                    </div>

                    <div className="space-y-4 my-auto">
                      <span className="text-[11px] text-[#795831] uppercase tracking-widest font-bold">
                        {p.kicker}
                      </span>
                      <h4 className="font-[family-name:var(--font-playfair)] text-2xl text-white font-semibold leading-snug">
                        {p.heading}
                      </h4>
                      <p className="text-[13px] text-stone-300 leading-relaxed">
                        {p.detail}
                      </p>
                      <div className="space-y-2 pt-2">
                        <div className="p-2.5 rounded-lg bg-[#f6efe3] border border-[#e6dcc8] flex items-center justify-between text-[13px]">
                          <span className="text-stone-400">{p.stat1[0]}</span>
                          <span className="font-semibold text-[#ffddba]">{p.stat1[1]}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#f6efe3] border border-[#e6dcc8] flex items-center justify-between text-[13px]">
                          <span className="text-stone-400">{p.stat2[0]}</span>
                          <span className="font-semibold text-white">{p.stat2[1]}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#e6dcc8] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#ffddba] font-bold tracking-wider uppercase">
                          {p.footNote}
                        </span>
                        <span className="text-[13px] text-stone-400">{p.footSub}</span>
                      </div>
                      <Link
                        href="#dual-engine"
                        className="w-full py-3 rounded-lg bg-[#2A1D12] text-white text-[15px] font-semibold hover:bg-[#17100A] transition-colors flex items-center justify-center gap-2 shadow-lg"
                      >
                        <span>Explore Feature</span>
                        <ArrowRight className="h-[18px] w-[18px]" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 3: OLD VS NEW COMPARISON                                */}
        {/* ============================================================ */}
        <section className="w-full max-w-7xl mx-auto px-5 md:px-8 lg:px-14 py-24 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Eyebrow>Hospitality Evolution</Eyebrow>
            <h2 className="font-[family-name:var(--font-playfair)] text-[28px] sm:text-[38px] text-[#2A1D12] font-semibold leading-tight">
              The Old Manual Grind vs. The ADNAVRA Bliss Standard
            </h2>
            <p className="text-[16px] text-[#4a4640]">
              Elevate your salon past brittle paper registers and endless
              WhatsApp voice notes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-[#f1ede7] space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-[#7b766f] font-semibold">
                    Yesterday&apos;s Friction
                  </span>
                  <h3 className="font-[family-name:var(--font-playfair)] text-[22px] text-[#1c1c18] font-medium">
                    The Manual Routine
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#ebe8e2] flex items-center justify-center text-[#7b766f]">
                  <X className="h-5 w-5" />
                </div>
              </div>
              <ul className="space-y-4 text-[14px] text-[#4a4640]">
                {[
                  "Unanswered WhatsApp DMs after 8:00 PM causing high-value clients to book elsewhere",
                  "Rushed front-desk phone calls echoing over tranquil blow-dry and styling suites",
                  "Faded handwritten register books leading to awkward duplicate chair bookings",
                  "Lost client color formulas, scalp allergies, and forgotten beverage preferences",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <Circle className="h-5 w-5 mt-0.5 shrink-0 text-[#7b766f]" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-[#f7f3ed] shadow-[0_16px_40px_-8px_rgba(121,88,49,0.12)] space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#fdcf9e]/20 rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-[#795831] font-semibold">
                    The Modern Atelier
                  </span>
                  <h3 className="font-[family-name:var(--font-playfair)] text-[22px] text-[#2A1D12] font-semibold">
                    The ADNAVRA Bliss Standard
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#fdcf9e] flex items-center justify-center text-[#785730]">
                  <Check className="h-5 w-5" />
                </div>
              </div>
              <ul className="space-y-4 text-[14px] text-[#1c1c18]">
                {[
                  ["24/7 Branded Booking Storefront", "natively linked to your Instagram Bio, Google Maps, and salon web presence"],
                  ["Instant Slot Locking", "with automated WhatsApp & SMS confirmations, reducing salon no-shows by 97%"],
                  ["Digital Guest Cards", "securely archiving exact toner mixes, hair porosity notes, and previous visits"],
                  ["Real-time Sri Lanka Rupee Analytics", "calculating stylist commissions, chair occupancy, and retail sales"],
                ].map(([strong, rest]) => (
                  <li key={strong} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-[#795831]" />
                    <span>
                      <strong className="font-semibold">{strong}</strong> {rest}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 4: DUAL ENGINE ARCHITECTURE                             */}
        {/* ============================================================ */}
        <section className="w-full bg-[#f1ede7] py-24" id="dual-engine">
          <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-14 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <Eyebrow>Dual Engine Architecture</Eyebrow>
                <h2 className="font-[family-name:var(--font-playfair)] text-[28px] sm:text-[38px] text-[#2A1D12] font-semibold">
                  Designed for clients. Built for owners.
                </h2>
                <p className="text-[15px] text-[#4a4640]">
                  A seamless visual harmony between the guest&apos;s serene
                  ritual booking and the salon proprietor&apos;s commanding
                  control suite.
                </p>
              </div>

              <div className="inline-flex self-start p-1 rounded-full bg-[#ebe8e2] shadow-inner">
                <button
                  onClick={() => setEngine("client")}
                  className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all ${
                    engine === "client" ? "bg-[#2A1D12] text-white shadow-sm" : "text-[#4a4640]"
                  }`}
                >
                  Client Experience
                </button>
                <button
                  onClick={() => setEngine("owner")}
                  className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all ${
                    engine === "owner" ? "bg-[#2A1D12] text-white shadow-sm" : "text-[#4a4640]"
                  }`}
                >
                  Salon Command
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Client panel */}
              <div
                className={`lg:col-span-6 bg-white rounded-2xl p-8 shadow-[0_12px_36px_rgba(74,72,69,0.06)] space-y-6 flex flex-col justify-between transition-shadow ${
                  engine === "client" ? "ring-2 ring-[#795831]" : ""
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-[#795831] font-semibold">
                        Aura Luxury Salon • Colombo 07
                      </span>
                      <h3 className="font-[family-name:var(--font-playfair)] text-[20px] text-[#2A1D12]">
                        Hydrating Keratin Hair Spa
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="font-[family-name:var(--font-playfair)] text-[20px] text-[#2A1D12] font-bold">
                        LKR 4,500
                      </span>
                      <span className="block text-[11px] text-[#7b766f]">
                        45 Minutes
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#f7f3ed] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#ffddba] flex items-center justify-center font-bold text-[#2b1700]">
                      NL
                    </div>
                    <div className="flex-1">
                      <div className="text-[15px] font-semibold text-[#2A1D12]">
                        Senior Stylist Nimali
                      </div>
                      <div className="text-[12px] text-[#4a4640]">
                        Master Colorist &amp; Scalp Specialist • 98% Rating
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-white text-[11px] text-[#795831] font-semibold">
                      Available Today
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider text-[#4a4640] font-semibold">
                      Select Arrival Slot
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["10:30 AM", "11:15 AM", "02:00 PM"].map((s, i) => (
                        <button
                          key={s}
                          onClick={() => setSlot(i)}
                          className={`py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                            slot === i
                              ? "bg-[#2A1D12] text-white shadow-sm"
                              : "bg-[#f1ede7] text-[#1c1c18] hover:bg-[#ebe8e2]"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button className="w-full py-3.5 rounded-lg bg-[#2A1D12] text-white text-[15px] font-semibold hover:bg-[#4a4640] transition-colors shadow-md flex items-center justify-center gap-2">
                    <Lock className="h-[18px] w-[18px]" />
                    <span>Instant Confirm Reservation</span>
                  </button>
                  <p className="text-center text-[11px] text-[#7b766f] pt-2">
                    Cardless booking • Pay at sanctuary upon completion
                  </p>
                </div>
              </div>

              {/* Owner panel */}
              <div
                className={`lg:col-span-6 bg-white rounded-2xl p-8 shadow-[0_12px_36px_rgba(74,72,69,0.06)] space-y-6 flex flex-col justify-between transition-shadow ${
                  engine === "owner" ? "ring-2 ring-[#795831]" : ""
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-[#795831] font-semibold">
                        Executive Cockpit
                      </span>
                      <h3 className="font-[family-name:var(--font-playfair)] text-[20px] text-[#2A1D12]">
                        Today&apos;s Salon Velocity
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#fdcf9e] text-[#785730] text-[11px] font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#795831]" /> 94%
                      Capacity
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#f7f3ed] space-y-1">
                      <span className="text-[12px] text-[#4a4640]">
                        Scheduled Appointments
                      </span>
                      <div className="font-[family-name:var(--font-playfair)] text-[24px] text-[#2A1D12] font-bold">
                        18 Slots
                      </div>
                      <span className="text-[11px] text-[#795831] font-medium">
                        +4 vs yesterday
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#f7f3ed] space-y-1">
                      <span className="text-[12px] text-[#4a4640]">
                        Projected Revenue
                      </span>
                      <div className="font-[family-name:var(--font-playfair)] text-[24px] text-[#2A1D12] font-bold">
                        LKR 148,500
                      </div>
                      <span className="text-[11px] text-[#795831] font-medium">
                        92% target attained
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-[#4a4640] font-semibold">
                      Active Roster &amp; Chair Occupancy
                    </span>
                    <div className="space-y-2 pt-1">
                      {[
                        ["Nimali P. (Chair 1)", "Keratin Spa • Ends in 18 min", true],
                        ["Dinesh K. (Chair 2)", "Balayage Foil • In Progress", true],
                        ["Sanduni F. (Chair 3)", "Open Slot (Next: 14:00)", false],
                      ].map(([name, status, active]) => (
                        <div
                          key={name as string}
                          className="p-2.5 rounded-lg bg-[#f7f3ed] flex items-center justify-between text-[13px]"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                active ? "bg-[#795831]" : "bg-[#ccc6bd]"
                              }`}
                            />
                            <span className="font-medium text-[#2A1D12]">{name}</span>
                          </div>
                          <span className={active ? "text-[#4a4640]" : "text-[#795831] font-medium"}>
                            {status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[13px]">
                  <span className="text-[#4a4640]">
                    Live sync to Colombo POS terminals
                  </span>
                  <Link
                    href="/dashboard"
                    className="text-[#2A1D12] font-semibold flex items-center gap-1 hover:underline"
                  >
                    Open Master Agenda <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 5: CLIENT JOURNEY                                       */}
        {/* ============================================================ */}
        <section className="w-full max-w-7xl mx-auto px-5 md:px-8 lg:px-14 py-24 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Eyebrow>The Unbroken Experience</Eyebrow>
            <h2 className="font-[family-name:var(--font-playfair)] text-[28px] sm:text-[38px] text-[#2A1D12] font-semibold">
              5 Serene Moments from Discovery to Rebooking
            </h2>
            <p className="text-[16px] text-[#4a4640]">
              Crafting an elevated ritual where technology dissolves into
              pure hospitality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {journeySteps.map((s) => (
              <div
                key={s.n}
                className="p-6 rounded-xl bg-[#f7f3ed] space-y-2 hover:shadow-md transition-shadow"
              >
                <span className="text-[11px] text-[#795831] font-semibold">
                  {s.n} • {s.tag}
                </span>
                <h4 className="text-[16px] text-[#2A1D12] font-semibold">
                  {s.title}
                </h4>
                <p className="text-[13px] text-[#4a4640]">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 6: QR MIRROR CONCIERGE                                  */}
        {/* ============================================================ */}
        <section className="w-full bg-[#f7f3ed] py-24">
          <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white shadow-sm">
                  <QrCode className="h-4 w-4 text-[#795831]" />
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#795831]">
                    Physical Meets Digital Concierge
                  </span>
                </div>
                <h2 className="font-[family-name:var(--font-playfair)] text-[28px] sm:text-[38px] text-[#2A1D12] font-semibold leading-tight">
                  Turn every physical touchpoint into a perpetual rebooking
                  engine.
                </h2>
                <p className="text-[16px] text-[#4a4640] leading-relaxed">
                  Empower your stylists without awkward front-desk sales
                  pressure. Place luxury foil-embossed QR cards on styling
                  station mirrors, reception counters, and luxury product
                  gift sets. Clients scan and lock their next 6-week
                  maintenance ritual while still seated in pure bliss.
                </p>
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-3 text-[14px] text-[#1c1c18]">
                    <Sparkles className="h-5 w-5 text-[#795831] shrink-0" />
                    <span>
                      <strong className="font-semibold">
                        8-Second Rebook Flow:
                      </strong>{" "}
                      Identifies returning client phone number instantly
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[14px] text-[#1c1c18]">
                    <Wand2 className="h-5 w-5 text-[#795831] shrink-0" />
                    <span>
                      <strong className="font-semibold">
                        Bespoke Printed Kits:
                      </strong>{" "}
                      Complimentary gold-embossed counter displays shipped to
                      your salon
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#2A1D12] text-white text-[15px] font-semibold hover:bg-[#17100A] transition-all shadow-md"
                  >
                    <span>Generate Salon QR Kit</span>
                    <ArrowRight className="h-[18px] w-[18px]" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6 relative flex justify-center">
                <div className="relative w-full max-w-[480px] rounded-2xl overflow-hidden shadow-[0_20px_48px_rgba(74,72,69,0.12)]">
                  <img
                    alt="Luxury foil-pressed QR rebooking card displayed on travertine counter with pampas grass"
                    className="w-full h-[380px] sm:h-[440px] object-cover object-center"
                    src={qrCardImg}
                  />
                  <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Nfc className="h-6 w-6 text-[#795831]" />
                      <div>
                        <div className="text-[15px] text-[#2A1D12] font-semibold">
                          Château Élégante QR
                        </div>
                        <div className="text-[12px] text-[#4a4640]">
                          Tap or scan to lock next visit
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#ffddba] text-[#2b1700] text-[11px] font-bold">
                      8s Average
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 7: FEATURE GRID                                         */}
        {/* ============================================================ */}
        <section id="features" className="w-full max-w-7xl mx-auto px-5 md:px-8 lg:px-14 py-24 space-y-12 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Eyebrow>Complete Salon Architecture</Eyebrow>
            <h2 className="font-[family-name:var(--font-playfair)] text-[28px] sm:text-[38px] text-[#2A1D12] font-semibold">
              Everything your salon needs to run beautifully.
            </h2>
            <p className="text-[16px] text-[#4a4640]">
              Engineered specifically to solve the distinct operational
              bottlenecks of Sri Lankan beauty businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-8 rounded-2xl bg-[#f1ede7] space-y-4 hover:bg-[#ebe8e2] transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#2A1D12] shadow-sm">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-[17px] text-[#2A1D12] font-semibold">
                    {f.title}
                  </h3>
                  <p className="text-[13px] text-[#4a4640]">{f.desc}</p>
                </div>
                <div className="pt-1 text-[11px] uppercase tracking-wider text-[#2A1D12] font-bold">
                  {f.tag}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 8: CINEMATIC BANNER                                     */}
        {/* ============================================================ */}
        <section className="relative w-full h-[420px] sm:h-[480px] overflow-hidden my-8 flex items-center">
          <img
            alt="Cinematic interior view of luxury salon atelier in Sri Lanka with arched architectural alcoves"
            className="absolute inset-0 w-full h-full object-cover object-center"
            src={bannerImg}
          />
          <div className="absolute inset-0 bg-[#2A1D12]/70 backdrop-blur-[2px]" />
          <div className="relative z-10 max-w-4xl mx-auto px-5 md:px-8 lg:px-14 text-center space-y-4 text-white">
            <span className="text-[11px] uppercase tracking-widest text-[#ffddba] font-semibold">
              Atmospheric Reverence
            </span>
            <h2 className="font-[family-name:var(--font-playfair)] text-[28px] sm:text-[42px] font-semibold leading-tight">
              Where beauty meets quiet technological perfection.
            </h2>
            <p className="text-[16px] text-[#e6e2dc] max-w-2xl mx-auto">
              Give your salon an online presence as immaculate and serene as
              the physical sanctuary you have poured your heart into
              creating.
            </p>
            <div className="pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center px-7 py-3.5 rounded-lg bg-white text-[#2A1D12] text-[15px] font-semibold hover:bg-[#f1ede7] transition-colors shadow-lg"
              >
                Claim Your Salon Storefront
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 9: ACTIVITY STREAM + FAQ                                */}
        {/* ============================================================ */}
        <section id="faq" className="w-full max-w-7xl mx-auto px-5 md:px-8 lg:px-14 py-24 scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* <div className="lg:col-span-5 space-y-6">
              <div className="space-y-1">
                <Eyebrow>Live Salon Pulse</Eyebrow>
                <h2 className="font-[family-name:var(--font-playfair)] text-[24px] text-[#2A1D12] font-semibold pt-1">
                  Salon Activity Stream
                </h2>
                <p className="text-[14px] text-[#4a4640]">
                  Real-time alerts streamed silently to your mobile or desk
                  tablet.
                </p>
              </div>

              <div className="space-y-3">
                {activity.map((a) => (
                  <div
                    key={a.title}
                    className="p-4 rounded-xl bg-[#f7f3ed] flex items-start gap-3 shadow-sm"
                  >
                    <span className="w-9 h-9 rounded-full bg-[#fdcf9e] flex items-center justify-center text-[#785730] shrink-0">
                      <a.icon className="h-[18px] w-[18px]" />
                    </span>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[15px] font-semibold text-[#2A1D12]">
                          {a.title}
                        </span>
                        <span className="text-[11px] text-[#7b766f]">
                          {a.time}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#4a4640]">{a.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div> */}

            <div className="lg:col-span-8 lg:col-start-3 space-y-4">
              <div className="space-y-1 text-center">
                <Eyebrow>Clarity &amp; Assurance</Eyebrow>
                <h2 className="font-[family-name:var(--font-playfair)] text-[24px] text-[#2A1D12] font-semibold pt-1">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="space-y-2">
                {faqs.map((f, i) => (
                  <div
                    key={f.q}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="rounded-xl bg-[#f1ede7] p-5 space-y-2 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-[15px] text-[#2A1D12] font-semibold">
                        {f.q}
                      </h3>
                      <ChevronDown
                        className={`h-5 w-5 text-[#7b766f] shrink-0 transition-transform duration-300 ${
                          openFaq === i ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    {openFaq === i && (
                      <div className="text-[13.5px] text-[#4a4640] leading-relaxed pr-6">
                        {f.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 10: FINAL CTA                                           */}
        {/* ============================================================ */}
        <section className="w-full max-w-7xl mx-auto px-5 md:px-8 lg:px-14 pb-24">
          <div className="rounded-3xl bg-[#f7f3ed] p-10 lg:p-20 shadow-[0_24px_64px_rgba(74,72,69,0.06)] relative overflow-hidden text-center space-y-6">
            <div className="max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] uppercase tracking-widest text-[#795831] font-semibold">
                Elevate Your Standard
              </span>
              <h2 className="font-[family-name:var(--font-playfair)] text-[28px] sm:text-[42px] text-[#2A1D12] font-semibold leading-tight">
                Your salon deserves to be effortlessly booked.
              </h2>
              <p className="text-[16px] text-[#4a4640]">
                Join Colombo, Galle, and Kandy&apos;s most distinguished
                salons elevating their hospitality standard today. Free
                14-day trial with full VIP white-glove onboarding.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg bg-[#2A1D12] text-white text-[15px] font-semibold hover:bg-[#4a4640] transition-all shadow-[0_12px_28px_rgba(31,30,29,0.14)]"
              >
                Get Started Free
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-white text-[#1c1c18] text-[15px] font-semibold hover:bg-[#f1ede7] transition-colors shadow-sm"
              >
                <span>Schedule a Demo</span>
                <Calendar className="h-[18px] w-[18px]" />
              </Link>
            </div>
            <p className="text-[11px] text-[#7b766f]">
              No credit card required • Active setup in under 15 minutes
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

