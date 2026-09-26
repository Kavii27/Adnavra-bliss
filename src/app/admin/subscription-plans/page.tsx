import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowLeft, Layers, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubscriptionPlanCard } from "@/components/admin/subscription-plan-card";
import { NewSubscriptionPlanForm } from "@/components/admin/new-subscription-plan-form";

/**
 * Admin → Subscription Plans (Task: subscription/boosting/advertising system).
 * The plan builder/editor — create/edit Silver/Gold/Platinum (or any future
 * tier) without touching code. Feeds the ranking + boosting engines, which
 * read these rows, not hardcoded constants.
 */
export default async function AdminSubscriptionPlansPage() {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    notFound();
  }

  let plans: Awaited<ReturnType<typeof db.subscriptionPlan.findMany>>;
  try {
    plans = await db.subscriptionPlan.findMany({ orderBy: { rank: "asc" } });
  } catch {
    return (
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[#3a2f22]">Subscription Plans</h1>
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-[#FDECEC] bg-[#FDECEC] p-4 text-sm font-medium text-[#B91C1C]">
          <AlertCircle className="h-4 w-4 shrink-0" /> Could not load subscription plans. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#a89880] hover:text-[#3a2f22]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to platform console
      </Link>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#3a2f22_0%,#8a6d4f_100%)] shadow-[0_4px_12px_rgba(58,47,34,0.18)]">
          <Layers className="h-5 w-5 text-[#f5ead9]" />
        </span>
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[#3a2f22]">Subscription Plans</h1>
          <p className="mt-0.5 text-sm text-[#a89880]">
            Define Silver, Gold, Platinum or any future tier. Boost frequency, search visibility, and gallery
            limits all come from these rows, not code. Changes take effect immediately.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <SubscriptionPlanCard key={plan.id} plan={plan} />
        ))}
      </div>

      <div className="mt-8">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#3a2f22]">
          <Plus className="h-4 w-4 text-[#8a6d4f]" /> Add a new plan
        </h2>
        <div className="mt-3 rounded-2xl border border-dashed border-[#c9a26d]/40 bg-[#faf6ef] p-6">
          <NewSubscriptionPlanForm />
        </div>
      </div>
    </div>
  );
}
