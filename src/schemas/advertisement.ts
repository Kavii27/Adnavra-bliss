import { z } from "zod";

export const getAdsQuerySchema = z.object({
  placement: z.string().min(1).max(100),
});

export type GetAdsQueryInput = z.infer<typeof getAdsQuerySchema>;
