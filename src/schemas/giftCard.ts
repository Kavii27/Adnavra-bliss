import { z } from "zod";

export const createGiftCardSchema = z.object({
  businessId: z.string().cuid(),
  code: z.string().min(1).max(32).trim().transform((s) => s.toUpperCase()),
  amount: z.number().min(0).max(1_000_000),
  recipientName: z.string().max(120).trim().optional().nullable(),
  recipientEmail: z.string().email().max(255).optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
});

export const updateGiftCardSchema = z.object({
  status: z.enum(["ACTIVE", "REDEEMED", "EXPIRED", "CANCELLED"]).optional(),
  recipientName: z.string().max(120).trim().optional().nullable(),
  recipientEmail: z.string().email().max(255).optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
});

export type CreateGiftCardInput = z.infer<typeof createGiftCardSchema>;
export type UpdateGiftCardInput = z.infer<typeof updateGiftCardSchema>;
