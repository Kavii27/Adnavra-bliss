import { z } from "zod";

export const createProductSchema = z.object({
  businessId: z.string().cuid(),
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(2000).optional().nullable(),
  price: z.number().min(0).max(1_000_000),
  stockQty: z.number().int().min(0).max(1_000_000),
  sku: z.string().max(64).trim().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(2000).optional().nullable(),
  price: z.number().min(0).max(1_000_000).optional(),
  stockQty: z.number().int().min(0).max(1_000_000).optional(),
  sku: z.string().max(64).trim().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
