import { z } from "zod";

export const createBookingSchema = z.object({
  businessId: z.string().cuid(),
  // Multi-service: one appointment = one or more services, booked back-to-back.
  // Legacy single-service callers can send serviceId instead — normalized in the route.
  serviceIds: z.array(z.string().cuid()).min(1, "Select at least one treatment").max(10).optional(),
  serviceId: z.string().cuid().optional(),
  staffMemberId: z.string().cuid().optional().nullable(),
  customerName: z.string().min(1, "Name is required").max(100).trim(),
  customerPhone: z.string().min(7, "Contact number is required").max(20).trim(),
  customerEmail: z.string().email().optional().nullable().or(z.literal("")),
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
