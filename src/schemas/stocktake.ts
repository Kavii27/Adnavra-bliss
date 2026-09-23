import { z } from "zod";

const stocktakeItemSchema = z.object({
  productId: z.string().cuid().optional().nullable(),
  productName: z.string().min(1).max(120).trim(),
  expectedQty: z.number().int().min(0).max(1_000_000),
  countedQty: z.number().int().min(0).max(1_000_000),
});

export const createStocktakeSchema = z.object({
  businessId: z.string().cuid(),
  title: z.string().max(120).trim().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  items: z.array(stocktakeItemSchema).min(1).max(200),
});

export const updateStocktakeSchema = z.object({
  title: z.string().max(120).trim().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.enum(["OPEN", "COMPLETED"]).optional(),
  items: z.array(stocktakeItemSchema).min(1).max(200).optional(),
});

export type CreateStocktakeInput = z.infer<typeof createStocktakeSchema>;
export type UpdateStocktakeInput = z.infer<typeof updateStocktakeSchema>;
