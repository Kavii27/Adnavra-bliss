import { z } from "zod";

export const createStaffSchema = z.object({
  businessId: z.string().cuid(),
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().max(200).trim().optional().nullable().or(z.literal("")),
  phone: z.string().min(7).max(20).trim().optional().nullable().or(z.literal("")),
  isActive: z.boolean().optional().default(true),
});

export const updateStaffSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  email: z.string().email().max(200).trim().optional().nullable().or(z.literal("")),
  phone: z.string().min(7).max(20).trim().optional().nullable().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
