"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
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
  ChevronDown,
  Calendar,
  MousePointerClick,
} from "lucide-react";
import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { useLocale } from "@/lib/i18n/locale-context";

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
    tagKey: "about.pillar1.tag",
    titleKey: "about.pillar1.title",
    blurbKey: "about.pillar1.blurb",
    img: colorLabImg,
    badgeKey: "about.pillar1.badge",
    kickerKey: "about.pillar1.kicker",
    headingKey: "about.pillar1.heading",
    detailKey: "about.pillar1.detail",
    stat1LabelKey: "about.pillar1.stat1label",
    stat1ValueKey: "about.pillar1.stat1value",
    stat2LabelKey: "about.pillar1.stat2label",
    stat2ValueKey: "about.pillar1.stat2value",
    footNoteKey: "about.pillar1.footnote",
    footSubKey: "about.pillar1.footsub",
  },
  {
    n: "02",
    tagKey: "about.pillar2.tag",
    titleKey: "about.pillar2.title",
    blurbKey: "about.pillar2.blurb",
    img: stylingImg,
    badgeKey: "about.pillar2.badge",
    kickerKey: "about.pillar2.kicker",
    headingKey: "about.pillar2.heading",
    detailKey: "about.pillar2.detail",
    stat1LabelKey: "about.pillar2.stat1label",
    stat1ValueKey: "about.pillar2.stat1value",
    stat2LabelKey: "about.pillar2.stat2label",
    stat2ValueKey: "about.pillar2.stat2value",
    footNoteKey: "about.pillar2.footnote",
    footSubKey: "about.pillar2.footsub",
  },
  {
    n: "03",
    tagKey: "about.pillar3.tag",
    titleKey: "about.pillar3.title",
    blurbKey: "about.pillar3.blurb",
    img: chairImg,
    badgeKey: "about.pillar3.badge",
    kickerKey: "about.pillar3.kicker",
    headingKey: "about.pillar3.heading",
    detailKey: "about.pillar3.detail",
    stat1LabelKey: "about.pillar3.stat1label",
    stat1ValueKey: "about.pillar3.stat1value",
    stat2LabelKey: "about.pillar3.stat2label",
    stat2ValueKey: "about.pillar3.stat2value",
    footNoteKey: "about.pillar3.footnote",
    footSubKey: "about.pillar3.footsub",
  },
  {
    n: "04",
    tagKey: "about.pillar4.tag",
    titleKey: "about.pillar4.title",
    blurbKey: "about.pillar4.blurb",
    img: revenueImg,
    badgeKey: "about.pillar4.badge",
    kickerKey: "about.pillar4.kicker",
    headingKey: "about.pillar4.heading",
    detailKey: "about.pillar4.detail",
    stat1LabelKey: "about.pillar4.stat1label",
    stat1ValueKey: "about.pillar4.stat1value",
    stat2LabelKey: "about.pillar4.stat2label",
    stat2ValueKey: "about.pillar4.stat2value",
    footNoteKey: "about.pillar4.footnote",
    footSubKey: "about.pillar4.footsub",
  },
];

const journeySteps = [
  { n: "01", tagKey: "about.journey.s1.tag", titleKey: "about.journey.s1.title", descKey: "about.journey.s1.desc" },
  { n: "02", tagKey: "about.journey.s2.tag", titleKey: "about.journey.s2.title", descKey: "about.journey.s2.desc" },
  { n: "03", tagKey: "about.journey.s3.tag", titleKey: "about.journey.s3.title", descKey: "about.journey.s3.desc" },
  { n: "04", tagKey: "about.journey.s4.tag", titleKey: "about.journey.s4.title", descKey: "about.journey.s4.desc" },
  { n: "05", tagKey: "about.journey.s5.tag", titleKey: "about.journey.s5.title", descKey: "about.journey.s5.desc" },
];

const features = [
  { icon: Store, titleKey: "about.feat.f1.title", descKey: "about.feat.f1.desc", tagKey: "about.feat.f1.tag" },
  { icon: Users, titleKey: "about.feat.f2.title", descKey: "about.feat.f2.desc", tagKey: "about.feat.f2.tag" },
  { icon: Palette, titleKey: "about.feat.f3.title", descKey: "about.feat.f3.desc", tagKey: "about.feat.f3.tag" },
  { icon: BarChart3, titleKey: "about.feat.f4.title", descKey: "about.feat.f4.desc", tagKey: "about.feat.f4.tag" },
];

const faqs = [
  { qKey: "about.faq.q1", aKey: "about.faq.a1" },
  { qKey: "about.faq.q2", aKey: "about.faq.a2" },
  { qKey: "about.faq.q3", aKey: "about.faq.a3" },
  { qKey: "about.faq.q4", aKey: "about.faq.a4" },
];

export default function AboutPage() {
  const { t } = useLocale();
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
              <img src={heroImg} alt={t("about.alt.hero")} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Hero content sits above the image */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-8 lg:px-14 pt-28 lg:pt-36 pb-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center min-h-[620px]">
              <div className="lg:col-span-6 xl:col-span-5 space-y-6 max-w-[610px]">
                <div className="inline-flex items-center gap-3 text-[#795831]">
                  <span className="text-xl leading-none">✦</span>
                  <span className="text-[11px] uppercase tracking-[0.25em] font-semibold">
                    {t("about.hero.eyebrow")}
                  </span>
                </div>

                <h1 className="font-[family-name:var(--font-playfair)] text-[48px] leading-[0.98] sm:text-[64px] sm:leading-[1.02] lg:text-[72px] lg:leading-[0.98] text-[#171514] tracking-[-0.035em] font-medium">
                  {t("about.hero.t1")}
                  <br />
                  <span className="italic font-normal text-[#795831]">{t("about.hero.t2")}</span>
                  <br />
                  {t("about.hero.t3")}
                </h1>

                <p className="text-[16px] leading-[27px] text-[#4a4640] max-w-[520px]">
                  {t("about.hero.sub")}
                </p>

                <div className="mt-6 inline-flex max-w-full items-center gap-3 rounded-xl border border-[#E5DDD0] bg-white px-5 py-3">
                  <Image src="/logo.png" alt="ADNAVRA" width={28} height={28} className="h-7 w-7 shrink-0 rounded-md object-contain" />
                  <p className="text-sm text-[#4A4640">
                    ADNAVRA BLISS is a product of <span className="font-semibold text-[#1F1E1D]">ADNAVRA (Pvt) Ltd</span>, Sri Lanka.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <Link
                    href="/signup"
                    className="group inline-flex items-center gap-5 pl-6 pr-2 py-2 rounded-full bg-[#2A1D12] text-white text-[15px] font-semibold hover:bg-[#17100A] transition-all shadow-[0_14px_32px_rgba(42,29,18,0.16)]"
                  >
                    {t("about.hero.start")}
                    <span className="w-10 h-10 rounded-full bg-white text-[#795831] flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                  <Link
                    href="#features"
                    className="inline-flex items-center gap-3 text-[15px] font-semibold text-[#1c1c18]"
                  >
                    <span className="w-10 h-10 rounded-full border border-[#4a4640] flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 -rotate-45" />
                    </span>
                    {t("about.hero.explore")}
                  </Link>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-[#6b625c]">
                  <span className="font-medium">{t("about.hero.badge1")}</span>
                  <span className="text-[#b5a9a1]">•</span>
                  <span className="font-medium">{t("about.hero.badge2")}</span>
                  <span className="text-[#b5a9a1]">•</span>
                  <span className="font-medium">{t("about.hero.badge3")}</span>
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
                      <span className="text-[11px] uppercase tracking-[0.18em] text-[#795831] font-bold">{t("about.card.live")}</span>
                      <span className="text-[11px] text-[#7b766f]">{t("about.card.today")}</span>
                    </div>
                    <h3 className="font-[family-name:var(--font-playfair)] text-[23px] text-[#171514] mt-1">{t("about.card.title")}</h3>
                    <p className="text-[12px] text-[#6b625c] mt-1">{t("about.card.sub")}</p>
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
                  {t("about.card.cta")} <ArrowRight className="h-4 w-4" />
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
            <Eyebrow>{t("about.banner.eyebrow")}</Eyebrow>

            <h2 className="font-[family-name:var(--font-playfair)] text-[36px] sm:text-[54px] md:text-[68px] lg:text-[80px] leading-[1.04] text-[#2A1D12] font-bold tracking-tight uppercase">
              {t("about.banner.t1")} <br className="hidden sm:inline" />
              <span className="italic font-normal text-[#795831]">
                {t("about.banner.t2")}
              </span>
            </h2>
            <div className="w-20 h-0.5 bg-[#795831]/60 mx-auto mt-2" />

            <p className="text-[16px] md:text-[19px] leading-relaxed text-[#4A4640] max-w-3xl mx-auto font-normal pt-1">
              {t("about.banner.sub")}
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
                titleKey: "about.stats.s1.title",
                descKey: "about.stats.s1.desc",
              },
              {
                stat: "100%",
                titleKey: "about.stats.s2.title",
                descKey: "about.stats.s2.desc",
              },
              {
                stat: "0%",
                titleKey: "about.stats.s3.title",
                descKey: "about.stats.s3.desc",
              },
              {
                stat: "< 3 min",
                titleKey: "about.stats.s4.title",
                descKey: "about.stats.s4.desc",
              },
            ].map((s) => (
              <div key={s.titleKey} className="py-10 px-0 lg:px-8 first:pl-0">
                <div className="font-[family-name:var(--font-playfair)] text-[34px] sm:text-[40px] text-[#171514] font-bold tracking-tight leading-none">
                  {s.stat}
                </div>
                <div className="mt-3 text-[14px] text-[#795831] font-semibold">
                  {t(s.titleKey)}
                </div>
                <p className="mt-1 text-[13px] text-[#6b625c] leading-relaxed max-w-[220px]">
                  {t(s.descKey)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4 SALON PILLARS (hover reveal) */}
        {/* ============================================================ */}
        <section className="relative w-full bg-[#2A1D12] border-y border-[#ccc6bd]/30 overflow-hidden scroll-mt-24" id="features">
          <div className="w-full bg-[#f7f3ed] border-b border-[#ccc6bd]/20 py-6 px-5 md:px-8 lg:px-14 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <Eyebrow>{t("about.pillars.eyebrow")}</Eyebrow>
              <h2 className="font-[family-name:var(--font-playfair)] text-[26px] sm:text-[30px] text-[#2A1D12] font-semibold tracking-tight">
                {t("about.pillars.title")}{" "}
                <span className="italic font-normal text-[#795831] block sm:inline">
                  {t("about.pillars.sub")}
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-[#4a4640] font-medium">
              <MousePointerClick className="h-4 w-4 text-[#795831]" />
              <span>{t("about.pillars.hint")}</span>
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
                    alt={t(p.titleKey)}
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
                        {p.n} / {t(p.tagKey)}
                      </span>
                    </div>
                    <h3 className="font-[family-name:var(--font-playfair)] text-[22px] text-white font-semibold leading-tight">
                      {t(p.titleKey)}
                    </h3>
                    <p className="text-[13px] text-stone-300 line-clamp-2">
                      {t(p.blurbKey)}
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
                        {t(p.badgeKey)}
                      </span>
                    </div>

                    <div className="space-y-4 my-auto">
                      <span className="text-[11px] text-[#795831] uppercase tracking-widest font-bold">
                        {t(p.kickerKey)}
                      </span>
                      <h4 className="font-[family-name:var(--font-playfair)] text-2xl text-white font-semibold leading-snug">
                        {t(p.headingKey)}
                      </h4>
                      <p className="text-[13px] text-stone-300 leading-relaxed">
                        {t(p.detailKey)}
                      </p>
                      <div className="space-y-2 pt-2">
                        <div className="p-2.5 rounded-lg bg-[#f6efe3] border border-[#e6dcc8] flex items-center justify-between text-[13px]">
                          <span className="text-stone-400">{t(p.stat1LabelKey)}</span>
                          <span className="font-semibold text-[#ffddba]">{t(p.stat1ValueKey)}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#f6efe3] border border-[#e6dcc8] flex items-center justify-between text-[13px]">
                          <span className="text-stone-400">{t(p.stat2LabelKey)}</span>
                          <span className="font-semibold text-white">{t(p.stat2ValueKey)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#e6dcc8] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#ffddba] font-bold tracking-wider uppercase">
                          {t(p.footNoteKey)}
                        </span>
                        <span className="text-[13px] text-stone-400">{t(p.footSubKey)}</span>
                      </div>
                      <Link
                        href="#dual-engine"
                        className="w-full py-3 rounded-lg bg-[#2A1D12] text-white text-[15px] font-semibold hover:bg-[#17100A] transition-colors flex items-center justify-center gap-2 shadow-lg"
                      >
                        <span>{t("about.pillars.explore")}</span>
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
        {/* FEATURES: OLD VS NEW COMPARISON                                 */}
        {/* ============================================================ */}
        <section className="w-full max-w-7xl mx-auto px-5 md:px-8 lg:px-14 py-24 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Eyebrow>{t("about.compare.eyebrow")}</Eyebrow>
            <h2 className="font-[family-name:var(--font-playfair)] text-[28px] sm:text-[38px] text-[#2A1D12] font-semibold leading-tight">
              {t("about.compare.title")}
            </h2>
            <p className="text-[16px] text-[#4a4640]">
              {t("about.compare.sub")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-[#f1ede7] space-y-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-[#7b766f] font-semibold">
                    {t("about.compare.oldEyebrow")}
                  </span>
                  <h3 className="font-[family-name:var(--font-playfair)] text-[22px] text-[#1c1c18] font-medium">
                    {t("about.compare.oldTitle")}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#ebe8e2] flex items-center justify-center text-[#7b766f]">
                  <X className="h-5 w-5" />
                </div>
              </div>
              <ul className="space-y-4 text-[14px] text-[#4a4640]">
                {[
                  "about.compare.old1",
                  "about.compare.old2",
                  "about.compare.old3",
                  "about.compare.old4",
                ].map((k) => (
                  <li key={k} className="flex items-start gap-3">
                    <Circle className="h-5 w-5 mt-0.5 shrink-0 text-[#7b766f]" />
                    <span>{t(k)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-[#f7f3ed] shadow-[0_16px_40px_-8px_rgba(121,88,49,0.12)] space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#fdcf9e]/20 rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-[#795831] font-semibold">
                    {t("about.compare.newEyebrow")}
                  </span>
                  <h3 className="font-[family-name:var(--font-playfair)] text-[22px] text-[#2A1D12] font-semibold">
                    {t("about.compare.newTitle")}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#fdcf9e] flex items-center justify-center text-[#785730]">
                  <Check className="h-5 w-5" />
                </div>
              </div>
              <ul className="space-y-4 text-[14px] text-[#1c1c18]">
                {[
                  ["about.compare.new1s", "about.compare.new1r"],
                  ["about.compare.new2s", "about.compare.new2r"],
                  ["about.compare.new3s", "about.compare.new3r"],
                  ["about.compare.new4s", "about.compare.new4r"],
                ].map(([sk, rk]) => (
                  <li key={sk} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-[#795831]" />
                    <span>
                      <strong className="font-semibold">{t(sk)}</strong> {t(rk)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* FEATURES: DUAL ENGINE ARCHITECTURE                              */}
        {/* ============================================================ */}
        <section className="w-full bg-[#f1ede7] py-24" id="dual-engine">
          <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-14 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <Eyebrow>{t("about.dual.eyebrow")}</Eyebrow>
                <h2 className="font-[family-name:var(--font-playfair)] text-[28px] sm:text-[38px] text-[#2A1D12] font-semibold">
                  {t("about.dual.title")}
                </h2>
                <p className="text-[15px] text-[#4a4640]">
                  {t("about.dual.sub")}
                </p>
              </div>

              <div className="inline-flex self-start p-1 rounded-full bg-[#ebe8e2] shadow-inner">
                <button
                  onClick={() => setEngine("client")}
                  className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all ${
                    engine === "client" ? "bg-[#2A1D12] text-white shadow-sm" : "text-[#4a4640]"
                  }`}
                >
                  {t("about.dual.clientBtn")}
                </button>
                <button
                  onClick={() => setEngine("owner")}
                  className={`px-5 py-2 rounded-full text-[13px] font-semibold transition-all ${
                    engine === "owner" ? "bg-[#2A1D12] text-white shadow-sm" : "text-[#4a4640]"
                  }`}
                >
                  {t("about.dual.ownerBtn")}
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
                        {t("about.dual.salon")}
                      </span>
                      <h3 className="font-[family-name:var(--font-playfair)] text-[20px] text-[#2A1D12]">
                        {t("about.dual.service")}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="font-[family-name:var(--font-playfair)] text-[20px] text-[#2A1D12] font-bold">
                        LKR 4,500
                      </span>
                      <span className="block text-[11px] text-[#7b766f]">
                        {t("about.dual.duration")}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#f7f3ed] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#ffddba] flex items-center justify-center font-bold text-[#2b1700]">
                      NL
                    </div>
                    <div className="flex-1">
                      <div className="text-[15px] font-semibold text-[#2A1D12]">
                        {t("about.dual.stylist")}
                      </div>
                      <div className="text-[12px] text-[#4a4640]">
                        {t("about.dual.stylistRole")}
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded bg-white text-[11px] text-[#795831] font-semibold">
                      {t("about.dual.available")}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-wider text-[#4a4640] font-semibold">
                      {t("about.dual.slotLabel")}
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
                    <span>{t("about.dual.confirm")}</span>
                  </button>
                  <p className="text-center text-[11px] text-[#7b766f] pt-2">
                    {t("about.dual.cardless")}
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
                        {t("about.dual.cockpit")}
                      </span>
                      <h3 className="font-[family-name:var(--font-playfair)] text-[20px] text-[#2A1D12]">
                        {t("about.dual.velocity")}
                      </h3>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#fdcf9e] text-[#785730] text-[11px] font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#795831]" /> {t("about.dual.capacity")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#f7f3ed] space-y-1">
                      <span className="text-[12px] text-[#4a4640]">
                        {t("about.dual.scheduled")}
                      </span>
                      <div className="font-[family-name:var(--font-playfair)] text-[24px] text-[#2A1D12] font-bold">
                        {t("about.dual.slots")}
                      </div>
                      <span className="text-[11px] text-[#795831] font-medium">
                        {t("about.dual.vsYesterday")}
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-[#f7f3ed] space-y-1">
                      <span className="text-[12px] text-[#4a4640]">
                        {t("about.dual.revenue")}
                      </span>
                      <div className="font-[family-name:var(--font-playfair)] text-[24px] text-[#2A1D12] font-bold">
                        LKR 148,500
                      </div>
                      <span className="text-[11px] text-[#795831] font-medium">
                        {t("about.dual.target")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-[#4a4640] font-semibold">
                      {t("about.dual.roster")}
                    </span>
                    <div className="space-y-2 pt-1">
                      {[
                        ["Nimali P. (Chair 1)", "about.dual.r1", true],
                        ["Dinesh K. (Chair 2)", "about.dual.r2", true],
                        ["Sanduni F. (Chair 3)", "about.dual.r3", false],
                      ].map(([name, statusKey, active]) => (
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
                            {t(statusKey as string)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[13px]">
                  <span className="text-[#4a4640]">
                    {t("about.dual.sync")}
                  </span>
                  <Link
                    href="/dashboard"
                    className="text-[#2A1D12] font-semibold flex items-center gap-1 hover:underline"
                  >
                    {t("about.dual.agenda")} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* FEATURES: CLIENT JOURNEY                                        */}
        {/* ============================================================ */}
        <section className="w-full max-w-7xl mx-auto px-5 md:px-8 lg:px-14 py-24 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Eyebrow>{t("about.journey.eyebrow")}</Eyebrow>
            <h2 className="font-[family-name:var(--font-playfair)] text-[28px] sm:text-[38px] text-[#2A1D12] font-semibold">
              {t("about.journey.title")}
            </h2>
            <p className="text-[16px] text-[#4a4640]">
              {t("about.journey.sub")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {journeySteps.map((s) => (
              <div
                key={s.n}
                className="p-6 rounded-xl bg-[#f7f3ed] space-y-2 hover:shadow-md transition-shadow"
              >
                <span className="text-[11px] text-[#795831] font-semibold">
                  {s.n} • {t(s.tagKey)}
                </span>
                <h4 className="text-[16px] text-[#2A1D12] font-semibold">
                  {t(s.titleKey)}
                </h4>
                <p className="text-[13px] text-[#4a4640]">{t(s.descKey)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* FEATURES: QR MIRROR CONCIERGE                                   */}
        {/* ============================================================ */}
        <section className="w-full bg-[#f7f3ed] py-24">
          <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white shadow-sm">
                  <QrCode className="h-4 w-4 text-[#795831]" />
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#795831]">
                    {t("about.qr.eyebrow")}
                  </span>
                </div>
                <h2 className="font-[family-name:var(--font-playfair)] text-[28px] sm:text-[38px] text-[#2A1D12] font-semibold leading-tight">
                  {t("about.qr.title")}
                </h2>
                <p className="text-[16px] text-[#4a4640] leading-relaxed">
                  {t("about.qr.desc")}
                </p>
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-3 text-[14px] text-[#1c1c18]">
                    <Sparkles className="h-5 w-5 text-[#795831] shrink-0" />
                    <span>
                      <strong className="font-semibold">
                        {t("about.qr.f1title")}
                      </strong>{" "}
                      {t("about.qr.f1desc")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[14px] text-[#1c1c18]">
                    <Wand2 className="h-5 w-5 text-[#795831] shrink-0" />
                    <span>
                      <strong className="font-semibold">
                        {t("about.qr.f2title")}
                      </strong>{" "}
                      {t("about.qr.f2desc")}
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#2A1D12] text-white text-[15px] font-semibold hover:bg-[#17100A] transition-all shadow-md"
                  >
                    <span>{t("about.qr.cta")}</span>
                    <ArrowRight className="h-[18px] w-[18px]" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6 relative flex justify-center">
                <div className="relative w-full max-w-[480px] rounded-2xl overflow-hidden shadow-[0_20px_48px_rgba(74,72,69,0.12)]">
                  <img
                    alt={t("about.qr.alt")}
                    className="w-full h-[380px] sm:h-[440px] object-cover object-center"
                    src={qrCardImg}
                  />
                  <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Nfc className="h-6 w-6 text-[#795831]" />
                      <div>
                        <div className="text-[15px] text-[#2A1D12] font-semibold">
                          {t("about.qr.cardTitle")}
                        </div>
                        <div className="text-[12px] text-[#4a4640]">
                          {t("about.qr.cardSub")}
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#ffddba] text-[#2b1700] text-[11px] font-bold">
                      {t("about.qr.badge")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* FEATURES: FEATURE GRID                                          */}
        {/* ============================================================ */}
        <section className="w-full max-w-7xl mx-auto px-5 md:px-8 lg:px-14 py-24 space-y-12 scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Eyebrow>{t("about.feat.eyebrow")}</Eyebrow>
            <h2 className="font-[family-name:var(--font-playfair)] text-[28px] sm:text-[38px] text-[#2A1D12] font-semibold">
              {t("about.feat.title")}
            </h2>
            <p className="text-[16px] text-[#4a4640]">
              {t("about.feat.sub")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.titleKey}
                className="p-8 rounded-2xl bg-[#f1ede7] space-y-4 hover:bg-[#ebe8e2] transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-[#2A1D12] shadow-sm">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-[17px] text-[#2A1D12] font-semibold">
                    {t(f.titleKey)}
                  </h3>
                  <p className="text-[13px] text-[#4a4640]">{t(f.descKey)}</p>
                </div>
                <div className="pt-1 text-[11px] uppercase tracking-wider text-[#2A1D12] font-bold">
                  {t(f.tagKey)}
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
            alt={t("about.cine.alt")}
            className="absolute inset-0 w-full h-full object-cover object-center"
            src={bannerImg}
          />
          <div className="absolute inset-0 bg-[#2A1D12]/70 backdrop-blur-[2px]" />
          <div className="relative z-10 max-w-4xl mx-auto px-5 md:px-8 lg:px-14 text-center space-y-4 text-white">
            <span className="text-[11px] uppercase tracking-widest text-[#ffddba] font-semibold">
              {t("about.cine.eyebrow")}
            </span>
            <h2 className="font-[family-name:var(--font-playfair)] text-[28px] sm:text-[42px] font-semibold leading-tight">
              {t("about.cine.title")}
            </h2>
            <p className="text-[16px] text-[#e6e2dc] max-w-2xl mx-auto">
              {t("about.cine.sub")}
            </p>
            <div className="pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center px-7 py-3.5 rounded-lg bg-white text-[#2A1D12] text-[15px] font-semibold hover:bg-[#f1ede7] transition-colors shadow-lg"
              >
                {t("about.cine.cta")}
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 9: ACTIVITY STREAM + FAQ                                */}
        {/* ============================================================ */}
        <section id="faq" className="w-full max-w-7xl mx-auto px-5 md:px-8 lg:px-14 py-24 scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-8 lg:col-start-3 space-y-4">
              <div className="space-y-1 text-center">
                <Eyebrow>{t("about.faq.eyebrow")}</Eyebrow>
                <h2 className="font-[family-name:var(--font-playfair)] text-[24px] text-[#2A1D12] font-semibold pt-1">
                  {t("about.faq.title")}
                </h2>
              </div>

              <div className="space-y-2">
                {faqs.map((f, i) => (
                  <div
                    key={f.qKey}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="rounded-xl bg-[#f1ede7] p-5 space-y-2 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-[15px] text-[#2A1D12] font-semibold">
                        {t(f.qKey)}
                      </h3>
                      <ChevronDown
                        className={`h-5 w-5 text-[#7b766f] shrink-0 transition-transform duration-300 ${
                          openFaq === i ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    {openFaq === i && (
                      <div className="text-[13.5px] text-[#4a4640] leading-relaxed pr-6">
                        {t(f.aKey)}
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
                {t("about.cta.eyebrow")}
              </span>
              <h2 className="font-[family-name:var(--font-playfair)] text-[28px] sm:text-[42px] text-[#2A1D12] font-semibold leading-tight">
                {t("about.cta.title")}
              </h2>
              <p className="text-[16px] text-[#4a4640]">
                {t("about.cta.sub")}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg bg-[#2A1D12] text-white text-[15px] font-semibold hover:bg-[#4a4640] transition-all shadow-[0_12px_28px_rgba(31,30,29,0.14)]"
              >
                {t("about.cta.start")}
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-white text-[#1c1c18] text-[15px] font-semibold hover:bg-[#f1ede7] transition-colors shadow-sm"
              >
                <span>{t("about.cta.demo")}</span>
                <Calendar className="h-[18px] w-[18px]" />
              </Link>
            </div>
            <p className="text-[11px] text-[#7b766f]">
              {t("about.cta.note")}
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

