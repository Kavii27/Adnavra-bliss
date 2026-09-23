import { z } from "zod";

export const createBookingSchema = z.object({
  businessId: z.string().cuid(),
  serviceId: z.string().cuid(),
  staffMemberId: z.string().cuid().optional().nullable(),
  customerName: z.string().min(1).max(100).trim().optional(),
  customerEmail: z.string().email().optional().nullable().or(z.literal("")),
  customerPhone: z.string().min(7).max(20).trim().optional().nullable(),
  startAt: z.coerce.date(),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateBookingSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
  startAt: z.coerce.date().optional(),
  staffMemberId: z.string().cuid().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
