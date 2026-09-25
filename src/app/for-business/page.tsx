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
import { getServerT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getServerT();
  return {
    title: t("biz.metaTitle"),
    description: t("biz.metaDesc"),
  };
}

const FEATURES = [
  {
    icon: Smartphone,
    titleKey: "biz.f1.title",
    descKey: "biz.f1.desc",
  },
  {
    icon: Clock,
    titleKey: "biz.f2.title",
    descKey: "biz.f2.desc",
  },
  {
    icon: LayoutDashboard,
    titleKey: "biz.f3.title",
    descKey: "biz.f3.desc",
  },
  {
    icon: Users,
    titleKey: "biz.f4.title",
    descKey: "biz.f4.desc",
  },
  {
    icon: Users,
    titleKey: "biz.f5.title",
    descKey: "biz.f5.desc",
  },
  {
    icon: QrCode,
    titleKey: "biz.f6.title",
    descKey: "biz.f6.desc",
  },
  {
    icon: BarChart3,
    titleKey: "biz.f7.title",
    descKey: "biz.f7.desc",
  },
  {
    icon: Store,
    titleKey: "biz.f8.title",
    descKey: "biz.f8.desc",
  },
];

export default async function ForBusinessPage() {
  const t = await getServerT();
  const BENEFITS = [
    {
      icon: MessageCircle,
      titleKey: "biz.b1.title",
      descKey: "biz.b1.desc",
    },
    {
      icon: Calendar,
      titleKey: "biz.b2.title",
      descKey: "biz.b2.desc",
    },
    {
      icon: LayoutDashboard,
      titleKey: "biz.b3.title",
      descKey: "biz.b3.desc",
    },
    {
      icon: MapPin,
      titleKey: "biz.b4.title",
      descKey: "biz.b4.desc",
    },
  ];
  const WHY_POINTS = [
    "biz.why.p1",
    "biz.why.p2",
    "biz.why.p3",
    "biz.why.p4",
  ];
  const QR_POINTS = [
    "biz.qr.p1",
    "biz.qr.p2",
    "biz.qr.p3",
    "biz.qr.p4",
  ];
  return (
    <main className="min-h-screen bg-[#fdf9f3]">
      <HomeHeader />

      {/* Hero - angled toward salon owners */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 brand-gradient-bg opacity-[0.06]" />
        <div className="relative px-6 lg:px-12 py-20 max-w-[1200px] mx-auto">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-[#fdcf9e]/60 px-3 py-1 text-xs font-medium text-[#2A1D12]">
              {t("biz.badge")}
            </p>
            <h1 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-[-1.5px] text-[#2A1D12]">
              {t("biz.title")}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[#4a4640] max-w-prose">
              {t("biz.sub")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup">
                <Button className="bg-[#2A1D12] hover:bg-[#4a4640] text-white shadow-sm">
                  {t("biz.getStarted")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="mt-3 text-sm text-[#4a4640]">
              {t("biz.loginPrompt")}{" "}
                <Link href="/login" className="font-medium text-[#2A1D12] hover:underline">
                {t("biz.login")}
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* What you get - reuses FEATURES from home */}
      <section className="px-6 lg:px-12 py-16 max-w-[1200px] mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight text-[#2A1D12] text-center">
          {t("biz.featuresTitle")}
        </h2>
        <p className="mt-2 text-center text-[#4a4640] max-w-2xl mx-auto">
          {t("biz.featuresSub")}
        </p>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.titleKey} className="rounded-lg bg-white border border-[#ccc6bd]/40 p-8">
              <f.icon className="h-5 w-5 text-[#2A1D12]" />
              <h3 className="mt-3 text-lg font-semibold text-[#2A1D12]">{t(f.titleKey)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#4a4640]">{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why it matters for owners */}
      <section className="px-6 lg:px-12 py-16 max-w-[1200px] mx-auto">
        <div className="rounded-2xl bg-[#2A1D12] text-[#fdf9f3] p-10 lg:p-14 grid lg:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-semibold">{t("biz.whyTitle")}</h2>
            <p className="mt-3 text-sm text-[#ccc6bd] leading-relaxed">
              {t("biz.whyDesc")}
            </p>
            <Link href="/signup" className="inline-flex mt-6">
              <Button className="bg-white text-[#2A1D12] hover:bg-[#fdf9f3] shadow-sm">{t("biz.createPage")}</Button>
            </Link>
            <p className="mt-4 text-sm text-[#ccc6bd]">
              {t("biz.loginPrompt")}{" "}
              <Link href="/login" className="font-medium text-white hover:underline">
                {t("biz.login")}
              </Link>
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {WHY_POINTS.map((k) => (
              <li key={k} className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#2A1D12] shrink-0 mt-0.5" />
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* QR + benefits */}
      <section className="px-6 lg:px-12 py-16 max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-[#2A1D12]">
            {t("biz.qrTitle")}
          </h2>
          <p className="mt-3 text-[#4a4640] leading-relaxed">
            {t("biz.qrDesc")}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[#4a4640]">
            {QR_POINTS.map((k) => (
              <li key={k} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#2A1D12]" /> {t(k)}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-[#ccc6bd]/40 bg-white p-8 flex flex-col items-center text-center">
          <QrCode className="h-32 w-32 text-[#2A1D12]" />
          <p className="mt-4 text-sm font-medium text-[#2A1D12]">{t("biz.qrScan")}</p>
          <p className="text-xs text-[#7b766f] mt-1">{t("biz.qrNote")}</p>
        </div>
      </section>

      {/* Business benefits */}
      <section className="px-6 lg:px-12 py-16 max-w-[1200px] mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight text-[#2A1D12] text-center">
          {t("biz.benefitsTitle")}
        </h2>
        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {BENEFITS.map((b) => (
            <div key={b.titleKey} className="rounded-lg bg-white border border-[#ccc6bd]/40 p-6">
              <b.icon className="h-5 w-5 text-[#2A1D12]" />
              <h3 className="mt-3 text-sm font-semibold text-[#2A1D12]">{t(b.titleKey)}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#4a4640]">{t(b.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 lg:px-12 py-16">
        <div className="max-w-[1000px] mx-auto rounded-2xl bg-[#2A1D12] text-white p-12 text-center">
          <h2 className="text-3xl font-semibold">{t("biz.ctaTitle")}</h2>
          <p className="mt-3 text-white/85 max-w-xl mx-auto text-sm">
            {t("biz.ctaSub")}
          </p>
          <Link href="/signup" className="inline-flex mt-6">
            <Button variant="secondary">{t("biz.ctaBtn")}</Button>
          </Link>
          <p className="mt-4 text-sm text-white/70">
            {t("biz.loginPrompt")}{" "}
            <Link href="/login" className="font-medium text-white hover:underline">
              {t("biz.login")}
            </Link>
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

