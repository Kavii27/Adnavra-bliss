import { z } from "zod";

// Shared treatment (service) stock photos, managed from /admin/service-images.
// `target` decides which file on disk is written:
//   slug     → public/service-images/<category>/<slug>.webp (one catalog treatment)
//   category → public/service-images/_category/<category>.webp (fallback for the whole category)
//   default  → public/service-images/_category/default.webp (last-resort fallback)

export const serviceImageCategorySchema = z.enum([
  "hair-styling",
  "nails",
  "hair-removal",
  "eyebrows-eyelashes",
  "facials-skincare",
  "massage",
  "spa-wellness",
  "makeup",
]);

export type ServiceImageCategory = z.infer<typeof serviceImageCategorySchema>;

export const serviceImageTargetSchema = z.enum(["slug", "category", "default"]);

export type ServiceImageTarget = z.infer<typeof serviceImageTargetSchema>;

export const MAX_SERVICE_IMAGE_SIZE_MB = 8;

export const ALLOWED_SERVICE_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const uploadServiceImageSchema = z
  .object({
    target: serviceImageTargetSchema,
    category: z.string().trim().max(64),
    slug: z.string().trim().max(64).optional().default(""),
  })
  .superRefine((val, ctx) => {
    if (val.target === "default") return;
    const categoryParsed = serviceImageCategorySchema.safeParse(val.category);
    if (!categoryParsed.success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid category", path: ["category"] });
      return;
    }
    if (val.target === "slug" && !slugPattern.test(val.slug)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid slug", path: ["slug"] });
    }
  });

export type UploadServiceImageInput = z.infer<typeof uploadServiceImageSchema>;

export const deleteServiceImageSchema = z.object({
  target: z.literal("slug"),
  category: serviceImageCategorySchema,
  slug: z.string().trim().min(1).max(64).regex(slugPattern, "Invalid slug"),
});

export type DeleteServiceImageInput = z.infer<typeof deleteServiceImageSchema>;
