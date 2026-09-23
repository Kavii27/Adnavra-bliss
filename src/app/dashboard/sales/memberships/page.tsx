"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Store, Plus, Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId, lkr, formatDate } from "@/components/dashboard/use-business";

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
    return <div className="flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading memberships...</div>;
  }
  if (isNoBusiness || bizError) {
    return (
      <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe3] border border-[#e6dcc8]">
          <Store className="h-5 w-5 text-[#a89880]" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#3a2f22]">Set up your salon to sell memberships</h3>
        <p className="mt-1 text-sm text-[#a89880]">{bizError ?? "Create your business profile first."}</p>
        <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#faf6ef] hover:bg-white/90">Go to Settings</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#3a2f22]">Memberships sold</h1>
          <p className="text-sm text-[#a89880] mt-1">Recurring-revenue plans and who holds them. Sales also post to the ledger.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setFormError(null); setShowPlanForm(true); }} variant="secondaryDark">
            <Plus className="h-4 w-4 mr-2" /> New plan
          </Button>
          <Button onClick={() => { setFormError(null); setShowSellForm(true); }} disabled={catalog.length === 0} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">
            <Check className="h-4 w-4 mr-2" /> Record sale
          </Button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-full bg-[#f6efe3] border border-[#e6dcc8] p-1 w-fit">
        {(["sales", "catalog"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${tab === t ? "bg-[#8a6d4f] text-[#ffffff]" : "text-[#a89880] hover:text-[#3a2f22]"}`}
          >
            {t === "sales" ? `Sold (${sales.length})` : `Plans (${catalog.length})`}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {error}</div>
      ) : tab === "catalog" ? (
        catalog.length === 0 ? (
          <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center">
            <Crown className="h-6 w-6 text-[#a89880] mx-auto" />
            <p className="mt-2 text-sm text-[#a89880]">No membership plans yet. Define one, then record sales against it.</p>
            <Button onClick={() => setShowPlanForm(true)} className="mt-4 bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">New plan</Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {catalog.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-4">
                <div>
                  <p className="font-medium text-[#3a2f22] flex items-center gap-2">
                    {m.name}
                    {!m.isActive && <span className="rounded-full bg-[#f3ebdd] px-2 py-0.5 text-xs text-[#a89880]">Inactive</span>}
                  </p>
                  <p className="text-xs text-[#a89880] mt-1">{lkr(m.price)} · {m.durationDays} days</p>
                </div>
                <Button onClick={() => { setSellMembershipId(m.id); setFormError(null); setShowSellForm(true); }} variant="secondaryDark">Sell</Button>
              </div>
            ))}
          </div>
        )
      ) : sales.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center text-sm text-[#a89880]">
          No memberships sold yet. {catalog.length === 0 ? "Create a plan first." : "Record your first sale."}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-[#e6dcc8] bg-white/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[#a89880] border-b border-[#e6dcc8] bg-white/[0.02]">
                  <th className="px-4 py-3 font-medium">Membership</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium text-right">Paid</th>
                  <th className="px-4 py-3 font-medium">Valid until</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-[#3a2f22]">{s.membershipName}</td>
                    <td className="px-4 py-3 text-[#a89880]">{s.customer?.name ?? "Walk-in"}</td>
                    <td className="px-4 py-3 text-right text-[#3a2f22]">{lkr(s.pricePaid)}</td>
                    <td className="px-4 py-3 text-[#a89880] text-xs">{formatDate(s.endsAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-300" : "bg-[#f3ebdd] text-[#a89880]"}`}>{s.status}</span>
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
          <div className="bg-[#0F1729] rounded-xl border border-[#e6dcc8] p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[#3a2f22]">New membership plan</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Name *</label>
                <Input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="Monthly Glow Plan" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Price (LKR) *</label>
                  <Input value={planPrice} onChange={(e) => setPlanPrice(e.target.value)} type="number" min={0} className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Duration (days) *</label>
                  <Input value={planDays} onChange={(e) => setPlanDays(e.target.value)} type="number" min={1} className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]" />
                </div>
              </div>
              {formError && <p className="text-sm text-red-300 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghostDark" onClick={() => setShowPlanForm(false)}>Cancel</Button>
                <Button onClick={handleCreatePlan} disabled={submitting} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Create</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSellForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowSellForm(false)}>
          <div className="bg-[#0F1729] rounded-xl border border-[#e6dcc8] p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[#3a2f22]">Record membership sale</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Plan *</label>
                <select value={sellMembershipId} onChange={(e) => setSellMembershipId(e.target.value)} className="mt-1 w-full rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm text-[#3a2f22]">
                  <option value="" className="text-black">Choose a plan</option>
                  {catalog.filter((m) => m.isActive).map((m) => (
                    <option key={m.id} value={m.id} className="text-black">{m.name} · {lkr(m.price)} · {m.durationDays}d</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Customer name</label>
                <Input value={sellCustomerName} onChange={(e) => setSellCustomerName(e.target.value)} placeholder="Exact client name, or blank for walk-in" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
              {formError && <p className="text-sm text-red-300 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghostDark" onClick={() => setShowSellForm(false)}>Cancel</Button>
                <Button onClick={handleSell} disabled={submitting} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Record</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
