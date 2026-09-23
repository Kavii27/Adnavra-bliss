import { z } from "zod";

export const createTimesheetSchema = z.object({
  businessId: z.string().cuid(),
  staffMemberId: z.string().cuid(),
  date: z.coerce.date(),
  clockIn: z.coerce.date().optional().nullable(),
  clockOut: z.coerce.date().optional().nullable(),
  hours: z.number().min(0).max(24),
  note: z.string().max(2000).optional().nullable(),
});

export const updateTimesheetSchema = z.object({
  clockIn: z.coerce.date().optional().nullable(),
  clockOut: z.coerce.date().optional().nullable(),
  hours: z.number().min(0).max(24).optional(),
  note: z.string().max(2000).optional().nullable(),
});

export type CreateTimesheetInput = z.infer<typeof createTimesheetSchema>;
export type UpdateTimesheetInput = z.infer<typeof updateTimesheetSchema>;
