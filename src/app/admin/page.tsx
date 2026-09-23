import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowRight, Crown, Layers, Sparkles, Store } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Admin home (platform console landing).
 * Previously this route 404'd — /admin/businesses and /admin/subscriptions
 * existed but /admin itself had no page, so logging in as ADMIN landed on
 * "Page not found". Second ADMIN check inside the page per AGENTS.md.
 */
export default async function AdminHomePage() {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    notFound();
  }

  let stats: { businesses: number; services: number; owners: number } | null = null;
  try {
    const [businesses, services, owners] = await Promise.all([
      db.business.count(),
      db.service.count(),
      db.user.count({ where: { role: "OWNER" } }),
    ]);
    stats = { businesses, services, owners };
  } catch {
    stats = null;
  }

  const navCards = [
    {
      href: "/admin/subscription-plans",
      icon: Layers,
      title: "Subscription Plans",
      description: "Create and edit Silver/Gold/Platinum — boost frequency, search weight, gallery limits — no code changes.",
    },
    {
      href: "/admin/businesses",
      icon: Store,
      title: "Businesses",
      description: "Add a salon with its owner login, then finish its setup — profile, services, photos, salon-type tags.",
    },
    {
      href: "/admin/subscriptions",
      icon: Crown,
      title: "Subscriptions",
      description: "Assign Starter, Professional, or Premium to each business. Premium unlocks the Featured badge.",
    },
  ];

  const adminName = session.user.name ?? session.user.email?.split("@")[0] ?? "there";

  return (
    <div>
      <div className="relative h-56 overflow-hidden rounded-2xl shadow-[0_1px_2px_rgba(58,47,34,0.10),0_16px_40px_rgba(58,47,34,0.20)] sm:h-64">
        <Image
          src="/atmospheric-banner.png"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1600px"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(58,47,34,0.94)_0%,rgba(58,47,34,0.72)_38%,rgba(58,47,34,0.18)_75%,rgba(58,47,34,0.05)_100%)]" />
        <div className="relative flex h-full max-w-xl flex-col justify-center px-6 sm:px-10">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#c9a26d]">
            <Sparkles className="h-3.5 w-3.5" /> Platform Console
          </span>
          <h1 className="mt-3 text-[28px] font-semibold leading-tight tracking-tight text-[#faf6ef] sm:text-[36px]">
            Welcome back, {adminName}
          </h1>
          <p className="mt-2 max-w-md text-sm text-[#f0e6d6]/90">
            Onboard salons on their behalf, manage their services and photos, and assign subscription plans.
          </p>
          <Link
            href="/admin/subscription-plans"
            className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#c9a26d] px-4 py-2 text-sm font-semibold text-[#3a2f22] transition hover:bg-[#d9b483]"
          >
            Manage subscription plans <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {stats === null ? (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-[#FDECEC] bg-[#FDECEC] p-4 text-sm font-medium text-[#B91C1C]">
          <AlertCircle className="h-4 w-4 shrink-0" /> Could not load platform stats. Please try again.
        </div>
      ) : (
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {[
            { value: stats.businesses, label: "Salons on the platform" },
            { value: stats.services, label: "Services listed" },
            { value: stats.owners, label: "Owner accounts" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-[#E3E8F0] bg-white p-6 shadow-[0_1px_2px_rgba(58,47,34,0.04),0_8px_20px_rgba(58,47,34,0.06)] transition hover:shadow-[0_1px_2px_rgba(58,47,34,0.06),0_12px_28px_rgba(58,47,34,0.10)]"
            >
              <p className="text-[32px] font-semibold leading-none tracking-tight text-[#3a2f22]">{s.value}</p>
              <p className="mt-2 text-xs font-medium text-[#a89880]">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {navCards.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group relative overflow-hidden rounded-2xl border border-[#E3E8F0] bg-white p-6 shadow-[0_1px_2px_rgba(58,47,34,0.04)] transition hover:-translate-y-0.5 hover:border-[#c9a26d] hover:shadow-[0_1px_2px_rgba(58,47,34,0.06),0_16px_32px_rgba(58,47,34,0.12)]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3F2] transition group-hover:bg-[linear-gradient(135deg,#3a2f22_0%,#8a6d4f_100%)]">
              <Icon className="h-5 w-5 text-[#8a6d4f] transition group-hover:text-[#f5ead9]" />
            </span>
            <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-[#3a2f22]">
              {title}
              <ArrowRight className="h-3.5 w-3.5 text-[#a89880] transition group-hover:translate-x-1 group-hover:text-[#8a6d4f]" />
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#a89880]">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
