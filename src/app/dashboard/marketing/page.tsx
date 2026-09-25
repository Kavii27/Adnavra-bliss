"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Store, Plus, Check, Megaphone, Repeat, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId, lkr } from "@/components/dashboard/use-business";

type Promotion = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  percentOff: number | null;
  amountOff: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  isCampaign: boolean;
  repeatRule: string | null;
};

function discountLabel(p: Promotion): string {
  if (p.percentOff != null) return `${p.percentOff}% off`;
  if (p.amountOff != null) return `${lkr(p.amountOff)} off`;
  return "Offer";
}

export default function MarketingPage() {
  return (
    <PlanGate feature="promotions">
      <MarketingInner />
    </PlanGate>
  );
}

function MarketingInner() {
  const { businessId, loading: bizLoading, error: bizError, isNoBusiness } = useBusinessId();
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [priority, setPriority] = useState(false);
  const [savingPriority, setSavingPriority] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const [value, setValue] = useState("10");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isCampaign, setIsCampaign] = useState(false);
  const [repeatRule, setRepeatRule] = useState("monthly");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const [pR, sR] = await Promise.all([
        fetch(`/api/promotions?businessId=${businessId}&limit=50`),
        fetch(`/api/business-settings?businessId=${businessId}&key=marketing`).catch(() => null),
      ]);
      const pJ = await pR.json();
      if (!pR.ok) throw new Error(pJ.error ?? "Failed to load promotions");
      setPromos(pJ.data ?? []);
      if (sR?.ok) {
        const sJ = await sR.json();
        const row = Array.isArray(sJ.data) ? sJ.data[0] : null;
        const v = (row?.value ?? {}) as Record<string, unknown>;
        setPriority(v.priorityPlacement === true);
      }
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

  const offers = useMemo(() => promos.filter((p) => !p.isCampaign), [promos]);
  const campaigns = useMemo(() => promos.filter((p) => p.isCampaign), [promos]);

  async function handleSubmit() {
    if (!businessId) return;
    setFormError(null);
    if (!code.trim() || !title.trim()) {
      setFormError("Code and title are required");
      return;
    }
    const num = parseFloat(value);
    if (Number.isNaN(num) || num <= 0) {
      setFormError("Discount value must be greater than 0");
      return;
    }
    if (kind === "percent" && num > 90) {
      setFormError("Percentage discount maxes out at 90%");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          code: code.trim().toUpperCase(),
          title: title.trim(),
          percentOff: kind === "percent" ? Math.round(num) : null,
          amountOff: kind === "amount" ? num : null,
          startsAt: startsAt || null,
          endsAt: endsAt || null,
          isCampaign,
          repeatRule: isCampaign ? repeatRule : null,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error === "upgrade_required" ? "Scheduled campaigns need the Premium plan." : (j.error ?? "Create failed"));
      setShowForm(false);
      setCode("");
      setTitle("");
      setValue("10");
      setStartsAt("");
      setEndsAt("");
      setIsCampaign(false);
      await load();
    } catch (e: unknown) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(p: Promotion) {
    const r = await fetch(`/api/promotions?id=${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error ?? "Update failed");
      return;
    }
    await load();
  }

  async function handleDelete(p: Promotion) {
    if (!confirm(`Delete ${p.code}?`)) return;
    const r = await fetch(`/api/promotions?id=${p.id}`, { method: "DELETE" });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error ?? "Delete failed");
      return;
    }
    await load();
  }

  async function savePriority(next: boolean) {
    if (!businessId) return;
    setSavingPriority(true);
    try {
      const r = await fetch("/api/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, key: "marketing", value: { priorityPlacement: next } }),
      });
      const j = await r.json();
      if (!r.ok) {
        throw new Error(j.error === "upgrade_required" ? "Priority placement needs the Premium plan." : (j.error ?? "Save failed"));
      }
      setPriority(next);
    } catch (e: unknown) {
      alert((e as Error).message);
    } finally {
      setSavingPriority(false);
    }
  }

  if (bizLoading || (loading && businessId)) {
    return <div className="flex items-center gap-2 text-sm text-[#8A8377]"><Loader2 className="h-4 w-4 animate-spin" /> Loading marketing...</div>;
  }
  if (isNoBusiness || bizError) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E5DDD0] bg-white p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#FBF7EF] border border-[#E9E1D3]">
          <Store className="h-5 w-5 text-[#8A8377]" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#1F1E1D]">Set up your salon to run promotions</h3>
        <p className="mt-1 text-sm text-[#8A8377]">{bizError ?? "Create your business profile first."}</p>
        <Link href="/dashboard/settings" className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-[#1F1B17] px-6 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#795831]">Go to Settings</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#9A7B4F" }}>Marketing</p>
          <h1 className="font-[family-name:var(--font-display)] mt-1 text-3xl font-medium tracking-tight text-[#1F1B17]">Promotions</h1>
          <p className="text-sm text-[#8A8377] mt-1.5">Discount codes, recurring campaigns, and marketplace placement.</p>
        </div>
        <Button onClick={() => { setFormError(null); setShowForm(true); }} className="rounded-full bg-[#1F1B17] text-white hover:bg-[#795831]">
          <Plus className="h-4 w-4 mr-2" /> New offer
        </Button>
      </div>

      {error && <div className="mt-4 flex items-center gap-2 text-sm text-red-600"><AlertCircle className="h-4 w-4" /> {error}</div>}

      <div className="mt-6 rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-[#9A7B4F]" />
            <div>
              <p className="text-sm font-semibold text-[#1F1E1D]">Marketplace priority placement</p>
              <p className="text-xs text-[#8A8377]">Boosted salons rank first in customer search. Premium feature.</p>
            </div>
          </div>
          <PlanGate feature="campaigns">
            <button
              onClick={() => savePriority(!priority)}
              disabled={savingPriority}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${priority ? "bg-[#1F1B17] text-white" : "border border-[#E9E1D3] bg-[#FBF7EF] text-[#1F1E1D] hover:bg-[#F3EEE4]"}`}
            >
              {savingPriority ? "Saving..." : priority ? "Priority ON" : "Turn on priority"}
            </button>
          </PlanGate>
        </div>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-[#1F1E1D] flex items-center gap-2"><Megaphone className="h-4 w-4 text-[#8A8377]" /> Promotional offers ({offers.length})</h2>
      {offers.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)] p-6 text-center text-sm text-[#8A8377]">
          No offers yet. Create a discount code customers can mention when booking.
        </div>
      ) : (
        <div className="mt-3 grid gap-3">
          {offers.map((p) => (
            <PromoCard key={p.id} promo={p} onToggle={() => toggleActive(p)} onDelete={() => handleDelete(p)} />
          ))}
        </div>
      )}

      <h2 className="mt-8 text-sm font-semibold text-[#1F1E1D] flex items-center gap-2"><Repeat className="h-4 w-4 text-[#8A8377]" /> Scheduled campaigns ({campaigns.length}) <span className="rounded-full bg-[#1F1B17] px-2 py-0.5 text-[10px] font-bold text-white">PREMIUM</span></h2>
      <PlanGate feature="campaigns">
        {campaigns.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)] p-6 text-center text-sm text-[#8A8377]">
            No campaigns yet. Create an offer with “Recurring campaign” on to repeat it weekly or monthly.
          </div>
        ) : (
          <div className="mt-3 grid gap-3">
            {campaigns.map((p) => (
              <PromoCard key={p.id} promo={p} onToggle={() => toggleActive(p)} onDelete={() => handleDelete(p)} />
            ))}
          </div>
        )}
      </PlanGate>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl border border-[#E9E1D3] p-6 w-full max-w-lg shadow-xl max-h-[90dvh] overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[#1F1E1D]">New offer</h2>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#1F1E1D]">Code *</label>
                  <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="GLOW10" className="mt-1 bg-[#FBF7EF] border-[#E9E1D3] text-[#1F1E1D] placeholder:text-[#8A8377] font-mono" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1F1E1D]">Title *</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="10% off facials" className="mt-1 bg-[#FBF7EF] border-[#E9E1D3] text-[#1F1E1D] placeholder:text-[#8A8377]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#1F1E1D]">Discount type</label>
                  <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="mt-1 w-full rounded-md border border-[#E9E1D3] bg-[#FBF7EF] px-3 py-2 text-sm text-[#1F1E1D]">
                    <option value="percent" className="text-black">Percent %</option>
                    <option value="amount" className="text-black">Fixed LKR</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1F1E1D]">Value *</label>
                  <Input value={value} onChange={(e) => setValue(e.target.value)} type="number" min={1} className="mt-1 bg-[#FBF7EF] border-[#E9E1D3] text-[#1F1E1D]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#1F1E1D]">Starts</label>
                  <Input value={startsAt} onChange={(e) => setStartsAt(e.target.value)} type="date" className="mt-1 bg-[#FBF7EF] border-[#E9E1D3] text-[#1F1E1D]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1F1E1D]">Ends</label>
                  <Input value={endsAt} onChange={(e) => setEndsAt(e.target.value)} type="date" className="mt-1 bg-[#FBF7EF] border-[#E9E1D3] text-[#1F1E1D]" />
                </div>
              </div>
              <label className="flex items-start gap-3 text-sm rounded-lg border border-[#E9E1D3] bg-[#FBF7EF] p-3">
                <input type="checkbox" checked={isCampaign} onChange={(e) => setIsCampaign(e.target.checked)} className="mt-1 accent-[#1F1B17]" />
                <span>
                  <span className="font-medium text-[#1F1E1D]">Recurring campaign <span className="rounded-full bg-[#1F1B17] px-1.5 py-0.5 text-[10px] font-bold text-white ml-1">PREMIUM</span></span>
                  <span className="block text-xs text-[#8A8377]">Repeat this offer on a schedule instead of running it once.</span>
                </span>
              </label>
              {isCampaign && (
                <div>
                  <label className="text-sm font-medium text-[#1F1E1D]">Repeats</label>
                  <select value={repeatRule} onChange={(e) => setRepeatRule(e.target.value)} className="mt-1 w-full rounded-md border border-[#E9E1D3] bg-[#FBF7EF] px-3 py-2 text-sm text-[#1F1E1D]">
                    <option value="weekly" className="text-black">Weekly</option>
                    <option value="monthly" className="text-black">Monthly</option>
                  </select>
                </div>
              )}
              {formError && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghostDark" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="rounded-full bg-[#1F1B17] text-white hover:bg-[#795831]">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Create</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PromoCard({ promo: p, onToggle, onDelete }: { promo: Promotion; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-[#1F1E1D] flex items-center gap-2 flex-wrap">
            <span className="font-mono rounded-md bg-[#795831]/15 px-2 py-0.5 text-sm">{p.code}</span>
            <span className="truncate">{p.title}</span>
            {!p.isActive && <span className="rounded-full bg-[#F3EEE4] px-2 py-0.5 text-xs text-[#8A8377]">Paused</span>}
          </p>
          <p className="text-xs text-[#8A8377] mt-1">
            {discountLabel(p)}
            {p.isCampaign && p.repeatRule ? ` · repeats ${p.repeatRule}` : ""}
            {p.startsAt || p.endsAt ? ` · ${p.startsAt ? new Date(p.startsAt).toLocaleDateString("en-GB") : "…"} → ${p.endsAt ? new Date(p.endsAt).toLocaleDateString("en-GB") : "…"}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onToggle} className="rounded-md border border-[#E9E1D3] bg-[#FBF7EF] px-3 py-1.5 text-xs font-medium text-[#8A8377] hover:bg-[#F3EEE4] hover:text-[#1F1E1D]">
            {p.isActive ? "Pause" : "Resume"}
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg border border-[#E9E1D3] bg-[#FBF7EF] hover:bg-red-50" aria-label="Delete offer">
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
