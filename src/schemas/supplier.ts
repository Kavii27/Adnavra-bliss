import { z } from "zod";

export const createSupplierSchema = z.object({
  businessId: z.string().cuid(),
  name: z.string().min(1).max(120).trim(),
  contactName: z.string().max(120).trim().optional().nullable(),
  email: z.string().email().max(255).optional().nullable(),
  phone: z.string().max(32).trim().optional().nullable(),
  address: z.string().max(2000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateSupplierSchema = createSupplierSchema.omit({ businessId: true });

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
