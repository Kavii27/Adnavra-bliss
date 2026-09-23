import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowLeft, Megaphone } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NewAdvertisementForm } from "@/components/admin/new-advertisement-form";
import { AdvertisementCard } from "@/components/admin/advertisement-card";

/**
 * Admin → Advertisements (PDF sections 6-8): create banner ads with image
 * upload, manage placements, and see active/scheduled/expired campaigns
 * with impression/click stats — all wired to the routes built earlier
 * (/api/admin/advertisements, /api/admin/advertisement-placements).
 */
export default async function AdminAdvertisementsPage() {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    notFound();
  }

  let placements: Awaited<ReturnType<typeof db.advertisementPlacement.findMany>> = [];
  let ads: Awaited<ReturnType<typeof fetchAdsWithStats>> = [];
  let loadError = false;

  try {
    [placements, ads] = await Promise.all([
      db.advertisementPlacement.findMany({ where: { isActive: true }, orderBy: { key: "asc" } }),
      fetchAdsWithStats(),
    ]);
  } catch {
    loadError = true;
  }

  const now = new Date();
  const isLive = (ad: (typeof ads)[number]) => ad.isActive && ad.startAt <= now && ad.endAt > now;
  const isScheduled = (ad: (typeof ads)[number]) => ad.isActive && ad.startAt > now;
  const active = ads.filter(isLive);
  const scheduled = ads.filter(isScheduled);
  const expiredOrDisabled = ads.filter((a) => !isLive(a) && !isScheduled(a));

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
          <Megaphone className="h-5 w-5 text-[#f5ead9]" />
        </span>
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[#3a2f22]">Advertisements</h1>
          <p className="mt-0.5 text-sm text-[#a89880]">
            Create banner ads for any placement, schedule them, and track impressions/clicks.
          </p>
        </div>
      </div>

      {loadError ? (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-[#FDECEC] bg-[#FDECEC] p-4 text-sm font-medium text-[#B91C1C]">
          <AlertCircle className="h-4 w-4 shrink-0" /> Could not load advertisements. Please try again.
        </div>
      ) : (
        <>
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-[#3a2f22]">Create an advertisement</h2>
            <div className="mt-3 rounded-2xl border border-dashed border-[#c9a26d]/40 bg-[#faf6ef] p-6">
              {placements.length === 0 ? (
                <p className="text-xs text-[#a89880]">
                  No placements exist yet — create one via the API (POST /api/admin/advertisement-placements) first.
                </p>
              ) : (
                <NewAdvertisementForm placements={placements.map((p) => ({ key: p.key, name: p.name }))} />
              )}
            </div>
          </div>

          <Section title={`Active campaigns (${active.length})`} ads={active} placements={placements} empty="Nothing is live right now." />
          <Section title={`Scheduled (${scheduled.length})`} ads={scheduled} placements={placements} empty="Nothing scheduled." />
          <Section
            title={`Expired / disabled (${expiredOrDisabled.length})`}
            ads={expiredOrDisabled}
            placements={placements}
            empty="Nothing here."
          />
        </>
      )}
    </div>
  );
}

async function fetchAdsWithStats() {
  const [ads, eventCounts] = await Promise.all([
    db.advertisement.findMany({ include: { placement: true }, orderBy: { createdAt: "desc" } }),
    db.advertisementEvent.groupBy({ by: ["advertisementId", "type"], _count: { _all: true } }),
  ]);
  const statsByAd = new Map<string, { impressions: number; clicks: number }>();
  for (const row of eventCounts) {
    const entry = statsByAd.get(row.advertisementId) ?? { impressions: 0, clicks: 0 };
    if (row.type === "IMPRESSION") entry.impressions = row._count._all;
    else entry.clicks = row._count._all;
    statsByAd.set(row.advertisementId, entry);
  }
  return ads.map((ad) => ({ ...ad, stats: statsByAd.get(ad.id) ?? { impressions: 0, clicks: 0 } }));
}

type Ad = Awaited<ReturnType<typeof fetchAdsWithStats>>[number];
type Placement = Awaited<ReturnType<typeof db.advertisementPlacement.findMany>>[number];

function Section({ title, ads, placements, empty }: { title: string; ads: Ad[]; placements: Placement[]; empty: string }) {
  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold text-[#3a2f22]">{title}</h2>
      {ads.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-[#E3E8F0] bg-white p-6 text-center">
          <p className="text-sm text-[#a89880]">{empty}</p>
        </div>
      ) : (
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ads.map((ad) => (
            <AdvertisementCard key={ad.id} ad={ad} placements={placements.map((p) => ({ key: p.key, name: p.name }))} />
          ))}
        </div>
      )}
    </div>
  );
}
