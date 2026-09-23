// ADNAVRA — Subscription plan feature matrix (single source of truth).
// See ADNAVRA_AGENT_TASKS.md Priority 1 decision table. Individual pages must
// not invent their own rules — import FEATURE_MIN_PLAN / hasAccess instead.

export const PLAN_RANK = { STARTER: 0, PROFESSIONAL: 1, PREMIUM: 2 } as const;
export type Plan = keyof typeof PLAN_RANK;

export const FEATURE_MIN_PLAN = {
  staffManagement: "PROFESSIONAL",
  clientDatabase: "PROFESSIONAL",
  advancedScheduling: "PROFESSIONAL",
  basicAnalytics: "PROFESSIONAL",
  promotions: "PROFESSIONAL",
  dailySummary: "PROFESSIONAL",
  onlinePayments: "PROFESSIONAL",
  packagesSold: "PROFESSIONAL",
  retailProducts: "PROFESSIONAL",
  packageCatalog: "PROFESSIONAL",
  clientSettings: "PROFESSIONAL",
  paymentSettings: "PROFESSIONAL",
  salesSettings: "PROFESSIONAL",
  onlineReputation: "PROFESSIONAL",

  multiBranch: "PREMIUM",
  advancedAnalytics: "PREMIUM",
  clientSegments: "PREMIUM",
  loyaltyProgram: "PREMIUM",
  campaigns: "PREMIUM",
  membershipsSold: "PREMIUM",
  giftCardsSold: "PREMIUM",
  detailedSales: "PREMIUM",
  inventoryOps: "PREMIUM",
  staffScheduling: "PREMIUM",
  intakeForms: "PREMIUM",
  premiumQrMaterials: "PREMIUM",
} as const satisfies Record<string, Plan>;

export type Feature = keyof typeof FEATURE_MIN_PLAN;

export function hasAccess(currentPlan: Plan, feature: Feature): boolean {
  return PLAN_RANK[currentPlan] >= PLAN_RANK[FEATURE_MIN_PLAN[feature]];
}

export function normalizePlan(plan: string | null | undefined): Plan {
  if (plan === "PROFESSIONAL" || plan === "PREMIUM" || plan === "STARTER") return plan;
  return "STARTER";
}
