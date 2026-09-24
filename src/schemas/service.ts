import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(2000).optional().nullable(),
  durationMin: z.number().int().min(5).max(480),
  price: z.number().min(0).max(1_000_000),
  businessId: z.string().cuid(),
  isActive: z.boolean().optional().default(true),
  category: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export const updateServiceSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(2000).optional().nullable(),
  durationMin: z.number().int().min(5).max(480).optional(),
  price: z.number().min(0).max(1_000_000).optional(),
  isActive: z.boolean().optional(),
  category: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
