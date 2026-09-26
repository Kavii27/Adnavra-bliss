import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowLeft, Store } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveBoosts } from "@/lib/boosting-service";
import { SalonSubscriptionRow } from "@/components/admin/salon-subscription-row";

type SubscriptionWithPlan = Prisma.BusinessSubscriptionGetPayload<{ include: { plan: true } }>;

/**
 * Admin → Salon Subscription Assignment (PDF section 2).
 * View every salon, its current plan/status/dates in the NEW system, and
 * whether it's currently boosted — assign/change/enable-disable from here.
 * This replaces /admin/subscriptions (the old Starter/Professional/Premium
 * system) going forward.
 */
export default async function SalonSubscriptionsPage() {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    notFound();
  }

  let businesses: { id: string; name: string; slug: string; city: string | null }[] = [];
  let subscriptions: SubscriptionWithPlan[] = [];
  let plans: Awaited<ReturnType<typeof db.subscriptionPlan.findMany>> = [];
  let boostedIds = new Set<string>();
  let loadError = false;

  try {
    const [businessRows, subscriptionRows, planRows, activeBoosts] = await Promise.all([
      db.business.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, city: true } }),
      db.businessSubscription.findMany({ include: { plan: true } }),
      db.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { rank: "asc" } }),
      getActiveBoosts(),
    ]);
    businesses = businessRows;
    subscriptions = subscriptionRows;
    plans = planRows;
    boostedIds = new Set(activeBoosts.map((b) => b.businessId));
  } catch {
    loadError = true;
  }

  const subscriptionByBusiness = new Map(subscriptions.map((s) => [s.businessId, s]));

  return (
    <div>
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#a89880] hover:text-[#3a2f22]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to platform console
      </Link>

      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#3a2f22_0%,#8a6d4f_100%)] shadow-[0_4px_12px_rgba(58,47,34,0.18)]">
          <Store className="h-5 w-5 text-[#f5ead9]" />
        </span>
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[#3a2f22]">Marketplace Plans</h1>
          <p className="mt-0.5 text-sm text-[#a89880]">
            Silver, Gold, Platinum: controls a salon&apos;s search ranking, featured placement, and boost allowance on the
            public site. This is separate from the Feature Plans that control dashboard access. Boosted salons are
            flagged below.
          </p>
        </div>
      </div>

      {loadError ? (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-[#FDECEC] bg-[#FDECEC] p-4 text-sm font-medium text-[#B91C1C]">
          <AlertCircle className="h-4 w-4 shrink-0" /> Could not load salons. Please try again.
        </div>
      ) : businesses.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-[#E3E8F0] bg-white p-8 text-center">
          <p className="text-sm font-medium text-[#3a2f22]">No salons yet</p>
          <p className="mt-1 text-xs text-[#a89880]">Salons appear here once they complete onboarding.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-[#E3E8F0] bg-white shadow-[0_1px_2px_rgba(58,47,34,0.04)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#E3E8F0] bg-[#faf6ef] text-xs uppercase tracking-wide text-[#a89880]">
                <th scope="col" className="px-4 py-3 font-semibold">
                  Salon
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Current plan
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Assign / change
                </th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => {
                const sub = subscriptionByBusiness.get(b.id);
                return (
                  <tr key={b.id} className="border-b border-[#E3E8F0] last:border-0">
                    <td className="px-4 py-3 align-top">
                      <p className="font-semibold text-[#3a2f22]">{b.name}</p>
                      <p className="mt-0.5 text-xs text-[#a89880]">
                        /{b.slug}
                        {b.city ? ` • ${b.city}` : ""}
                      </p>
                      {boostedIds.has(b.id) && (
                        <span className="mt-1.5 inline-flex items-center rounded-full bg-[#c9a26d] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#3a2f22]">
                          Boosted now
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {sub ? (
                        (() => {
                          // The stored `status` is what the admin set, but a
                          // past endDate overrides it for display — matches
                          // what ranking/boosting actually enforce, so this
                          // screen never shows "Active" for a lapsed plan.
                          const isExpired = Boolean(sub.endDate && new Date(sub.endDate).getTime() <= Date.now());
                          const displayLabel = isExpired ? "Expired" : sub.status.charAt(0) + sub.status.slice(1).toLowerCase();
                          const badgeClass = isExpired
                            ? "bg-[#E7ECF2] text-[#4A4640]"
                            : sub.status === "ACTIVE"
                              ? "bg-[#DCF5E7] text-[#15803D]"
                              : sub.status === "SUSPENDED"
                                ? "bg-[#FDECD8] text-[#B45309]"
                                : "bg-[#FDECEC] text-[#B91C1C]";
                          return (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex w-fit items-center rounded-full bg-[#EAF3F2] px-2 py-0.5 text-[11px] font-semibold text-[#3a2f22]">
                                {sub.plan.name}
                              </span>
                              <span
                                className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass}`}
                              >
                                {displayLabel}
                              </span>
                              <span className="text-[11px] text-[#a89880]">
                                Started {new Date(sub.startDate).toLocaleDateString()}
                                {sub.endDate ? ` • Ends ${new Date(sub.endDate).toLocaleDateString()}` : ""}
                              </span>
                            </div>
                          );
                        })()
                      ) : (
                        <span className="text-xs text-[#a89880]">No plan assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <SalonSubscriptionRow
                        businessId={b.id}
                        plans={plans.map((p) => ({ key: p.key, name: p.name }))}
                        initialPlanKey={sub?.plan.key ?? plans[0]?.key ?? ""}
                        initialStatus={sub?.status ?? "ACTIVE"}
                        initialStartDate={sub?.startDate ? new Date(sub.startDate).toISOString().slice(0, 10) : ""}
                        initialEndDate={sub?.endDate ? new Date(sub.endDate).toISOString().slice(0, 10) : ""}
                        hasSubscription={Boolean(sub)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
