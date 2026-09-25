import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  HOMEPAGE_BANNER_SETTING_KEY,
  homepageBannerSettingSchema,
  safeDestinationUrlSchema,
  type HomepageBannerSetting,
} from "@/schemas/platformSettings";

export const DEFAULT_HOMEPAGE_BANNER: HomepageBannerSetting = {
  imageUrl: "/banner.jpg",
  destinationUrl: "/for-business",
};

export function normalizeHomepageBannerValue(value: Prisma.JsonValue | null | undefined): HomepageBannerSetting {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const imageUrl = homepageBannerSettingSchema.shape.imageUrl.safeParse(record.imageUrl);
  const destinationUrl = safeDestinationUrlSchema.safeParse(record.destinationUrl);
  return {
    imageUrl: imageUrl.success ? imageUrl.data : DEFAULT_HOMEPAGE_BANNER.imageUrl,
    destinationUrl: destinationUrl.success ? destinationUrl.data : DEFAULT_HOMEPAGE_BANNER.destinationUrl,
  };
}

export async function getHomepageBannerSetting(): Promise<{
  id: string;
  banner: HomepageBannerSetting;
}> {
  const setting = await db.platformSetting.findUnique({
    where: { key: HOMEPAGE_BANNER_SETTING_KEY },
    select: { id: true, value: true },
  });
  return {
    id: setting?.id ?? "",
    banner: normalizeHomepageBannerValue(setting?.value),
  };
}
