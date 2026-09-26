import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowLeft, Zap } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isBoostActive } from "@/lib/boosting-service";
import { ManualBoostForm } from "@/components/admin/manual-boost-form";
import { CancelBoostButton } from "@/components/admin/cancel-boost-button";

/**
 * Admin → Salon Boosting (PDF section 3 + section 8's "Boosting" dashboard
 * area): active boosts, boost history, manual boost, and cancel — all in
 * one screen. Boost frequency/duration limits are configured per-plan on
 * /admin/subscription-plans, not here.
 */
export default async function AdminBoostsPage() {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    notFound();
  }

  let boosts: Awaited<ReturnType<typeof fetchBoosts>> = [];
  let boostableBusinesses: { id: string; name: string; slug: string }[] = [];
  let loadError = false;

  try {
    [boosts, boostableBusinesses] = await Promise.all([fetchBoosts(), fetchBoostableBusinesses()]);
  } catch {
    loadError = true;
  }

  const now = new Date();
  const active = boosts.filter((b) => isBoostActive(b, now));
  const history = boosts.filter((b) => !isBoostActive(b, now));

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
          <Zap className="h-5 w-5 text-[#f5ead9]" />
        </span>
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[#3a2f22]">Salon Boosting</h1>
          <p className="mt-0.5 text-sm text-[#a89880]">
            Manually boost a salon, cancel an active boost, and review the full history log.
          </p>
        </div>
      </div>

      {loadError ? (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-[#FDECEC] bg-[#FDECEC] p-4 text-sm font-medium text-[#B91C1C]">
          <AlertCircle className="h-4 w-4 shrink-0" /> Could not load boosts. Please try again.
        </div>
      ) : (
        <>
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-[#3a2f22]">Manually boost a salon</h2>
            <div className="mt-3 rounded-2xl border border-dashed border-[#c9a26d]/40 bg-[#faf6ef] p-6">
              <ManualBoostForm businesses={boostableBusinesses} />
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold text-[#3a2f22]">Active boosts ({active.length})</h2>
            <BoostTable boosts={active} emptyText="No salon is currently boosted." showCancel />
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold text-[#3a2f22]">History ({history.length})</h2>
            <BoostTable boosts={history} emptyText="No past boosts yet." showCancel={false} />
          </div>
        </>
      )}
    </div>
  );
}

async function fetchBoosts() {
  return db.salonBoost.findMany({
    include: { business: { select: { name: true, slug: true } } },
    orderBy: { startAt: "desc" },
    take: 200,
  });
}

async function fetchBoostableBusinesses() {
  // Every salon on the platform can be manually boosted by an admin —
  // subscription status only matters for the AUTO rotation cron, not for
  // this manual override form. See lib/boosting-service.ts createBoost().
  return db.business.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

type BoostRow = Awaited<ReturnType<typeof fetchBoosts>>[number];

function BoostTable({ boosts, emptyText, showCancel }: { boosts: BoostRow[]; emptyText: string; showCancel: boolean }) {
  if (boosts.length === 0) {
    return (
      <div className="mt-3 rounded-2xl border border-[#E3E8F0] bg-white p-8 text-center">
        <p className="text-sm text-[#a89880]">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-2xl border border-[#E3E8F0] bg-white shadow-[0_1px_2px_rgba(58,47,34,0.04)]">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#E3E8F0] bg-[#faf6ef] text-xs uppercase tracking-wide text-[#a89880]">
            <th scope="col" className="px-4 py-3 font-semibold">
              Salon
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Source
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Started
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Ends
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Status
            </th>
            {showCancel && (
              <th scope="col" className="px-4 py-3 font-semibold">
                &nbsp;
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {boosts.map((b) => (
            <tr key={b.id} className="border-b border-[#E3E8F0] last:border-0">
              <td className="px-4 py-3">
                <p className="font-semibold text-[#3a2f22]">{b.business.name}</p>
                <p className="text-xs text-[#a89880]">/{b.business.slug}</p>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-[#EAF3F2] px-2 py-0.5 text-[11px] font-semibold text-[#3a2f22]">
                  {b.source === "MANUAL" ? "Manual" : "Auto"}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-[#a89880]">{new Date(b.startAt).toLocaleString()}</td>
              <td className="px-4 py-3 text-xs text-[#a89880]">{new Date(b.endAt).toLocaleString()}</td>
              <td className="px-4 py-3">
                {b.cancelledAt ? (
                  <span className="inline-flex items-center rounded-full bg-[#FDECEC] px-2 py-0.5 text-[11px] font-semibold text-[#B91C1C]">
                    Cancelled
                  </span>
                ) : isBoostActive(b, new Date()) ? (
                  <span className="inline-flex items-center rounded-full bg-[#DCF5E7] px-2 py-0.5 text-[11px] font-semibold text-[#15803D]">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-[#E7ECF2] px-2 py-0.5 text-[11px] font-semibold text-[#4A4640]">
                    Ended
                  </span>
                )}
              </td>
              {showCancel && (
                <td className="px-4 py-3">
                  <CancelBoostButton boostId={b.id} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
