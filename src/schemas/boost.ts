import { z } from "zod";

export const createBoostSchema = z.object({
  businessId: z.string().min(1),
});

export type CreateBoostInput = z.infer<typeof createBoostSchema>;
