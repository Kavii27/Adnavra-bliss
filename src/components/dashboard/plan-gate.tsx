"use client";
import Link from "next/link";
import { Lock } from "lucide-react";
import { hasAccess, type Feature } from "@/lib/plan-features";
import { useCurrentPlan } from "@/components/dashboard/plan-context";

export function PlanGate({ feature, children }: { feature: Feature; children: React.ReactNode }) {
  const plan = useCurrentPlan();
  if (hasAccess(plan, feature)) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm opacity-60" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/40 p-6 text-center">
        <Lock className="h-5 w-5 text-[#8a6d4f]" />
        <p className="text-sm font-medium text-[#3a2f22]">This feature isn&apos;t included in your plan. Upgrade to unlock this.</p>
        <Link
          href="/dashboard/settings/billing"
          className="text-xs font-semibold text-[#8a6d4f] hover:underline"
        >
          View plans →
        </Link>
      </div>
    </div>
  );
}
