import { describe, expect, it } from "vitest";
import { getCategoryLabel, taxonomyLabelKey } from "@/lib/categories";
import { dictionaries } from "@/lib/i18n/dictionary";

describe("legacy category captions", () => {
  it("maps legacy salon slugs to current category captions", () => {
    expect(getCategoryLabel("hair-salon")).toBe("Hair & styling");
    expect(getCategoryLabel("hair-saloon")).toBe("Hair & styling");
    expect(getCategoryLabel("barber")).toBe("Men's grooming");
    expect(getCategoryLabel("waxing")).toBe("Hair removal");
  });

  it("resolves legacy slugs to translated canonical keys", () => {
    expect(taxonomyLabelKey("beauty-salon")).toBe("cat.facials-skincare");
    expect(taxonomyLabelKey("medspa")).toBe("cat.spa-wellness");
    expect(taxonomyLabelKey("spa-sauna")).toBe("cat.spa-wellness");
    expect(taxonomyLabelKey("eyebrows-lashes")).toBe("cat.eyebrows-eyelashes");
  });

  it("keeps readable captions for legacy categories without a direct replacement", () => {
    expect(dictionaries.en["cat.tattoo-piercing"]).toBe("Tattoo & piercing");
    expect(dictionaries.en["cat.fitness"]).toBe("Fitness & recovery");
    expect(dictionaries.en["cat.pet-grooming"]).toBe("Pet grooming");
  });
});
