import { z } from "zod";

const stockOrderItemSchema = z.object({
  productId: z.string().cuid().optional().nullable(),
  productName: z.string().min(1).max(120).trim(),
  quantity: z.number().int().min(1).max(100_000),
  unitCost: z.number().min(0).max(1_000_000),
});

export const createStockOrderSchema = z.object({
  businessId: z.string().cuid(),
  supplierId: z.string().cuid(),
  notes: z.string().max(2000).optional().nullable(),
  items: z.array(stockOrderItemSchema).min(1).max(100),
});

export const updateStockOrderSchema = z.object({
  status: z.enum(["PENDING", "ORDERED", "RECEIVED", "CANCELLED"]).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreateStockOrderInput = z.infer<typeof createStockOrderSchema>;
export type UpdateStockOrderInput = z.infer<typeof updateStockOrderSchema>;
