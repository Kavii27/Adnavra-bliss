import { describe, expect, it } from "vitest";
import { createAdvertisementFormSchema } from "@/schemas/advertisement";

const base = {
  placementKey: "homepage_top",
  title: "Launch offer",
  destinationUrl: "https://example.com/offer",
  startAt: "2026-09-01",
  endAt: "2026-09-30",
};

describe("advertisement multipart booleans", () => {
  it("keeps the string false disabled", () => {
    const result = createAdvertisementFormSchema.parse({ ...base, isActive: "false" });
    expect(result.isActive).toBe(false);
  });

  it("keeps the string true enabled", () => {
    const result = createAdvertisementFormSchema.parse({ ...base, isActive: "true" });
    expect(result.isActive).toBe(true);
  });
});
