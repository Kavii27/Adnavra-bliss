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
    return <div className="flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading marketing...</div>;
  }
  if (isNoBusiness || bizError) {
    return (
      <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe3] border border-[#e6dcc8]">
          <Store className="h-5 w-5 text-[#a89880]" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#3a2f22]">Set up your salon to run promotions</h3>
        <p className="mt-1 text-sm text-[#a89880]">{bizError ?? "Create your business profile first."}</p>
        <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#faf6ef] hover:bg-white/90">Go to Settings</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#3a2f22]">Marketing</h1>
          <p className="text-sm text-[#a89880] mt-1">Discount codes, recurring campaigns, and marketplace placement.</p>
        </div>
        <Button onClick={() => { setFormError(null); setShowForm(true); }} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">
          <Plus className="h-4 w-4 mr-2" /> New offer
        </Button>
      </div>

      {error && <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {error}</div>}

      <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-[#c9a26d]" />
            <div>
              <p className="text-sm font-semibold text-[#3a2f22]">Marketplace priority placement</p>
              <p className="text-xs text-[#a89880]">Boosted salons rank first in customer search. Premium feature.</p>
            </div>
          </div>
          <PlanGate feature="campaigns">
            <button
              onClick={() => savePriority(!priority)}
              disabled={savingPriority}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${priority ? "bg-[#8a6d4f] text-[#ffffff]" : "border border-[#e6dcc8] bg-[#faf6ef] text-[#3a2f22] hover:bg-[#f3ebdd]"}`}
            >
              {savingPriority ? "Saving..." : priority ? "Priority ON" : "Turn on priority"}
            </button>
          </PlanGate>
        </div>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-[#3a2f22] flex items-center gap-2"><Megaphone className="h-4 w-4 text-[#a89880]" /> Promotional offers ({offers.length})</h2>
      {offers.length === 0 ? (
        <div className="mt-3 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-6 text-center text-sm text-[#a89880]">
          No offers yet. Create a discount code customers can mention when booking.
        </div>
      ) : (
        <div className="mt-3 grid gap-3">
          {offers.map((p) => (
            <PromoCard key={p.id} promo={p} onToggle={() => toggleActive(p)} onDelete={() => handleDelete(p)} />
          ))}
        </div>
      )}

      <h2 className="mt-8 text-sm font-semibold text-[#3a2f22] flex items-center gap-2"><Repeat className="h-4 w-4 text-[#a89880]" /> Scheduled campaigns ({campaigns.length}) <span className="rounded-full bg-[#8a6d4f] px-2 py-0.5 text-[10px] font-bold text-white">PREMIUM</span></h2>
      <PlanGate feature="campaigns">
        {campaigns.length === 0 ? (
          <div className="mt-3 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-6 text-center text-sm text-[#a89880]">
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
          <div className="bg-[#0F1729] rounded-xl border border-[#e6dcc8] p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[#3a2f22]">New offer</h2>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Code *</label>
                  <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="GLOW10" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880] font-mono" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Title *</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="10% off facials" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Discount type</label>
                  <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="mt-1 w-full rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm text-[#3a2f22]">
                    <option value="percent" className="text-black">Percent %</option>
                    <option value="amount" className="text-black">Fixed LKR</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Value *</label>
                  <Input value={value} onChange={(e) => setValue(e.target.value)} type="number" min={1} className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Starts</label>
                  <Input value={startsAt} onChange={(e) => setStartsAt(e.target.value)} type="date" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Ends</label>
                  <Input value={endsAt} onChange={(e) => setEndsAt(e.target.value)} type="date" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]" />
                </div>
              </div>
              <label className="flex items-start gap-3 text-sm rounded-lg border border-[#e6dcc8] bg-[#f6efe3] p-3">
                <input type="checkbox" checked={isCampaign} onChange={(e) => setIsCampaign(e.target.checked)} className="mt-1 accent-white" />
                <span>
                  <span className="font-medium text-[#3a2f22]">Recurring campaign <span className="rounded-full bg-[#8a6d4f] px-1.5 py-0.5 text-[10px] font-bold text-white ml-1">PREMIUM</span></span>
                  <span className="block text-xs text-[#a89880]">Repeat this offer on a schedule instead of running it once.</span>
                </span>
              </label>
              {isCampaign && (
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Repeats</label>
                  <select value={repeatRule} onChange={(e) => setRepeatRule(e.target.value)} className="mt-1 w-full rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm text-[#3a2f22]">
                    <option value="weekly" className="text-black">Weekly</option>
                    <option value="monthly" className="text-black">Monthly</option>
                  </select>
                </div>
              )}
              {formError && <p className="text-sm text-red-300 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghostDark" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Create</>}</Button>
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
    <div className="rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-[#3a2f22] flex items-center gap-2 flex-wrap">
            <span className="font-mono rounded-md bg-[#8a6d4f]/15 px-2 py-0.5 text-sm">{p.code}</span>
            <span className="truncate">{p.title}</span>
            {!p.isActive && <span className="rounded-full bg-[#f3ebdd] px-2 py-0.5 text-xs text-[#a89880]">Paused</span>}
          </p>
          <p className="text-xs text-[#a89880] mt-1">
            {discountLabel(p)}
            {p.isCampaign && p.repeatRule ? ` · repeats ${p.repeatRule}` : ""}
            {p.startsAt || p.endsAt ? ` · ${p.startsAt ? new Date(p.startsAt).toLocaleDateString("en-GB") : "…"} → ${p.endsAt ? new Date(p.endsAt).toLocaleDateString("en-GB") : "…"}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onToggle} className="rounded-md border border-[#e6dcc8] bg-[#faf6ef] px-3 py-1.5 text-xs font-medium text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]">
            {p.isActive ? "Pause" : "Resume"}
          </button>
          <button onClick={onDelete} className="p-2 rounded-lg border border-[#e6dcc8] bg-[#faf6ef] hover:bg-red-500/20" aria-label="Delete offer">
            <Trash2 className="h-4 w-4 text-red-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
