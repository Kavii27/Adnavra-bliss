/**
 * Advertisement rotation engine — pure functions, unit tested in isolation
 * (same pattern as lib/availability.ts, lib/boosting.ts, lib/ranking.ts).
 * No DB access here; see lib/ads-service.ts for the Prisma-backed wrapper.
 */

export type AdCandidate = {
  id: string;
  priority: number; // higher = more likely to be picked this rotation
  isActive: boolean;
  startAt: Date;
  endAt: Date;
};

export function isAdLive(ad: AdCandidate, now: Date): boolean {
  return ad.isActive && ad.startAt.getTime() <= now.getTime() && now.getTime() < ad.endAt.getTime();
}

/**
 * Weighted-random selection without replacement, so multiple ads in the
 * same placement rotate instead of one permanently winning — but a higher
 * `priority` still means a proportionally better chance of being shown.
 * `rng` is injectable so this is deterministically testable.
 */
export function selectAdsForPlacement(
  ads: AdCandidate[],
  now: Date,
  count: number,
  rng: () => number = Math.random
): string[] {
  if (count <= 0) return [];

  const pool = ads.filter((ad) => isAdLive(ad, now)).map((ad) => ({ id: ad.id, weight: Math.max(ad.priority, 0) + 1 }));
  const chosen: string[] = [];

  while (pool.length > 0 && chosen.length < count) {
    const totalWeight = pool.reduce((sum, a) => sum + a.weight, 0);
    let roll = rng() * totalWeight;
    let pickIndex = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      roll -= pool[i].weight;
      if (roll <= 0) {
        pickIndex = i;
        break;
      }
    }
    chosen.push(pool[pickIndex].id);
    pool.splice(pickIndex, 1);
  }

  return chosen;
}
