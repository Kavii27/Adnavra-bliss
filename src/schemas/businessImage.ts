import { z } from "zod";

// Priority 3 — salon logo/photo quality control.
// `kind` decides processing + where the URL is stored:
//   logo    → resized to 512px wide, saved to Business.logoUrl
//   cover   → resized to 1600px wide, single BusinessImage row (replaces old)
//   gallery → resized to 1600px wide, appended BusinessImage row

export const businessImageKindSchema = z.enum(["logo", "cover", "gallery"]);

export type BusinessImageKind = z.infer<typeof businessImageKindSchema>;

export const MAX_IMAGE_SIZE_MB = 8;
export const MIN_IMAGE_WIDTH = 512;
export const MAX_GALLERY_PHOTOS = 12;

// Browsers report these for camera/library picks; sharp enforces the real check.
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
