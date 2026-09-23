import { z } from "zod";

export const getAdsQuerySchema = z.object({
  placement: z.string().min(1).max(100),
});

export type GetAdsQueryInput = z.infer<typeof getAdsQuerySchema>;

// Same convention as businessImage.ts — browsers report these; sharp enforces the real check.
export const MAX_AD_IMAGE_SIZE_MB = 8;
export const ALLOWED_AD_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const placementKeySchema = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores only");

export const createAdvertisementPlacementSchema = z.object({
  key: placementKeySchema,
  name: z.string().min(1).max(80),
  description: z.string().max(2000).optional(),
  maxActiveAds: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
});

// Multipart form fields for POST /api/admin/advertisements (the image file is
// handled separately from FormData, not through this schema).
export const createAdvertisementFormSchema = z.object({
  placementKey: z.string().min(1).max(40),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  destinationUrl: z.string().url(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  priority: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const updateAdvertisementSchema = z.object({
  placementKey: z.string().min(1).max(40).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  destinationUrl: z.string().url().optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  priority: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CreateAdvertisementPlacementInput = z.infer<typeof createAdvertisementPlacementSchema>;
export type CreateAdvertisementFormInput = z.infer<typeof createAdvertisementFormSchema>;
export type UpdateAdvertisementInput = z.infer<typeof updateAdvertisementSchema>;
