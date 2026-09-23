import { z } from "zod";

export const SALE_CATEGORIES = ["SERVICE", "PRODUCT", "PACKAGE", "MEMBERSHIP", "GIFT_CARD", "OTHER"] as const;

export const createSaleRecordSchema = z.object({
  businessId: z.string().cuid(),
  category: z.enum(SALE_CATEGORIES).optional().default("SERVICE"),
  label: z.string().min(1).max(200).trim(),
  amount: z.number().min(0).max(10_000_000),
  status: z.enum(["COMPLETED", "REFUNDED", "VOIDED"]).optional().default("COMPLETED"),
  customerId: z.string().cuid().optional().nullable(),
  bookingId: z.string().cuid().optional().nullable(),
  occurredAt: z.coerce.date().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateSaleRecordSchema = z.object({
  status: z.enum(["COMPLETED", "REFUNDED", "VOIDED"]).optional(),
  label: z.string().min(1).max(200).trim().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const createPackageSaleSchema = z.object({
  businessId: z.string().cuid(),
  packageId: z.string().cuid().optional().nullable(),
  packageName: z.string().min(1).max(120).trim().optional().nullable(),
  customerId: z.string().cuid().optional().nullable(),
  pricePaid: z.number().min(0).max(1_000_000),
  status: z.enum(["ACTIVE", "REDEEMED", "EXPIRED", "CANCELLED"]).optional().default("ACTIVE"),
});

export const updatePackageSaleSchema = z.object({
  status: z.enum(["ACTIVE", "REDEEMED", "EXPIRED", "CANCELLED"]).optional(),
});

export type CreateSaleRecordInput = z.infer<typeof createSaleRecordSchema>;
export type CreatePackageSaleInput = z.infer<typeof createPackageSaleSchema>;
