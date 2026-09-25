import { describe, expect, it } from "vitest";
import { normalizeHomepageBannerValue } from "@/lib/platform-settings";
import { safeDestinationUrlSchema } from "@/schemas/platformSettings";

describe("homepage banner settings", () => {
  it("accepts safe internal and HTTPS destinations", () => {
    expect(safeDestinationUrlSchema.safeParse("/for-business").success).toBe(true);
    expect(safeDestinationUrlSchema.safeParse("/featured?from=banner").success).toBe(true);
    expect(safeDestinationUrlSchema.safeParse("https://example.com/offer").success).toBe(true);
  });

  it("rejects unsafe destinations", () => {
    expect(safeDestinationUrlSchema.safeParse("//example.com").success).toBe(false);
    expect(safeDestinationUrlSchema.safeParse("http://example.com").success).toBe(false);
    expect(safeDestinationUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
    expect(safeDestinationUrlSchema.safeParse("/\\example.com").success).toBe(false);
  });

  it("preserves valid stored fields and replaces invalid ones with defaults", () => {
    expect(
      normalizeHomepageBannerValue({
        imageUrl: "/uploads/platform/homepage-banner-123-abcd1234.webp",
        destinationUrl: "https://example.com",
      }),
    ).toEqual({
      imageUrl: "/uploads/platform/homepage-banner-123-abcd1234.webp",
      destinationUrl: "https://example.com",
    });
    expect(normalizeHomepageBannerValue({ imageUrl: "https://unsafe.example/image.jpg", destinationUrl: "javascript:alert(1)" })).toEqual({
      imageUrl: "/banner.jpg",
      destinationUrl: "/for-business",
    });
  });
});
