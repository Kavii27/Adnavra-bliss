import { z } from "zod";

export const createPromotionSchema = z.object({
  businessId: z.string().cuid(),
  code: z.string().min(1).max(32).trim().transform((s) => s.toUpperCase()),
  title: z.string().min(1).max(120).trim(),
  description: z.string().max(2000).optional().nullable(),
  percentOff: z.number().int().min(1).max(90).optional().nullable(),
  amountOff: z.number().min(0).max(1_000_000).optional().nullable(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  isCampaign: z.boolean().optional().default(false),
  repeatRule: z.enum(["weekly", "monthly"]).optional().nullable(),
});

export const updatePromotionSchema = createPromotionSchema
  .omit({ businessId: true, code: true })
  .extend({ code: z.string().min(1).max(32).trim().transform((s) => s.toUpperCase()).optional() });

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;
