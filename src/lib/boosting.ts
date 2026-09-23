/**
 * Salon boosting engine — pure functions, unit tested in isolation (same
 * pattern as lib/availability.ts). No DB access here; see
 * lib/boosting-service.ts for the Prisma-backed orchestration that calls
 * into these functions.
 */

export type PlanBoostConfig = {
  boostsPerWeek: number;
  maxBoostHours: number;
};

export type BoostRecord = {
  businessId: string;
  startAt: Date;
  endAt: Date;
  cancelledAt: Date | null;
};

export type BoostCandidate = {
  businessId: string;
  plan: PlanBoostConfig;
  recentBoosts: BoostRecord[]; // this business's boosts from the trailing 7 days
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_BOOST_HOURS = 24;

/** True if a boost is currently in effect (not cancelled, now within its window). */
export function isBoostActive(boost: BoostRecord, now: Date): boolean {
  if (boost.cancelledAt) return false;
  return boost.startAt.getTime() <= now.getTime() && now.getTime() < boost.endAt.getTime();
}

/** Non-cancelled boosts whose startAt falls within the trailing 7 days of `now`. */
export function countBoostsInTrailingWeek(boosts: BoostRecord[], now: Date): number {
  const windowStart = now.getTime() - WEEK_MS;
  return boosts.filter((b) => !b.cancelledAt && b.startAt.getTime() >= windowStart && b.startAt.getTime() <= now.getTime())
    .length;
}

/**
 * Can this plan receive another boost right now, given its boosts from the
 * trailing 7 days? Silver (boostsPerWeek = 0) never qualifies.
 */
export function canBoost(plan: PlanBoostConfig, recentBoosts: BoostRecord[], now: Date): boolean {
  if (!plan.boostsPerWeek || plan.boostsPerWeek <= 0) return false;
  return countBoostsInTrailingWeek(recentBoosts, now) < plan.boostsPerWeek;
}

/** The [startAt, endAt) window a new boost should use, from the plan's configured duration. */
export function computeBoostWindow(plan: PlanBoostConfig, now: Date): { startAt: Date; endAt: Date } {
  const hours = plan.maxBoostHours > 0 ? plan.maxBoostHours : DEFAULT_BOOST_HOURS;
  return { startAt: now, endAt: new Date(now.getTime() + hours * 60 * 60 * 1000) };
}

/**
 * Fair rotation: pick up to `count` businesses to boost next.
 * - Skips any candidate already carrying an active boost (no stacking).
 * - Skips any candidate at/over its plan's weekly limit.
 * - Among the rest, prioritizes whoever was boosted longest ago (or never),
 *   so exposure spreads out instead of favoring the same salon repeatedly.
 */
export function selectNextBoostCandidates(candidates: BoostCandidate[], now: Date, count: number): string[] {
  if (count <= 0) return [];

  const eligible = candidates.filter((c) => {
    const alreadyActive = c.recentBoosts.some((b) => isBoostActive(b, now));
    if (alreadyActive) return false;
    return canBoost(c.plan, c.recentBoosts, now);
  });

  const lastBoostedAt = (c: BoostCandidate): number => {
    const starts = c.recentBoosts.filter((b) => !b.cancelledAt).map((b) => b.startAt.getTime());
    return starts.length > 0 ? Math.max(...starts) : -Infinity; // never boosted -> highest priority
  };

  eligible.sort((a, b) => lastBoostedAt(a) - lastBoostedAt(b));

  return eligible.slice(0, count).map((c) => c.businessId);
}
