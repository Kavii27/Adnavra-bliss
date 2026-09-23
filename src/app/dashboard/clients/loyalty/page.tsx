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
    return <div className="flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading loyalty...</div>;
  }
  if (isNoBusiness || bizError) {
    return (
      <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe3] border border-[#e6dcc8]">
          <Store className="h-5 w-5 text-[#a89880]" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#3a2f22]">Set up your salon to reward regulars</h3>
        <p className="mt-1 text-sm text-[#a89880]">{bizError ?? "Create your business profile first."}</p>
        <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#faf6ef] hover:bg-white/90">Go to Settings</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#3a2f22]">Client loyalty</h1>
          <p className="text-sm text-[#a89880] mt-1">Reward repeat visits. Points and visits accrue per customer.</p>
        </div>
        <Button onClick={() => { setFormError(null); setShowEnroll(true); }} disabled={unenrolled.length === 0} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">
          <Plus className="h-4 w-4 mr-2" /> Enroll client
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-4">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#3a2f22]"><Settings2 className="h-4 w-4 text-[#a89880]" /> Reward rule:</span>
        <label className="flex items-center gap-2 text-sm text-[#a89880]">
          Every
          <Input value={String(visitsPerReward)} onChange={(e) => setVisitsPerReward(Math.max(1, parseInt(e.target.value, 10) || 1))} type="number" min={1} max={100} className="w-20 bg-[#faf6ef] border-[#e6dcc8] text-[#3a2f22]" />
          visits = 1 reward
        </label>
        <Button onClick={saveRule} disabled={savingRule} variant="secondaryDark">
          {savingRule ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : "Save rule"}
        </Button>
      </div>

      {error ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {error}</div>
      ) : accounts.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center">
          <HeartHandshake className="h-6 w-6 text-[#a89880] mx-auto" />
          <p className="mt-2 text-sm text-[#a89880]">Nobody enrolled yet. Enroll a client, then stamp visits and points as they come back.</p>
          {unenrolled.length > 0 && <Button onClick={() => setShowEnroll(true)} className="mt-4 bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">Enroll client</Button>}
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-[#e6dcc8] bg-white/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[#a89880] border-b border-[#e6dcc8] bg-white/[0.02]">
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium text-right">Visits</th>
                  <th className="px-4 py-3 font-medium text-right">Points</th>
                  <th className="px-4 py-3 font-medium text-right">Rewards earned</th>
                  <th className="px-4 py-3 font-medium text-right">Rewards redeemed</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {accounts.map((a) => {
                  const earned = Math.floor(a.visits / visitsPerReward);
                  const available = Math.max(0, earned - a.rewardsRedeemed);
                  return (
                    <tr key={a.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-medium text-[#3a2f22]">{a.customer.name}</td>
                      <td className="px-4 py-3 text-right text-[#3a2f22]">{a.visits}</td>
                      <td className="px-4 py-3 text-right text-[#3a2f22]">{a.points}</td>
                      <td className="px-4 py-3 text-right text-[#a89880]">{earned}</td>
                      <td className="px-4 py-3 text-right text-[#a89880]">{a.rewardsRedeemed}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-wrap justify-end gap-1.5">
                          <button onClick={() => adjust(a.id, { visitsDelta: 1, pointsDelta: 1 })} className="rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-2.5 py-1.5 text-xs font-medium text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]">+1 visit</button>
                          <button onClick={() => adjust(a.id, { pointsDelta: 5 })} className="rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-2.5 py-1.5 text-xs font-medium text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]">+5 pts</button>
                          <button onClick={() => adjust(a.id, { rewardsRedeemedDelta: 1 })} disabled={available <= 0} className="rounded-md bg-[#8a6d4f] px-2.5 py-1.5 text-xs font-semibold text-[#ffffff] hover:bg-white/90 disabled:opacity-40">Redeem</button>
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
          <div className="bg-[#0F1729] rounded-xl border border-[#e6dcc8] p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[#3a2f22]">Enroll client</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Client *</label>
                <select value={enrollId} onChange={(e) => setEnrollId(e.target.value)} className="mt-1 w-full rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm text-[#3a2f22]">
                  <option value="" className="text-black">Choose a client</option>
                  {unenrolled.map((c) => (
                    <option key={c.id} value={c.id} className="text-black">{c.name}</option>
                  ))}
                </select>
              </div>
              {formError && <p className="text-sm text-red-300 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghostDark" onClick={() => setShowEnroll(false)}>Cancel</Button>
                <Button onClick={handleEnroll} disabled={submitting || !enrollId} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Enrolling...</> : <><Check className="h-4 w-4 mr-2" /> Enroll</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
