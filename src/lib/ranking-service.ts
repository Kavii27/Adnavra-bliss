/**
 * Ranking engine — DB orchestration layer. Loads admin-configurable
 * weights from PlatformSetting and assembles real subscription/boost data
 * before handing off to the pure functions in lib/ranking.ts.
 */
import { db } from "@/lib/db";
import { computeRankScore, rankBusinesses, DEFAULT_RANKING_WEIGHTS, type RankingWeights, type RankableBusiness } from "@/lib/ranking";
import { isBoostActive } from "@/lib/boosting";

const RANKING_WEIGHTS_KEY = "ranking_weights";

/** Reads admin-configured ranking weights, falling back to defaults for any missing field. */
export async function getRankingWeights(): Promise<RankingWeights> {
  const row = await db.platformSetting.findUnique({ where: { key: RANKING_WEIGHTS_KEY } });
  if (!row || typeof row.value !== "object" || row.value === null) return DEFAULT_RANKING_WEIGHTS;
  return { ...DEFAULT_RANKING_WEIGHTS, ...(row.value as Partial<RankingWeights>) };
}

/** Admin update — upserts the single ranking-weights row. */
export async function setRankingWeights(weights: Partial<RankingWeights>): Promise<RankingWeights> {
  const current = await getRankingWeights();
  const next = { ...current, ...weights };
  await db.platformSetting.upsert({
    where: { key: RANKING_WEIGHTS_KEY },
    update: { value: next },
    create: { key: RANKING_WEIGHTS_KEY, value: next },
  });
  return next;
}

/**
 * Given a list of business IDs (already filtered by whatever the caller
 * cares about — radius, category, city, ...), returns them re-ordered by
 * rank score, with per-business ranking metadata attached. Never drops a
 * business: one with no subscription just scores planRank 0.
 */
export async function rankBusinessIds(
  businessIds: string[],
  distanceById: Map<string, number | null>,
  now: Date = new Date()
): Promise<Map<string, { score: number; isBoosted: boolean; planKey: string | null }>> {
  if (businessIds.length === 0) return new Map();

  const [subscriptions, activeBoosts, weights] = await Promise.all([
    db.businessSubscription.findMany({
      where: { businessId: { in: businessIds }, status: "ACTIVE" },
      include: { plan: true },
    }),
    db.salonBoost.findMany({
      where: { businessId: { in: businessIds }, cancelledAt: null, startAt: { lte: now }, endAt: { gt: now } },
    }),
    getRankingWeights(),
  ]);

  const subByBusiness = new Map(subscriptions.map((s) => [s.businessId, s]));
  const boostedBusinessIds = new Set(activeBoosts.filter((b) => isBoostActive(b, now)).map((b) => b.businessId));

  const rankable: RankableBusiness[] = businessIds.map((businessId) => {
    const sub = subByBusiness.get(businessId);
    return {
      businessId,
      planRank: sub?.plan.rank ?? 0,
      isFeaturedEligible: sub?.plan.isFeaturedEligible ?? false,
      isPriorityEligible: sub?.plan.isPriorityEligible ?? false,
      isBoosted: boostedBusinessIds.has(businessId),
      distanceKm: distanceById.get(businessId) ?? null,
    };
  });

  const ranked = rankBusinesses(rankable, weights);

  return new Map(
    ranked.map((b) => [
      b.businessId,
      { score: b.score, isBoosted: b.isBoosted, planKey: subByBusiness.get(b.businessId)?.plan.key ?? null },
    ])
  );
}

export { computeRankScore };
