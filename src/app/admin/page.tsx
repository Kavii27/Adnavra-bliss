import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowRight, Crown, Store } from "lucide-react";
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

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-[#3a2f22]">Platform console</h1>
      <p className="mt-1 text-sm text-[#a89880]">
        Onboard salons on their behalf, manage their services and photos, and assign subscription plans.
      </p>

      {stats === null ? (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-[#FDECEC] bg-[#FDECEC] p-4 text-sm font-medium text-[#B91C1C]">
          <AlertCircle className="h-4 w-4 shrink-0" /> Could not load platform stats. Please try again.
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[#E3E8F0] bg-white p-5">
            <p className="text-2xl font-semibold text-[#3a2f22]">{stats.businesses}</p>
            <p className="mt-0.5 text-xs text-[#a89880]">Salons on the platform</p>
          </div>
          <div className="rounded-lg border border-[#E3E8F0] bg-white p-5">
            <p className="text-2xl font-semibold text-[#3a2f22]">{stats.services}</p>
            <p className="mt-0.5 text-xs text-[#a89880]">Services listed</p>
          </div>
          <div className="rounded-lg border border-[#E3E8F0] bg-white p-5">
            <p className="text-2xl font-semibold text-[#3a2f22]">{stats.owners}</p>
            <p className="mt-0.5 text-xs text-[#a89880]">Owner accounts</p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/businesses"
          className="group rounded-lg border border-[#E3E8F0] bg-white p-5 transition hover:border-[#8a6d4f]"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-[#3a2f22]">
            <Store className="h-4 w-4 text-[#8a6d4f]" /> Businesses
            <ArrowRight className="h-3.5 w-3.5 text-[#a89880] transition group-hover:translate-x-0.5 group-hover:text-[#8a6d4f]" />
          </p>
          <p className="mt-1 text-xs text-[#a89880]">
            Add a salon with its owner login, then finish its setup — profile, services, photos, salon-type tags.
          </p>
        </Link>
        <Link
          href="/admin/subscriptions"
          className="group rounded-lg border border-[#E3E8F0] bg-white p-5 transition hover:border-[#8a6d4f]"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-[#3a2f22]">
            <Crown className="h-4 w-4 text-[#8a6d4f]" /> Subscriptions
            <ArrowRight className="h-3.5 w-3.5 text-[#a89880] transition group-hover:translate-x-0.5 group-hover:text-[#8a6d4f]" />
          </p>
          <p className="mt-1 text-xs text-[#a89880]">
            Assign Starter, Professional, or Premium to each business. Premium unlocks the Featured badge.
          </p>
        </Link>
      </div>
    </div>
  );
}
