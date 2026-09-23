import { z } from "zod";

const packageItemSchema = z.object({
  serviceId: z.string().cuid(),
  quantity: z.number().int().min(1).max(50).optional().default(1),
});

export const createPackageSchema = z.object({
  businessId: z.string().cuid(),
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(2000).optional().nullable(),
  price: z.number().min(0).max(1_000_000),
  isActive: z.boolean().optional().default(true),
  items: z.array(packageItemSchema).min(1).max(50),
});

export const updatePackageSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(2000).optional().nullable(),
  price: z.number().min(0).max(1_000_000).optional(),
  isActive: z.boolean().optional(),
  items: z.array(packageItemSchema).min(1).max(50).optional(),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
