import { z } from "zod";

export const enrollLoyaltySchema = z.object({
  businessId: z.string().cuid(),
  customerId: z.string().cuid(),
});

export const adjustLoyaltySchema = z.object({
  pointsDelta: z.number().int().min(-10000).max(10000).optional().default(0),
  visitsDelta: z.number().int().min(-1000).max(1000).optional().default(0),
  rewardsRedeemedDelta: z.number().int().min(-1000).max(1000).optional().default(0),
});

export type EnrollLoyaltyInput = z.infer<typeof enrollLoyaltySchema>;
export type AdjustLoyaltyInput = z.infer<typeof adjustLoyaltySchema>;
