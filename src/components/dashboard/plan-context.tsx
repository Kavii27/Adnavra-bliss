"use client";
import { createContext, useContext } from "react";
import type { Plan } from "@/lib/plan-features";

const PlanContext = createContext<Plan>("STARTER");
export function PlanProvider({ value, children }: { value: Plan; children: React.ReactNode }) {
  return <PlanContext value={value}>{children}</PlanContext>;
}
export const useCurrentPlan = () => useContext(PlanContext);
