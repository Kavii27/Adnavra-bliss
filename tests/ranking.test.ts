/**
 * Search & ranking unit tests (pure, no DB). Run: npm test
 */
import { describe, it, expect } from "vitest";
import { computeRankScore, rankBusinesses, DEFAULT_RANKING_WEIGHTS, type RankableBusiness } from "@/lib/ranking";

function business(overrides: Partial<RankableBusiness>): RankableBusiness {
  return {
    businessId: "biz",
    planRank: 1,
    isFeaturedEligible: false,
    isPriorityEligible: false,
    isBoosted: false,
    distanceKm: null,
    ...overrides,
  };
}

describe("ranking — computeRankScore", () => {
  it("higher plan rank scores higher, all else equal", () => {
    const silver = computeRankScore(business({ planRank: 1 }), DEFAULT_RANKING_WEIGHTS);
    const gold = computeRankScore(business({ planRank: 2 }), DEFAULT_RANKING_WEIGHTS);
    const platinum = computeRankScore(business({ planRank: 3 }), DEFAULT_RANKING_WEIGHTS);
    expect(gold).toBeGreaterThan(silver);
    expect(platinum).toBeGreaterThan(gold);
  });

  it("an active boost adds a bonus, not a permanent override", () => {
    const notBoosted = computeRankScore(business({ planRank: 2 }), DEFAULT_RANKING_WEIGHTS);
    const boosted = computeRankScore(business({ planRank: 2, isBoosted: true }), DEFAULT_RANKING_WEIGHTS);
    expect(boosted).toBe(notBoosted + DEFAULT_RANKING_WEIGHTS.boostBonus);
  });

  it("a boosted Silver salon can still outscore an unboosted Gold salon", () => {
    const boostedSilver = computeRankScore(business({ planRank: 1, isBoosted: true }), DEFAULT_RANKING_WEIGHTS);
    const plainGold = computeRankScore(business({ planRank: 2 }), DEFAULT_RANKING_WEIGHTS);
    // 1*10 + 50 = 60  >  2*10 = 20 — boosting genuinely increases exposure.
    expect(boostedSilver).toBeGreaterThan(plainGold);
  });

  it("distance reduces score proportionally", () => {
    const near = computeRankScore(business({ distanceKm: 1 }), DEFAULT_RANKING_WEIGHTS);
    const far = computeRankScore(business({ distanceKm: 10 }), DEFAULT_RANKING_WEIGHTS);
    expect(near).toBeGreaterThan(far);
  });

  it("a business with no subscription (planRank 0) still gets a real score, not excluded", () => {
    const score = computeRankScore(business({ planRank: 0 }), DEFAULT_RANKING_WEIGHTS);
    expect(score).toBe(0);
  });
});

describe("ranking — rankBusinesses", () => {
  it("sorts highest score first and never drops a business", () => {
    // gold-boosted: 2*10 + 50(boost) + 20(featured) = 90
    // platinum:     3*10 + 40(priority)             = 70
    // silver:       1*10                            = 10
    // A boosted Gold outranking an idle Platinum is intentional — boosting
    // is a real, temporary exposure gain, not something a static tier caps.
    const businesses = [
      business({ businessId: "silver", planRank: 1 }),
      business({ businessId: "platinum", planRank: 3, isPriorityEligible: true }),
      business({ businessId: "gold-boosted", planRank: 2, isBoosted: true, isFeaturedEligible: true }),
    ];
    const ranked = rankBusinesses(businesses, DEFAULT_RANKING_WEIGHTS);
    expect(ranked).toHaveLength(3);
    expect(ranked.map((b) => b.businessId)).toEqual(["gold-boosted", "platinum", "silver"]);
  });

  it("Silver salons still appear even when every paid plan is present", () => {
    const businesses = [business({ businessId: "silver", planRank: 1 }), business({ businessId: "gold", planRank: 2 })];
    const ranked = rankBusinesses(businesses, DEFAULT_RANKING_WEIGHTS);
    expect(ranked.some((b) => b.businessId === "silver")).toBe(true);
  });
});
