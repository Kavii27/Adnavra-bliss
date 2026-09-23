import { z } from "zod";

export const createMembershipSchema = z.object({
  businessId: z.string().cuid(),
  name: z.string().min(1).max(120).trim(),
  description: z.string().max(2000).optional().nullable(),
  price: z.number().min(0).max(1_000_000),
  durationDays: z.number().int().min(1).max(1825),
  isActive: z.boolean().optional().default(true),
});

export const updateMembershipSchema = createMembershipSchema.omit({ businessId: true });

export const createMembershipSaleSchema = z.object({
  businessId: z.string().cuid(),
  membershipId: z.string().cuid().optional().nullable(),
  membershipName: z.string().min(1).max(120).trim().optional().nullable(),
  customerId: z.string().cuid().optional().nullable(),
  pricePaid: z.number().min(0).max(1_000_000),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
});

export const updateMembershipSaleSchema = z.object({
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED"]).optional(),
});

export type CreateMembershipInput = z.infer<typeof createMembershipSchema>;
export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>;
export type CreateMembershipSaleInput = z.infer<typeof createMembershipSaleSchema>;
