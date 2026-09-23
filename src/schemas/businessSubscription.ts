import { z } from "zod";

// Reuses the existing SubscriptionStatus enum values (subscriptions table) —
// same lifecycle (ACTIVE/SUSPENDED/CANCELLED) applies to the new table.
export const businessSubscriptionStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "CANCELLED"]);

export const assignBusinessSubscriptionSchema = z.object({
  planKey: z.string().min(1).max(40),
  status: businessSubscriptionStatusSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().nullable().optional(),
});

export type AssignBusinessSubscriptionInput = z.infer<typeof assignBusinessSubscriptionSchema>;
