import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowLeft, Crown } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubscriptionRow } from "@/components/admin/subscription-row";

type Plan = "STARTER" | "PROFESSIONAL" | "PREMIUM";
type Status = "ACTIVE" | "SUSPENDED" | "CANCELLED";

function planBadge(plan: Plan): string {
  if (plan === "PREMIUM") return "bg-[#3a2f22] text-white";
  if (plan === "PROFESSIONAL") return "bg-[#E2E8F9] text-[#3a2f22]";
  return "bg-[#E7ECF2] text-[#3a2f22]";
}

function statusBadge(status: Status): string {
  if (status === "ACTIVE") return "bg-[#DCF5E7] text-[#15803D]";
  if (status === "SUSPENDED") return "bg-[#FDECD8] text-[#B45309]";
  return "bg-[#FDECEC] text-[#B91C1C]";
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  // Second check inside the page (AGENTS.md): layout already gates ADMIN,
  // but this page must not depend on middleware/layout alone.
  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    notFound();
  }

  const { error: errorParam } = await searchParams;

  let businesses: Array<{
    id: string;
    name: string;
    slug: string;
    city: string | null;
    marketplacePriority: boolean;
    subscription: { plan: Plan; status: Status } | null;
  }>;
  try {
    businesses = await db.business.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        marketplacePriority: true,
        subscription: { select: { plan: true, status: true } },
      },
    });
  } catch {
    return (
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[#3a2f22]">Subscriptions</h1>
        <p className="mt-1 text-sm text-[#a89880]">
          Controls which dashboard features each salon can use (staff limits, gift cards, memberships, products).
          This is separate from Marketplace Plans, which control search ranking and featured placement on the public
          site.
        </p>
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-[#FDECEC] bg-[#FDECEC] p-4 text-sm font-medium text-[#B91C1C]">
          <AlertCircle className="h-4 w-4 shrink-0" /> Could not load businesses. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/businesses"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#a89880] hover:text-[#3a2f22]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to businesses
      </Link>
      <h1 className="text-xl font-semibold tracking-tight text-[#3a2f22]">Subscriptions</h1>
      <p className="mt-1 text-sm text-[#a89880]">
        Controls which dashboard features each salon can use (staff limits, gift cards, memberships, products).
        This is separate from Marketplace Plans, which control search ranking and featured placement on the public
        site.
      </p>

      {errorParam && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#FDECEC] bg-[#FDECEC] p-3 text-sm font-medium text-[#B91C1C]">
          <AlertCircle className="h-4 w-4 shrink-0" /> {errorParam}
        </div>
      )}

      {businesses.length === 0 ? (
        <div className="mt-6 rounded-lg border border-[#E3E8F0] bg-white p-8 text-center">
          <p className="text-sm font-medium text-[#3a2f22]">No businesses yet</p>
          <p className="mt-1 text-xs text-[#a89880]">Businesses appear here once a salon completes onboarding.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-[#E3E8F0] bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E3E8F0] bg-[#faf6ef] text-xs uppercase tracking-wide text-[#a89880]">
                <th scope="col" className="px-4 py-3 font-semibold">
                  Business
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Current
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Change plan
                </th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => {
                const plan: Plan = b.subscription?.plan ?? "STARTER";
                const status: Status = b.subscription?.status ?? "ACTIVE";
                return (
                  <tr key={b.id} className="border-b border-[#E3E8F0] last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#3a2f22]">{b.name}</p>
                      <p className="mt-0.5 text-xs text-[#a89880]">
                        /{b.slug}
                        {b.city ? ` • ${b.city}` : ""}
                      </p>
                      {b.marketplacePriority && (
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#795831] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          <Crown className="h-3 w-3" /> Featured
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${planBadge(plan)}`}
                        >
                          {plan.charAt(0) + plan.slice(1).toLowerCase()}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge(status)}`}
                        >
                          {status.charAt(0) + status.slice(1).toLowerCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <SubscriptionRow
                        businessId={b.id}
                        initialPlan={plan}
                        initialStatus={status}
                        hasSubscriptionRow={b.subscription !== null}
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
