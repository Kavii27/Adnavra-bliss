/**
 * Search & ranking engine — pure functions, unit tested in isolation (same
 * pattern as lib/availability.ts and lib/boosting.ts). No DB access here;
 * see lib/ranking-service.ts for the Prisma-backed wrapper.
 *
 * Design: a continuous score, not hard tiers — a boost is a temporary
 * bonus, not a permanent top slot, and every business is scored (Silver
 * included) so paid plans never fully hide unpaid ones from search.
 */

export type RankingWeights = {
  planWeight: number; // multiplier applied to the plan's rank (Silver=1, Gold=2, Platinum=3, ...)
  boostBonus: number; // flat bonus while an active boost is running
  featuredBonus: number; // flat bonus for plans marked isFeaturedEligible
  priorityBonus: number; // flat bonus for plans marked isPriorityEligible (e.g. homepage exposure)
  distanceWeight: number; // score penalty per km of distance (0 disables distance sorting)
};

// Used only when no admin-configured PlatformSetting row exists yet.
export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  planWeight: 10,
  boostBonus: 50,
  featuredBonus: 20,
  priorityBonus: 40,
  distanceWeight: 1,
};

export type RankableBusiness = {
  businessId: string;
  planRank: number; // 0 for a business with no active subscription — still ranked, never dropped
  isFeaturedEligible: boolean;
  isPriorityEligible: boolean;
  isBoosted: boolean;
  distanceKm: number | null;
};

export function computeRankScore(business: RankableBusiness, weights: RankingWeights): number {
  let score = business.planRank * weights.planWeight;
  if (business.isBoosted) score += weights.boostBonus;
  if (business.isFeaturedEligible) score += weights.featuredBonus;
  if (business.isPriorityEligible) score += weights.priorityBonus;
  if (business.distanceKm != null) score -= business.distanceKm * weights.distanceWeight;
  return score;
}

/** Stable sort, highest score first. Ties keep their original relative order. */
export function rankBusinesses<T extends RankableBusiness>(businesses: T[], weights: RankingWeights): (T & { score: number })[] {
  return businesses
    .map((b) => ({ ...b, score: computeRankScore(b, weights) }))
    .sort((a, b) => b.score - a.score);
}
