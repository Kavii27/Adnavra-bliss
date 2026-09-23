/**
 * Advertisement rotation unit tests (pure, no DB). Run: npm test
 */
import { describe, it, expect } from "vitest";
import { isAdLive, selectAdsForPlacement, type AdCandidate } from "@/lib/ads";

const NOW = new Date("2026-08-10T12:00:00Z");

function ad(overrides: Partial<AdCandidate>): AdCandidate {
  return {
    id: "ad-1",
    priority: 0,
    isActive: true,
    startAt: new Date("2026-08-01T00:00:00Z"),
    endAt: new Date("2026-08-20T00:00:00Z"),
    ...overrides,
  };
}

describe("ads — isAdLive", () => {
  it("live when active and within its date window", () => {
    expect(isAdLive(ad({}), NOW)).toBe(true);
  });
  it("not live when isActive is false", () => {
    expect(isAdLive(ad({ isActive: false }), NOW)).toBe(false);
  });
  it("not live before startAt", () => {
    expect(isAdLive(ad({ startAt: new Date("2026-09-01T00:00:00Z"), endAt: new Date("2026-09-10T00:00:00Z") }), NOW)).toBe(false);
  });
  it("not live at/after endAt", () => {
    expect(isAdLive(ad({ startAt: new Date("2026-08-01T00:00:00Z"), endAt: NOW }), NOW)).toBe(false);
  });
});

describe("ads — selectAdsForPlacement", () => {
  it("returns nothing when no ads are live", () => {
    const result = selectAdsForPlacement([ad({ isActive: false })], NOW, 1);
    expect(result).toEqual([]);
  });

  it("excludes expired/scheduled/inactive ads from the pool", () => {
    const live = ad({ id: "live" });
    const expired = ad({ id: "expired", startAt: new Date("2026-07-01T00:00:00Z"), endAt: new Date("2026-07-02T00:00:00Z") });
    const disabled = ad({ id: "disabled", isActive: false });
    const result = selectAdsForPlacement([live, expired, disabled], NOW, 3);
    expect(result).toEqual(["live"]);
  });

  it("caps selection at `count` even with more live candidates", () => {
    const ads = [ad({ id: "a" }), ad({ id: "b" }), ad({ id: "c" })];
    const result = selectAdsForPlacement(ads, NOW, 2, () => 0.5);
    expect(result).toHaveLength(2);
  });

  it("never returns the same ad twice in one selection", () => {
    const ads = [ad({ id: "a" }), ad({ id: "b" })];
    const result = selectAdsForPlacement(ads, NOW, 2, () => 0.99);
    expect(new Set(result).size).toBe(2);
  });

  it("a higher-priority ad wins more often across repeated rolls (weighted, not fixed)", () => {
    const low = ad({ id: "low", priority: 0 });
    const high = ad({ id: "high", priority: 9 });
    // Roll values sweep 0..1 — high-priority ad should win the majority of them.
    const rolls = Array.from({ length: 11 }, (_, i) => i / 10);
    const wins = rolls.map((r) => selectAdsForPlacement([low, high], NOW, 1, () => r)[0]);
    const highWins = wins.filter((id) => id === "high").length;
    expect(highWins).toBeGreaterThan(wins.length / 2);
  });

  it("with rng returning 0, the first candidate by weight order is picked deterministically", () => {
    const ads = [ad({ id: "a" }), ad({ id: "b" }), ad({ id: "c" })];
    const result = selectAdsForPlacement(ads, NOW, 1, () => 0);
    expect(result).toEqual(["a"]);
  });
});
