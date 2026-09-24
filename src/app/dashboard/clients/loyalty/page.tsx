"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Store, Plus, Check, HeartHandshake, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId } from "@/components/dashboard/use-business";

type LoyaltyAccount = {
  id: string;
  points: number;
  visits: number;
  rewardsRedeemed: number;
  customer: { id: string; name: string; email: string | null; phone: string | null };
};

export default function LoyaltyPage() {
  return (
    <PlanGate feature="loyaltyProgram">
      <LoyaltyInner />
    </PlanGate>
  );
}

function LoyaltyInner() {
  const { businessId, loading: bizLoading, error: bizError, isNoBusiness } = useBusinessId();
  const [accounts, setAccounts] = useState<LoyaltyAccount[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [visitsPerReward, setVisitsPerReward] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingRule, setSavingRule] = useState(false);

  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollId, setEnrollId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const [lR, cR, sR] = await Promise.all([
        fetch(`/api/loyalty?businessId=${businessId}&limit=50`),
        fetch(`/api/customers?limit=200`),
        fetch(`/api/business-settings?businessId=${businessId}&key=loyalty`).catch(() => null),
      ]);
      const lJ = await lR.json();
      if (!lR.ok) throw new Error(lJ.error ?? "Failed to load loyalty accounts");
      setAccounts(lJ.data ?? []);
      if (cR?.ok) {
        const cJ = await cR.json();
        if (Array.isArray(cJ.data)) setCustomers(cJ.data);
      }
      if (sR?.ok) {
        const sJ = await sR.json();
        const row = Array.isArray(sJ.data) ? sJ.data[0] : null;
        const v = (row?.value ?? {}) as Record<string, unknown>;
        if (typeof v.visitsPerReward === "number" && v.visitsPerReward >= 1) {
          setVisitsPerReward(Math.floor(v.visitsPerReward));
        }
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

  async function handleEnroll() {
    if (!businessId || !enrollId) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const r = await fetch("/api/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, customerId: enrollId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Enroll failed");
      setShowEnroll(false);
      setEnrollId("");
      await load();
    } catch (e: unknown) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function adjust(id: string, patch: { pointsDelta?: number; visitsDelta?: number; rewardsRedeemedDelta?: number }) {
    const r = await fetch(`/api/loyalty?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error ?? "Update failed");
      return;
    }
    await load();
  }

  async function saveRule() {
    if (!businessId || visitsPerReward < 1) return;
    setSavingRule(true);
    try {
      const r = await fetch("/api/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, key: "loyalty", value: { visitsPerReward } }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Save failed");
    } catch (e: unknown) {
      alert((e as Error).message);
    } finally {
      setSavingRule(false);
    }
  }

  const unenrolled = customers.filter((c) => !accounts.some((a) => a.customer.id === c.id));

  if (bizLoading || (loading && businessId)) {
    return <div className="flex items-center gap-2 text-sm text-[#8A8377]"><Loader2 className="h-4 w-4 animate-spin" /> Loading loyalty...</div>;
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
        <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold text-[#1F1B17]">Set up your salon to reward regulars</h3>
        <p className="mt-1.5 text-sm text-[#8A8377]">{bizError ?? "Create your business profile first."}</p>
        <Link href="/dashboard/settings" className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#1F1B17] px-7 text-[12px] font-bold uppercase tracking-[0.14em] text-white hover:bg-[#795831]">Go to Settings</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#9A7B4F" }}>Clients</p>
          <h1 className="font-[family-name:var(--font-display)] mt-1 text-3xl font-medium tracking-tight text-[#1F1B17]">Client loyalty</h1>
          <p className="text-sm text-[#8A8377] mt-1.5">Reward repeat visits. Points and visits accrue per customer.</p>
        </div>
        <button
          onClick={() => { setFormError(null); setShowEnroll(true); }}
          disabled={unenrolled.length === 0}
          className="inline-flex items-center rounded-full bg-[#1F1B17] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#795831] disabled:opacity-40"
        >
          <Plus className="h-4 w-4 mr-2" /> Enroll client
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#E9E1D3] bg-white p-4 shadow-[0_4px_20px_rgba(30,28,26,0.05)]">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1F1E1D]"><Settings2 className="h-4 w-4 text-[#8A8377]" /> Reward rule:</span>
        <label className="flex items-center gap-2 text-sm text-[#8A8377]">
          Every
          <Input value={String(visitsPerReward)} onChange={(e) => setVisitsPerReward(Math.max(1, parseInt(e.target.value, 10) || 1))} type="number" min={1} max={100} className="w-20 bg-[#FBF7EF] border-[#E9E1D3] text-[#1F1E1D]" />
          visits = 1 reward
        </label>
        <button onClick={saveRule} disabled={savingRule} className="rounded-full border border-[#E5DDD0] bg-white px-4 py-2 text-sm font-medium text-[#1F1E1D] hover:bg-[#FBF7EF] disabled:opacity-40 shadow-sm">
          {savingRule ? <><Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> Saving...</> : "Save rule"}
        </button>
      </div>

      {error ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-500"><AlertCircle className="h-4 w-4" /> {error}</div>
      ) : accounts.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#E5DDD0] bg-white p-10 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, #D9BE8C, #C9A467)" }}
          >
            <HeartHandshake className="h-6 w-6 text-[#1B1714]" />
          </div>
          <p className="mt-4 text-sm text-[#8A8377]">Nobody enrolled yet. Enroll a client, then stamp visits and points as they come back.</p>
          {unenrolled.length > 0 && <button onClick={() => setShowEnroll(true)} className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#1F1B17] px-7 text-[12px] font-bold uppercase tracking-[0.14em] text-white hover:bg-[#795831]">Enroll client</button>}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[#8A8377] border-b border-[#E9E1D3] bg-[#FBF7EF]">
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium text-right">Visits</th>
                  <th className="px-4 py-3 font-medium text-right">Points</th>
                  <th className="px-4 py-3 font-medium text-right">Rewards earned</th>
                  <th className="px-4 py-3 font-medium text-right">Rewards redeemed</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E1D3]">
                {accounts.map((a) => {
                  const earned = Math.floor(a.visits / visitsPerReward);
                  const available = Math.max(0, earned - a.rewardsRedeemed);
                  return (
                    <tr key={a.id} className="hover:bg-[#FBF7EF]">
                      <td className="px-4 py-3 font-medium text-[#1F1E1D]">{a.customer.name}</td>
                      <td className="px-4 py-3 text-right text-[#1F1E1D]">{a.visits}</td>
                      <td className="px-4 py-3 text-right text-[#1F1E1D]">{a.points}</td>
                      <td className="px-4 py-3 text-right text-[#8A8377]">{earned}</td>
                      <td className="px-4 py-3 text-right text-[#8A8377]">{a.rewardsRedeemed}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-wrap justify-end gap-1.5">
                          <button onClick={() => adjust(a.id, { visitsDelta: 1, pointsDelta: 1 })} className="rounded-md border border-[#E9E1D3] bg-white px-2.5 py-1.5 text-xs font-medium text-[#8A8377] hover:bg-[#FBF7EF] hover:text-[#1F1E1D]">+1 visit</button>
                          <button onClick={() => adjust(a.id, { pointsDelta: 5 })} className="rounded-md border border-[#E9E1D3] bg-white px-2.5 py-1.5 text-xs font-medium text-[#8A8377] hover:bg-[#FBF7EF] hover:text-[#1F1E1D]">+5 pts</button>
                          <button onClick={() => adjust(a.id, { rewardsRedeemedDelta: 1 })} disabled={available <= 0} className="rounded-md bg-[#1F1B17] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#795831] disabled:opacity-40">Redeem</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showEnroll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowEnroll(false)}>
          <div className="bg-white rounded-2xl border border-[#E9E1D3] p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[#1F1E1D]">Enroll client</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#1F1E1D]">Client *</label>
                <select value={enrollId} onChange={(e) => setEnrollId(e.target.value)} className="mt-1 w-full rounded-md border border-[#E9E1D3] bg-[#FBF7EF] px-3 py-2 text-sm text-[#1F1E1D]">
                  <option value="" className="text-black">Choose a client</option>
                  {unenrolled.map((c) => (
                    <option key={c.id} value={c.id} className="text-black">{c.name}</option>
                  ))}
                </select>
              </div>
              {formError && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowEnroll(false)} className="inline-flex items-center rounded-full border border-[#E5DDD0] bg-white px-4 py-2 text-sm font-medium text-[#4A4640] hover:bg-[#FBF7EF]">Cancel</button>
                <Button onClick={handleEnroll} disabled={submitting || !enrollId} className="bg-[#1F1B17] text-white hover:bg-[#795831]">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enrolling...</> : <><Check className="h-4 w-4 mr-2" /> Enroll</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
