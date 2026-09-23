import { z } from "zod";

export const createShiftSchema = z.object({
  businessId: z.string().cuid(),
  staffMemberId: z.string().cuid(),
  start: z.coerce.date(),
  end: z.coerce.date(),
  notes: z.string().max(2000).optional().nullable(),
}).refine((v) => v.end > v.start, { message: "Shift end must be after start", path: ["end"] });

export const updateShiftSchema = z.object({
  staffMemberId: z.string().cuid().optional(),
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreateShiftInput = z.infer<typeof createShiftSchema>;
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>;
