import { Award, Crown, Gem, type LucideIcon } from "lucide-react";

/**
 * Maps a plan's rank to a distinct premium visual treatment — same idea as
 * DESIGN.md's pricing-tier-card-featured (the dark card IS the signal for
 * the top tier), extended to three tiers using only tokens already in the
 * codebase (no new colors introduced).
 */
export type PlanVisual = {
  icon: LucideIcon;
  label: string;
  cardClass: string;
  badgeClass: string;
  headingClass: string;
  isDark: boolean;
};

export function getPlanVisual(rank: number): PlanVisual {
  if (rank >= 3) {
    return {
      icon: Gem,
      label: "Top tier",
      cardClass:
        "bg-[linear-gradient(135deg,#3a2f22_0%,#5f4630_55%,#8a6d4f_100%)] border-transparent shadow-[0_1px_2px_rgba(58,47,34,0.10),0_12px_32px_rgba(58,47,34,0.28)] text-[#faf6ef]",
      badgeClass: "bg-[#c9a26d] text-[#3a2f22]",
      headingClass: "text-[#faf6ef]",
      isDark: true,
    };
  }
  if (rank === 2) {
    return {
      icon: Crown,
      label: "Popular",
      cardClass:
        "bg-white border-[#c9a26d]/50 shadow-[0_1px_2px_rgba(58,47,34,0.05),0_8px_24px_rgba(58,47,34,0.10)]",
      badgeClass: "bg-[#c9a26d] text-white",
      headingClass: "text-[#3a2f22]",
      isDark: false,
    };
  }
  return {
    icon: Award,
    label: "Starter tier",
    cardClass: "bg-white border-[#E3E8F0] shadow-[0_1px_2px_rgba(58,47,34,0.04)]",
    badgeClass: "bg-[#EAF3F2] text-[#3a2f22]",
    headingClass: "text-[#3a2f22]",
    isDark: false,
  };
}
