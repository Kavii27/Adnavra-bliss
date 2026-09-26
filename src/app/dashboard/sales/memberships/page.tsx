"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Store, Plus, Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId, lkr, formatDate } from "@/components/dashboard/use-business";
import { StyledNativeSelect } from "@/components/ui/select";

type Membership = { id: string; name: string; price: number; durationDays: number; isActive: boolean };
type MembershipSale = {
  id: string;
  membershipName: string;
  pricePaid: number;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  startsAt: string;
  endsAt: string | null;
  customer: { id: string; name: string } | null;
};

export default function MembershipsPage() {
  return (
    <PlanGate feature="membershipsSold">
      <MembershipsInner />
    </PlanGate>
  );
}

function MembershipsInner() {
  const { businessId, loading: bizLoading, error: bizError, isNoBusiness } = useBusinessId();
  const [catalog, setCatalog] = useState<Membership[]>([]);
  const [sales, setSales] = useState<MembershipSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"sales" | "catalog">("sales");

  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planPrice, setPlanPrice] = useState("12000");
  const [planDays, setPlanDays] = useState("30");
  const [showSellForm, setShowSellForm] = useState(false);
  const [sellMembershipId, setSellMembershipId] = useState("");
  const [sellCustomerName, setSellCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const [cR, sR] = await Promise.all([
        fetch(`/api/memberships?businessId=${businessId}&view=catalog&limit=50`),
        fetch(`/api/memberships?businessId=${businessId}&view=sales&limit=50`),
      ]);
      const cJ = await cR.json();
      const sJ = await sR.json();
      if (!cR.ok) throw new Error(cJ.error ?? "Failed to load memberships");
      if (!sR.ok) throw new Error(sJ.error ?? "Failed to load membership sales");
      setCatalog(cJ.data ?? []);
      setSales(sJ.data ?? []);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (businessId) load();
    else if (!bizLoading) setLoading(false);
  }, [businessId, bizLoading, load]);

  async function handleCreatePlan() {
    if (!businessId) return;
    setFormError(null);
    if (!planName.trim()) {
      setFormError("Name is required");
      return;
    }
    const price = parseFloat(planPrice);
    const days = parseInt(planDays, 10);
    if (Number.isNaN(price) || price < 0) {
      setFormError("Price must be >= 0");
      return;
    }
    if (Number.isNaN(days) || days < 1) {
      setFormError("Duration must be at least 1 day");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/memberships?view=catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, name: planName.trim(), price, durationDays: days }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Create failed");
      setShowPlanForm(false);
      setPlanName("");
      await load();
    } catch (e: unknown) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSell() {
    if (!businessId) return;
    setFormError(null);
    const plan = catalog.find((m) => m.id === sellMembershipId);
    if (!plan) {
      setFormError("Choose a membership plan");
      return;
    }
    setSubmitting(true);
    try {
      // Resolve customer by name via the existing customers API (staff-assisted sale).
      let customerId: string | null = null;
      if (sellCustomerName.trim()) {
        const cR = await fetch(`/api/customers?limit=100`);
        const cJ = await cR.json();
        if (cR.ok && Array.isArray(cJ.data)) {
          const match = (cJ.data as { id: string; name: string }[]).find(
            (c) => c.name.toLowerCase() === sellCustomerName.trim().toLowerCase(),
          );
          customerId = match?.id ?? null;
        }
      }
      const startsAt = new Date();
      const endsAt = new Date(startsAt.getTime() + plan.durationDays * 86400000);
      const r = await fetch("/api/memberships?view=sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          membershipId: plan.id,
          customerId,
          pricePaid: plan.price / 100,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Sale failed");
      setShowSellForm(false);
      setSellMembershipId("");
      setSellCustomerName("");
      setTab("sales");
      await load();
    } catch (e: unknown) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (bizLoading || (loading && businessId)) {
    return <div className="flex items-center gap-2 text-sm text-[#8A8377]"><Loader2 className="h-4 w-4 animate-spin" /> Loading memberships...</div>;
  }
  if (isNoBusiness || bizError) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E5DDD0] bg-white p-10 text-center">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "linear-gradient(135deg, #D9BE8C, #C9A467)" }}
        >
          <Store className="h-6 w-6 text-[#1B1714]" />
        </div>
        <h3 className="font-[family-name:var(--font-display)] mt-5 text-xl font-semibold text-[#1F1B17]">Set up your salon to sell memberships</h3>
        <p className="mt-1.5 text-sm text-[#8A8377]">{bizError ?? "Create your business profile first."}</p>
        <Link
          href="/dashboard/settings"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#1F1B17] px-7 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#795831]"
        >
          Go to Settings
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9A7B4F]">Sales</p>
          <h1 className="font-[family-name:var(--font-display)] mt-1 text-3xl font-medium tracking-tight text-[#1F1B17]">Memberships sold</h1>
          <p className="text-sm text-[#8A8377] mt-1.5">Recurring-revenue plans and who holds them. Sales also post to the ledger.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setFormError(null); setShowPlanForm(true); }} variant="secondaryDark" className="rounded-full">
            <Plus className="h-4 w-4 mr-2" /> New plan
          </Button>
          <Button onClick={() => { setFormError(null); setShowSellForm(true); }} disabled={catalog.length === 0} className="rounded-full bg-[#1F1B17] text-white hover:bg-[#795831]">
            <Check className="h-4 w-4 mr-2" /> Record sale
          </Button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-full bg-white border border-[#E9E1D3] p-1 w-fit shadow-[0_2px_12px_rgba(30,28,26,0.04)]">
        {(["sales", "catalog"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${tab === t ? "bg-[#1F1B17] text-white" : "text-[#8A8377] hover:text-[#1F1E1D]"}`}
          >
            {t === "sales" ? `Sold (${sales.length})` : `Plans (${catalog.length})`}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#FDECEC] bg-[#FDECEC] px-4 py-3 text-sm text-[#B91C1C]"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</div>
      ) : tab === "catalog" ? (
        catalog.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[#E5DDD0] bg-white p-10 text-center">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "linear-gradient(135deg, #D9BE8C, #C9A467)" }}
            >
              <Crown className="h-6 w-6 text-[#1B1714]" />
            </div>
            <p className="mt-4 text-sm text-[#4A4640]">No membership plans yet. Define one, then record sales against it.</p>
            <Button onClick={() => setShowPlanForm(true)} className="mt-4 rounded-full bg-[#1F1B17] text-white hover:bg-[#795831]">New plan</Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {catalog.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-2xl border border-[#E9E1D3] bg-white p-4 shadow-[0_2px_12px_rgba(30,28,26,0.04)]">
                <div>
                  <p className="font-medium text-[#1F1E1D] flex items-center gap-2">
                    {m.name}
                    {!m.isActive && <span className="rounded-full bg-[#FBF7EF] px-2 py-0.5 text-xs text-[#8A8377]">Inactive</span>}
                  </p>
                  <p className="text-xs text-[#8A8377] mt-1">{lkr(m.price)} · {m.durationDays} days</p>
                </div>
                <Button onClick={() => { setSellMembershipId(m.id); setFormError(null); setShowSellForm(true); }} variant="secondaryDark" className="rounded-full">Sell</Button>
              </div>
            ))}
          </div>
        )
      ) : sales.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#E5DDD0] bg-white p-10 text-center text-sm text-[#8A8377]">
          No memberships sold yet. {catalog.length === 0 ? "Create a plan first." : "Record your first sale."}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[#8A8377] border-b border-[#E9E1D3] bg-[#FBF7EF]">
                  <th className="px-4 py-3 font-medium">Membership</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium text-right">Paid</th>
                  <th className="px-4 py-3 font-medium">Valid until</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EEE4]">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FBF7EF]/60">
                    <td className="px-4 py-3 font-medium text-[#1F1E1D]">{s.membershipName}</td>
                    <td className="px-4 py-3 text-[#8A8377]">{s.customer?.name ?? "Walk-in"}</td>
                    <td className="px-4 py-3 text-right text-[#1F1E1D]">{lkr(s.pricePaid)}</td>
                    <td className="px-4 py-3 text-[#8A8377] text-xs">{formatDate(s.endsAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-300" : "bg-[#FBF7EF] text-[#8A8377]"}`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPlanForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowPlanForm(false)}>
          <div className="bg-white rounded-2xl border border-[#E9E1D3] p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#1F1B17]">New membership plan</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#1F1E1D]">Name *</label>
                <Input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="Monthly Glow Plan" className="mt-1 bg-[#FBF7EF] border-[#E9E1D3] text-[#1F1E1D] placeholder:text-[#8A8377]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#1F1E1D]">Price (LKR) *</label>
                  <Input value={planPrice} onChange={(e) => setPlanPrice(e.target.value)} type="number" min={0} className="mt-1 bg-[#FBF7EF] border-[#E9E1D3] text-[#1F1E1D]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1F1E1D]">Duration (days) *</label>
                  <Input value={planDays} onChange={(e) => setPlanDays(e.target.value)} type="number" min={1} className="mt-1 bg-[#FBF7EF] border-[#E9E1D3] text-[#1F1E1D]" />
                </div>
              </div>
              {formError && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghostDark" onClick={() => setShowPlanForm(false)}>Cancel</Button>
                <Button onClick={handleCreatePlan} disabled={submitting} className="rounded-full bg-[#1F1B17] text-white hover:bg-[#795831]">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Create</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSellForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowSellForm(false)}>
          <div className="bg-white rounded-2xl border border-[#E9E1D3] p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#1F1B17]">Record membership sale</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#1F1E1D]">Plan *</label>
                <StyledNativeSelect aria-label="Plan" value={sellMembershipId} onChange={(e) => setSellMembershipId(e.target.value)} wrapperClassName="mt-1 w-full" className="w-full">
                  <option value="">Choose a plan</option>
                  {catalog.filter((m) => m.isActive).map((m) => (
                    <option key={m.id} value={m.id}>{m.name} · {lkr(m.price)} · {m.durationDays}d</option>
                  ))}
                </StyledNativeSelect>
              </div>
              <div>
                <label className="text-sm font-medium text-[#1F1E1D]">Customer name</label>
                <Input value={sellCustomerName} onChange={(e) => setSellCustomerName(e.target.value)} placeholder="Exact client name, or blank for walk-in" className="mt-1 bg-[#FBF7EF] border-[#E9E1D3] text-[#1F1E1D] placeholder:text-[#8A8377]" />
              </div>
              {formError && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghostDark" onClick={() => setShowSellForm(false)}>Cancel</Button>
                <Button onClick={handleSell} disabled={submitting} className="rounded-full bg-[#1F1B17] text-white hover:bg-[#795831]">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Record</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
