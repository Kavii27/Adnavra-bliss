"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, Check, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId } from "@/components/dashboard/use-business";

const DEFAULTS = {
  manualCollection: true,
  bankDetails: "",
  currency: "LKR",
};

export default function PaymentsSettingsPage() {
  return (
    <PlanGate feature="paymentSettings">
      <PaymentsSettingsInner />
    </PlanGate>
  );
}

function PaymentsSettingsInner() {
  const { businessId, loading: bizLoading, error: bizError } = useBusinessId();
  const [manualCollection, setManualCollection] = useState(DEFAULTS.manualCollection);
  const [bankDetails, setBankDetails] = useState(DEFAULTS.bankDetails);
  const [currency, setCurrency] = useState(DEFAULTS.currency);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/business-settings?businessId=${businessId}&key=payments`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed to load settings");
      const row = Array.isArray(j.data) ? j.data[0] : null;
      const v = (row?.value ?? {}) as Partial<typeof DEFAULTS>;
      if (typeof v.manualCollection === "boolean") setManualCollection(v.manualCollection);
      if (typeof v.bankDetails === "string") setBankDetails(v.bankDetails);
      if (typeof v.currency === "string") setCurrency(v.currency);
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

  async function save() {
    if (!businessId) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const r = await fetch("/api/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, key: "payments", value: { manualCollection, bankDetails, currency, provider: "none" } }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Save failed");
      setSaved(true);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (bizLoading || loading) {
    return <div className="flex items-center gap-2 text-sm text-[#8A8377]"><Loader2 className="h-4 w-4 animate-spin" /> Loading payment settings...</div>;
  }

  return (
    <div className="bg-[#FAF7F2] min-h-full px-6 py-8">
      <div className="max-w-2xl">
        <Link href="/dashboard/settings" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8A8377] hover:text-[#1F1E1D] mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Settings
        </Link>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#9A7B4F" }}>
          Settings
        </p>
        <h1 className="font-[family-name:var(--font-display)] mt-0.5 text-2xl font-medium tracking-tight text-[#1F1B17]">Payment settings</h1>
        <p className="mt-1 text-sm text-[#8A8377]">How you collect money. Online gateway integration is pending a provider decision.</p>

        {bizError ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-700"><AlertCircle className="h-4 w-4" /> {bizError}</div>
        ) : (
          <>
            <div className="mt-6 rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)] p-5">
              <h2 className="text-sm font-semibold text-[#1F1E1D] flex items-center gap-2"><Landmark className="h-4 w-4 text-[#8A8377]" /> In-person collection</h2>
              <label className="mt-3 flex items-start gap-3 text-sm">
                <input type="checkbox" checked={manualCollection} onChange={(e) => setManualCollection(e.target.checked)} className="mt-1 accent-[#795831]" />
                <span>
                  <span className="font-medium text-[#1F1E1D]">Collect in person (cash / bank transfer)</span>
                  <span className="block text-xs text-[#8A8377]">Payments recorded in Sales → Payments are treated as collected revenue.</span>
                </span>
              </label>
              <div className="mt-3">
                <label className="text-sm font-medium text-[#1F1E1D]">Bank details shown on receipts</label>
                <Input value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} placeholder="Bank, account name, account number" className="mt-1 bg-[#FAF7F2] border-[#E9E1D3] text-[#1F1E1D] placeholder:text-[#8A8377]" />
              </div>
              <div className="mt-3">
                <label className="text-sm font-medium text-[#1F1E1D]">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 w-full rounded-md border border-[#E9E1D3] bg-[#FAF7F2] px-3 py-2 text-sm text-[#1F1E1D]">
                  <option value="LKR" className="text-black">LKR — Sri Lankan Rupee</option>
                  <option value="USD" className="text-black">USD — US Dollar</option>
                </select>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-dashed border-[#E9E1D3] bg-[#FBF7EF] p-5">
              <h2 className="text-sm font-semibold text-[#1F1E1D]">Online gateway</h2>
              <p className="mt-1 text-xs text-[#8A8377]">
                Online card collection (PayHere / Stripe) is not connected. The gateway choice is a pending
                business decision — this shell will become the connection screen once a provider is picked.
                Nothing here is wired to real money movement today.
              </p>
              <div className="mt-3 space-y-2 opacity-60">
                {["PayHere", "Stripe"].map((p) => (
                  <div key={p} className="flex items-center justify-between rounded-lg border border-[#E9E1D3] bg-[#FBF7EF] px-3 py-2 text-sm">
                    <span className="text-[#1F1E1D]">{p}</span>
                    <span className="text-xs text-[#8A8377]">Pending decision — not connected</span>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-red-700 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {error}</p>}
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={save} disabled={saving || !businessId} className="rounded-full bg-[#1F1B17] text-white text-xs font-bold uppercase tracking-[0.12em] hover:bg-[#795831]">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Save settings</>}
              </Button>
              {saved && <span className="text-sm text-emerald-700">Saved.</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
