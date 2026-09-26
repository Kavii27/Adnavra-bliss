import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreditCard, ArrowLeft, Check } from "lucide-react";

const PLANS: { id: string; name: string; price: string; period: string; popular?: boolean; features: string[] }[] = [
  {
    id: "STARTER",
    name: "Starter",
    price: "LKR 3,000",
    period: "/ month",
    features: ["Salon profile and booking page", "Services and pricing listing", "Online appointment booking", "Basic availability management", "QR code and salon URL"],
  },
  {
    id: "PROFESSIONAL",
    name: "Professional",
    price: "LKR 5,000",
    period: "/ month",
    popular: true,
    features: ["Everything in Starter, plus:", "Staff and team management", "Customer database and history", "Advanced schedule management", "Featured salon profile"],
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: "LKR 7,000",
    period: "/ month",
    features: ["Everything in Professional, plus:", "Multiple branches and locations", "Advanced analytics and reports", "Loyalty and return-customer tools", "Featured marketplace placement"],
  },
];

function formatDate(d: Date | null | undefined): string {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "-";
  }
}

export default async function BillingPage() {
  const session = await auth();
  const businessId = (session?.user as unknown as { businessId: string | null })?.businessId ?? null;

  let business: { name: string; slug: string } | null = null;
  let subscription: { plan: string; status: string; currentPeriodStart: Date; currentPeriodEnd: Date | null } | null = null;
  let error: string | null = null;

  if (!businessId) {
    error = "No business linked to this account yet.";
  } else {
    try {
      const b = await db.business.findUnique({
        where: { id: businessId },
        select: { name: true, slug: true, subscription: true },
      });
      if (!b) {
        error = "Business not found.";
      } else {
        business = { name: b.name, slug: b.slug };
        subscription = b.subscription
          ? {
              plan: b.subscription.plan,
              status: b.subscription.status,
              currentPeriodStart: b.subscription.currentPeriodStart,
              currentPeriodEnd: b.subscription.currentPeriodEnd,
            }
          : null;
        if (!subscription) error = "No subscription found for this business yet.";
      }
    } catch (e: unknown) {
      error = (e as Error).message ?? "Failed to load billing information.";
    }
  }

  return (
    <div className="bg-[#FAF7F2] min-h-full px-6 py-8">
      <div className="max-w-3xl">
        <Link href="/dashboard/settings" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8A8377] hover:text-[#1F1E1D] mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Settings
        </Link>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center border border-[#E9E1D3]">
            <CreditCard className="h-5 w-5 text-[#9A7B4F]" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#9A7B4F" }}>
              Settings
            </p>
            <h1 className="font-[family-name:var(--font-display)] mt-0.5 text-2xl font-medium tracking-tight text-[#1F1B17]">Billing</h1>
            <p className="text-sm text-[#8A8377] mt-1">Your current plan, status, and billing period.</p>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-sm font-medium text-amber-800">{error}</p>
            <p className="mt-1 text-xs text-[#8A8377]">Create your business in Business setup and a Starter subscription is created automatically. Contact ADNAVRA to change your plan.</p>
            <Link href="/dashboard/settings/business" className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#1F1B17] hover:bg-[#FBF7EF]">
              Go to Business setup
            </Link>
          </div>
        ) : subscription && business ? (
          <>
            {/* Current subscription */}
            <div className="mt-6 rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#8A8377]">Current plan</p>
                  <p className="mt-1 text-lg font-semibold text-[#1F1E1D]">{subscription.plan}</p>
                  <p className="mt-1 text-xs text-[#8A8377]">Business: {business.name} · /{business.slug}</p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    subscription.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-[#FBF7EF] text-[#8A8377] border border-[#E9E1D3]"
                  }`}
                >
                  {subscription.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-[#FAF7F2] border border-[#E9E1D3] p-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#8A8377]">Current period start</p>
                  <p className="mt-1 text-sm text-[#1F1E1D]">{formatDate(subscription.currentPeriodStart)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#8A8377]">Current period end</p>
                  <p className="mt-1 text-sm text-[#1F1E1D]">{formatDate(subscription.currentPeriodEnd)}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-[#8A8377]">Dates are shown in your local time. If no end date is shown, billing is ongoing monthly.</p>
            </div>

            {/* Plans reference */}
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-[#1F1E1D]">Plans reference</h2>
              <p className="mt-1 text-xs text-[#8A8377]">Read-only overview from the ADNAVRA proposal. Contact ADNAVRA to change your plan. There is no self-serve upgrade button yet.</p>
              <div className="mt-4 grid md:grid-cols-3 gap-4">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`rounded-xl border p-5 flex flex-col ${plan.popular ? "border-[#1F1E1D] bg-[#795831] text-[#ffffff]" : "border-[#E9E1D3] bg-[#FBF7EF] text-[#1F1E1D]"}`}
                  >
                    {plan.popular && <span className="inline-flex w-fit rounded-full bg-[#9A7B4F] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#1F1E1D]">Most popular</span>}
                    <h3 className={`mt-2 text-sm font-semibold ${plan.popular ? "text-[#FAF7F2]" : "text-[#1F1E1D]"}`}>{plan.name}</h3>
                    <p className={`mt-1 text-lg font-semibold ${plan.popular ? "text-[#FAF7F2]" : "text-[#1F1E1D]"}`}>
                      {plan.price} <span className={`text-xs font-normal ${plan.popular ? "text-[#475467]" : "text-[#8A8377]"}`}>{plan.period}</span>
                    </p>
                    {subscription.plan === plan.id && (
                      <span className={`mt-2 inline-flex w-fit rounded-full px-2 py-1 text-[10px] font-semibold ${plan.popular ? "bg-[#FAF7F2] text-[#1F1E1D]" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>Current plan</span>
                    )}
                    <ul className="mt-4 space-y-2 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className={`flex items-start gap-1.5 text-xs ${plan.popular ? "text-[#475467]" : "text-[#8A8377]"}`}>
                          <Check className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${plan.popular ? "text-[#FAF7F2]" : "text-[#1F1E1D]"}`} /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-[#E9E1D3] bg-[#FBF7EF] p-4">
                <p className="text-sm font-semibold text-[#1F1E1D]">One-time setup fee: LKR 15,000</p>
                <p className="mt-1 text-xs leading-relaxed text-[#8A8377]">Covers full onboarding: business profile setup, service and pricing configuration, business hours, QR code generation, dashboard setup, and basic training. Charged once at onboarding, on top of your chosen monthly plan.</p>
                <p className="mt-3 text-xs font-medium text-[#1F1E1D]">To change your plan, contact ADNAVRA support.</p>
              </div>
            </div>
          </>
        ) : (
          <div className="mt-6 flex items-center gap-2 text-sm text-[#8A8377]">Loading...</div>
        )}
      </div>
    </div>
  );
}
