/**
 * Advertisement engine — DB orchestration layer. Loads a placement's live
 * ads, rotates via lib/ads.ts, and records impression/click events.
 */
import { db } from "@/lib/db";
import { selectAdsForPlacement, isAdLive } from "@/lib/ads";

export type SelectedAd = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  destinationUrl: string;
};

/**
 * Picks the ad(s) to show right now for a placement (by its stable key,
 * e.g. "homepage_top"), respecting the placement's maxActiveAds and each
 * ad's schedule/priority, and records one impression per shown ad.
 * Returns [] if the placement doesn't exist, is disabled, or has no live ads.
 */
export async function getAdsForPlacement(placementKey: string, now: Date = new Date()): Promise<SelectedAd[]> {
  const placement = await db.advertisementPlacement.findUnique({
    where: { key: placementKey },
    include: { advertisements: true },
  });
  if (!placement || !placement.isActive) return [];

  const candidates = placement.advertisements.map((ad) => ({
    id: ad.id,
    priority: ad.priority,
    isActive: ad.isActive,
    startAt: ad.startAt,
    endAt: ad.endAt,
  }));

  const chosenIds = selectAdsForPlacement(candidates, now, placement.maxActiveAds);
  if (chosenIds.length === 0) return [];

  await db.advertisementEvent.createMany({
    data: chosenIds.map((advertisementId) => ({ advertisementId, type: "IMPRESSION" as const })),
  });

  const byId = new Map(placement.advertisements.map((ad) => [ad.id, ad]));
  return chosenIds
    .map((id) => byId.get(id))
    .filter((ad): ad is NonNullable<typeof ad> => Boolean(ad))
    .map((ad) => ({
      id: ad.id,
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl,
      destinationUrl: ad.destinationUrl,
    }));
}

/** Records a click. Validates the ad exists and is currently live so stale/expired links can't be farmed for clicks. */
export async function recordAdClick(advertisementId: string, now: Date = new Date()): Promise<boolean> {
  const ad = await db.advertisement.findUnique({ where: { id: advertisementId } });
  if (!ad || !isAdLive(ad, now)) return false;
  await db.advertisementEvent.create({ data: { advertisementId, type: "CLICK" } });
  return true;
}

/** Impression/click totals for one ad — feeds the admin dashboard's "impressions/clicks" view. */
export async function getAdStats(advertisementId: string) {
  const [impressions, clicks] = await Promise.all([
    db.advertisementEvent.count({ where: { advertisementId, type: "IMPRESSION" } }),
    db.advertisementEvent.count({ where: { advertisementId, type: "CLICK" } }),
  ]);
  return { impressions, clicks };
}
