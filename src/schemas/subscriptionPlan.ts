import { z } from "zod";

// key is the stable machine reference used by the ranking/boosting engines
// and the seed script — lowercase, hyphenated, immutable in spirit (editable,
// but changing it after businesses reference the plan is the admin's call).
const planKeySchema = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only");

export const createSubscriptionPlanSchema = z.object({
  key: planKeySchema,
  name: z.string().min(1).max(80),
  description: z.string().max(2000).optional(),
  rank: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  priceMonthly: z.number().int().min(0).optional(),
  boostsPerWeek: z.number().int().min(0).default(0),
  maxBoostHours: z.number().int().min(0).default(24),
  galleryLimit: z.number().int().min(0).optional(),
  serviceLimit: z.number().int().min(0).optional(),
  searchWeight: z.number().min(0).default(1),
  isFeaturedEligible: z.boolean().default(false),
  isPriorityEligible: z.boolean().default(false),
  features: z.record(z.string(), z.unknown()).optional(),
});

export const updateSubscriptionPlanSchema = createSubscriptionPlanSchema.partial();

export type CreateSubscriptionPlanInput = z.infer<typeof createSubscriptionPlanSchema>;
export type UpdateSubscriptionPlanInput = z.infer<typeof updateSubscriptionPlanSchema>;
