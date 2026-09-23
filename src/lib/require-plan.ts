import { db } from "@/lib/db";
import { hasAccess, normalizePlan, type Feature, type Plan } from "@/lib/plan-features";

/** Resolve the effective plan for a business. Non-ACTIVE subscriptions fall back to STARTER. */
export async function getCurrentPlan(businessId: string): Promise<Plan> {
  const sub = await db.subscription.findUnique({ where: { businessId } });
  if (!sub || sub.status !== "ACTIVE") return "STARTER";
  return normalizePlan(sub.plan);
}

export class FeatureLockedError extends Error {
  constructor(public feature: Feature) {
    super(`Feature locked: ${feature}`);
    this.name = "FeatureLockedError";
  }
}

/** Throw FeatureLockedError when the business plan doesn't include the feature. */
export async function requirePlanFeature(businessId: string, feature: Feature): Promise<Plan> {
  const plan = await getCurrentPlan(businessId);
  if (!hasAccess(plan, feature)) throw new FeatureLockedError(feature);
  return plan;
}
