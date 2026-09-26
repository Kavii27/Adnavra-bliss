/**
 * Service image resolver — pure unit tests (no DB, no filesystem).
 * Run: npm test
 */
import { describe, it, expect } from "vitest";
import {
  matchServiceSlug,
  normalizeServiceName,
  resolveServiceImage,
  resolveServiceImageCandidates,
} from "@/lib/service-images";

describe("normalizeServiceName", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalizeServiceName("  Cut & Blow-dry! ")).toBe("cut blow dry");
  });
});

describe("matchServiceSlug", () => {
  it("matches a salon-specific name to the shared service", () => {
    expect(matchServiceSlug("Ladies Layer Cut", "hair-styling")?.slug).toBe("haircut");
    expect(matchServiceSlug("Gents Haircut", "hair-styling")?.slug).toBe("haircut");
  });

  it("matches word stems and plurals", () => {
    expect(matchServiceSlug("Highlights", "hair-styling")?.slug).toBe("highlights-balayage");
    expect(matchServiceSlug("Ayurvedic Full Body Massage", "massage")?.slug).toBe("ayurvedic-massage");
  });

  it("prefers the more specific keyword at the same position", () => {
    expect(matchServiceSlug("Bridal Makeup", "makeup")?.slug).toBe("bridal-makeup");
    expect(matchServiceSlug("Bridal Dressing", "makeup")?.slug).toBe("bridal-dressing");
  });

  it("looks in the service's own category first", () => {
    // "oil" appears in hair-oiling, but inside massage it is not a rule.
    expect(matchServiceSlug("Hot Stone Massage with Oil", "massage")?.slug).toBe("hot-stone-massage");
  });

  it("falls back to any category when the category is missing", () => {
    expect(matchServiceSlug("Pedicure", null)?.slug).toBe("pedicure");
  });

  it("returns null when nothing matches", () => {
    expect(matchServiceSlug("Zzz Unknown Thing", "nails")).toBeNull();
    expect(matchServiceSlug("", "nails")).toBeNull();
  });
});

describe("resolveServiceImageCandidates", () => {
  it("uses the specific image when it is available", () => {
    const c = resolveServiceImageCandidates("Ladies Layer Cut", "hair-styling");
    expect(c[0]).toBe("/service-images/hair-styling/haircut.webp");
    expect(c[1]).toBe("/service-images/_category/hair-styling.webp");
    expect(c[c.length - 1]).toBe("/service-images/_category/default.webp");
  });

  it("always tries the specific image first, even before a file is uploaded", () => {
    // "keratin-treatment" may have no file on disk yet — the candidate is
    // still listed first and ServiceImage's onError chain falls through to
    // the category image. This is what lets an admin upload work instantly
    // with no rebuild (no build-time manifest gate).
    const c = resolveServiceImageCandidates("Keratin Treatment", "hair-styling");
    expect(c[0]).toBe("/service-images/hair-styling/keratin-treatment.webp");
    expect(c[1]).toBe("/service-images/_category/hair-styling.webp");
    expect(c[c.length - 1]).toBe("/service-images/_category/default.webp");
  });

  it("uses the category image when the name matches nothing", () => {
    expect(resolveServiceImage("Something Custom", "nails")).toBe("/service-images/_category/nails.webp");
  });

  it("uses the default image with no category and no match", () => {
    expect(resolveServiceImage("Something Custom", null)).toBe("/service-images/_category/default.webp");
  });

  it("ignores unknown category values", () => {
    expect(resolveServiceImage("Something Custom", "not-a-category")).toBe("/service-images/_category/default.webp");
  });
});
