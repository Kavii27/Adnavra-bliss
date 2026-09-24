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

export default function FeaturesPage() {
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

        </main>

      <SiteFooter />
    </div>
  );
}

