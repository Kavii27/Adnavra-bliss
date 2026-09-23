/**
 * Boosting engine unit tests (pure, no DB).
 * Covers: weekly limit enforcement, active/expired/cancelled windows,
 * and fair rotation selection. Run: npm test
 */
import { describe, it, expect } from "vitest";
import {
  isBoostActive,
  countBoostsInTrailingWeek,
  canBoost,
  computeBoostWindow,
  selectNextBoostCandidates,
  type BoostRecord,
  type BoostCandidate,
} from "@/lib/boosting";

const NOW = new Date("2026-08-10T12:00:00Z");

function boost(overrides: Partial<BoostRecord>): BoostRecord {
  return {
    businessId: "biz-1",
    startAt: new Date("2026-08-10T00:00:00Z"),
    endAt: new Date("2026-08-11T00:00:00Z"),
    cancelledAt: null,
    ...overrides,
  };
}

describe("boosting — isBoostActive", () => {
  it("active when now is within [startAt, endAt)", () => {
    expect(isBoostActive(boost({}), NOW)).toBe(true);
  });
  it("not active once cancelled", () => {
    expect(isBoostActive(boost({ cancelledAt: new Date("2026-08-10T01:00:00Z") }), NOW)).toBe(false);
  });
  it("not active before startAt", () => {
    expect(isBoostActive(boost({ startAt: new Date("2026-08-11T00:00:00Z"), endAt: new Date("2026-08-12T00:00:00Z") }), NOW)).toBe(
      false
    );
  });
  it("not active at/after endAt (half-open interval)", () => {
    expect(isBoostActive(boost({ startAt: new Date("2026-08-09T00:00:00Z"), endAt: NOW }), NOW)).toBe(false);
  });
});

describe("boosting — countBoostsInTrailingWeek / canBoost", () => {
  it("Silver (boostsPerWeek=0) can never boost", () => {
    expect(canBoost({ boostsPerWeek: 0, maxBoostHours: 24 }, [], NOW)).toBe(false);
  });

  it("Gold (5/week) can boost when under the limit", () => {
    const boosts = [boost({}), boost({})]; // 2 this week
    expect(countBoostsInTrailingWeek(boosts, NOW)).toBe(2);
    expect(canBoost({ boostsPerWeek: 5, maxBoostHours: 24 }, boosts, NOW)).toBe(true);
  });

  it("Gold (5/week) cannot exceed its weekly limit", () => {
    const boosts = Array.from({ length: 5 }, () => boost({}));
    expect(canBoost({ boostsPerWeek: 5, maxBoostHours: 24 }, boosts, NOW)).toBe(false);
  });

  it("boosts older than 7 days don't count toward the limit", () => {
    const boosts = [boost({ startAt: new Date("2026-08-01T00:00:00Z") })];
    expect(countBoostsInTrailingWeek(boosts, NOW)).toBe(0);
  });

  it("cancelled boosts don't count toward the limit", () => {
    const boosts = Array.from({ length: 5 }, () => boost({ cancelledAt: NOW }));
    expect(canBoost({ boostsPerWeek: 5, maxBoostHours: 24 }, boosts, NOW)).toBe(true);
  });
});

describe("boosting — computeBoostWindow", () => {
  it("uses the plan's maxBoostHours", () => {
    const { startAt, endAt } = computeBoostWindow({ boostsPerWeek: 5, maxBoostHours: 12 }, NOW);
    expect(startAt.getTime()).toBe(NOW.getTime());
    expect(endAt.getTime() - startAt.getTime()).toBe(12 * 60 * 60 * 1000);
  });

  it("falls back to 24h when maxBoostHours is 0/unset", () => {
    const { endAt, startAt } = computeBoostWindow({ boostsPerWeek: 5, maxBoostHours: 0 }, NOW);
    expect(endAt.getTime() - startAt.getTime()).toBe(24 * 60 * 60 * 1000);
  });
});

describe("boosting — selectNextBoostCandidates", () => {
  const plan = { boostsPerWeek: 5, maxBoostHours: 24 };

  function candidate(businessId: string, recentBoosts: BoostRecord[] = []): BoostCandidate {
    return { businessId, plan, recentBoosts: recentBoosts.map((b) => ({ ...b, businessId })) };
  }

  it("never-boosted salons are prioritized over recently-boosted ones", () => {
    const neverBoosted = candidate("never");
    const boostedYesterday = candidate("yesterday", [boost({ startAt: new Date("2026-08-09T12:00:00Z") })]);
    const result = selectNextBoostCandidates([boostedYesterday, neverBoosted], NOW, 1);
    expect(result).toEqual(["never"]);
  });

  it("excludes a salon that already has an active boost (no stacking)", () => {
    const active = candidate("active-now", [boost({})]);
    const idle = candidate("idle");
    const result = selectNextBoostCandidates([active, idle], NOW, 2);
    expect(result).toEqual(["idle"]);
  });

  it("excludes a salon that has hit its weekly limit", () => {
    const atLimit = candidate(
      "at-limit",
      Array.from({ length: 5 }, (_, i) => boost({ startAt: new Date(NOW.getTime() - (i + 1) * 60 * 60 * 1000), endAt: new Date(NOW.getTime() - i * 60 * 60 * 1000) }))
    );
    const underLimit = candidate("under-limit");
    const result = selectNextBoostCandidates([atLimit, underLimit], NOW, 2);
    expect(result).toEqual(["under-limit"]);
  });

  it("Silver (boostsPerWeek=0) is never selected even with zero history", () => {
    const silver: BoostCandidate = { businessId: "silver", plan: { boostsPerWeek: 0, maxBoostHours: 24 }, recentBoosts: [] };
    const result = selectNextBoostCandidates([silver], NOW, 5);
    expect(result).toEqual([]);
  });

  it("caps results at `count` even with more eligible candidates", () => {
    const candidates = [candidate("a"), candidate("b"), candidate("c")];
    const result = selectNextBoostCandidates(candidates, NOW, 2);
    expect(result).toHaveLength(2);
  });
});
