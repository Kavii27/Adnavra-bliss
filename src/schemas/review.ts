import { z } from "zod";

export const createReviewSchema = z.object({
  businessId: z.string().cuid(),
  customerId: z.string().cuid().optional().nullable(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().nullable(),
  source: z.enum(["walk-in", "marketplace", "staff-logged"]).optional().default("staff-logged"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
