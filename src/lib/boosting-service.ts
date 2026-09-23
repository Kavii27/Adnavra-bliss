/**
 * Boosting engine — DB orchestration layer. Wraps the pure functions in
 * lib/boosting.ts with the actual Prisma reads/writes: creating boosts,
 * cancelling them, and running the fair auto-distribution cycle.
 *
 * "Active" is never stored as a status column — it's derived from
 * (startAt, endAt, cancelledAt) at read time via isBoostActive(). This
 * avoids a stale/duplicated source of truth.
 */
import { db } from "@/lib/db";
import {
  canBoost,
  computeBoostWindow,
  isBoostActive,
  selectNextBoostCandidates,
  type BoostCandidate,
  type BoostRecord,
} from "@/lib/boosting";

function toBoostRecord(row: { businessId: string; startAt: Date; endAt: Date; cancelledAt: Date | null }): BoostRecord {
  return { businessId: row.businessId, startAt: row.startAt, endAt: row.endAt, cancelledAt: row.cancelledAt };
}

/** All boosts for a business from the trailing 7 days (for limit checks + rotation fairness). */
async function getRecentBoosts(businessId: string, now: Date) {
  const windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return db.salonBoost.findMany({
    where: { businessId, startAt: { gte: windowStart } },
    orderBy: { startAt: "desc" },
  });
}

/** Currently active boosts, optionally scoped to one business. */
export async function getActiveBoosts(businessId?: string, now: Date = new Date()) {
  const rows = await db.salonBoost.findMany({
    where: {
      ...(businessId ? { businessId } : {}),
      cancelledAt: null,
      startAt: { lte: now },
      endAt: { gt: now },
    },
    orderBy: { startAt: "desc" },
  });
  return rows;
}

export async function isSalonCurrentlyBoosted(businessId: string, now: Date = new Date()): Promise<boolean> {
  const active = await getActiveBoosts(businessId, now);
  return active.length > 0;
}

/**
 * Admin (or the system) creates a boost for a business right now.
 * Enforces the plan's weekly limit — throws if the limit is already hit.
 */
export async function createBoost(params: {
  businessId: string;
  source: "AUTO" | "MANUAL";
  createdByUserId?: string | null;
  now?: Date;
}) {
  const now = params.now ?? new Date();

  const subscription = await db.businessSubscription.findUnique({
    where: { businessId: params.businessId },
    include: { plan: true },
  });
  const expired = subscription?.endDate ? subscription.endDate.getTime() <= now.getTime() : false;
  if (!subscription || subscription.status !== "ACTIVE" || expired) {
    throw new Error("Business has no active subscription");
  }

  const recentBoosts = (await getRecentBoosts(params.businessId, now)).map(toBoostRecord);

  // Manual admin boosts bypass the weekly-limit check (admins can always
  // override), but automatic boosts must respect the plan's configured cap.
  if (params.source === "AUTO" && !canBoost(subscription.plan, recentBoosts, now)) {
    throw new Error("Business has reached its plan's weekly boost limit");
  }

  const { startAt, endAt } = computeBoostWindow(subscription.plan, now);

  return db.salonBoost.create({
    data: {
      businessId: params.businessId,
      source: params.source,
      startAt,
      endAt,
      createdByUserId: params.createdByUserId ?? null,
    },
  });
}

/** Admin cancels/removes an active (or scheduled) boost. */
export async function cancelBoost(boostId: string, now: Date = new Date()) {
  return db.salonBoost.update({
    where: { id: boostId },
    data: { cancelledAt: now },
  });
}

/**
 * Runs one auto-distribution cycle: looks at every business with an active,
 * boost-eligible plan, fairly rotates who gets boosted next, and creates up
 * to `maxNewBoosts` new boost rows. Intended to be invoked periodically
 * (e.g. a scheduled script/cron), not on every request.
 */
export async function runAutoBoostCycle(maxNewBoosts: number, now: Date = new Date()) {
  const subscriptions = await db.businessSubscription.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ endDate: null }, { endDate: { gt: now } }],
      plan: { boostsPerWeek: { gt: 0 } },
    },
    include: { plan: true },
  });

  const candidates: BoostCandidate[] = [];
  for (const sub of subscriptions) {
    const recentBoosts = (await getRecentBoosts(sub.businessId, now)).map(toBoostRecord);
    candidates.push({
      businessId: sub.businessId,
      plan: { boostsPerWeek: sub.plan.boostsPerWeek, maxBoostHours: sub.plan.maxBoostHours },
      recentBoosts,
    });
  }

  const chosen = selectNextBoostCandidates(candidates, now, maxNewBoosts);

  const created = [];
  for (const businessId of chosen) {
    created.push(await createBoost({ businessId, source: "AUTO", now }));
  }
  return created;
}

export { isBoostActive };
