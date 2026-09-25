import { z } from "zod";

export const HOMEPAGE_BANNER_SETTING_KEY = "homepage_banner";
export const MAX_HOMEPAGE_BANNER_IMAGE_SIZE_MB = 8;
export const ALLOWED_HOMEPAGE_BANNER_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const safeDestinationUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine((value) => {
    if (/\s|\\/.test(value)) return false;
    if (value.startsWith("/")) {
      if (value.startsWith("//")) return false;
      try {
        const url = new URL(value, "https://adnavra.local");
        return url.origin === "https://adnavra.local" && url.pathname.startsWith("/");
      } catch {
        return false;
      }
    }
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.username === "" && url.password === "";
    } catch {
      return false;
    }
  }, "Use an internal path starting with / or an HTTPS URL");

export const homepageBannerImageUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(512)
  .refine(
    (value) =>
      value === "/banner.jpg" ||
      /^\/uploads\/platform\/homepage-banner-\d+-[a-f0-9]{8}\.webp$/.test(value),
    "Invalid homepage banner image path",
  );

export const homepageBannerSettingSchema = z.object({
  imageUrl: homepageBannerImageUrlSchema,
  destinationUrl: safeDestinationUrlSchema,
});

export const updateHomepageBannerSchema = z.object({
  destinationUrl: safeDestinationUrlSchema,
});

export type HomepageBannerSetting = z.infer<typeof homepageBannerSettingSchema>;
export type UpdateHomepageBannerInput = z.infer<typeof updateHomepageBannerSchema>;
