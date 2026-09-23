import { z } from "zod";

// Step 9 — admin plan assignment. Mirrors the SubscriptionPlan /
// SubscriptionStatus enums in prisma/schema.prisma.
export const subscriptionPlanSchema = z.enum(["STARTER", "PROFESSIONAL", "PREMIUM"]);

export const subscriptionStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "CANCELLED"]);

export const updateSubscriptionSchema = z.object({
  plan: subscriptionPlanSchema,
  status: subscriptionStatusSchema.optional(),
});

export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
