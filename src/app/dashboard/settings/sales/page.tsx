"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId } from "@/components/dashboard/use-business";

const DEFAULTS = {
  taxRate: 0,
  showTax: true,
  receiptHeader: "",
  receiptFooter: "Thank you for visiting us!",
};

export default function SalesSettingsPage() {
  return (
    <PlanGate feature="salesSettings">
      <SalesSettingsInner />
    </PlanGate>
  );
}

function SalesSettingsInner() {
  const { businessId, loading: bizLoading, error: bizError } = useBusinessId();
  const [taxRate, setTaxRate] = useState(DEFAULTS.taxRate);
  const [showTax, setShowTax] = useState(DEFAULTS.showTax);
  const [receiptHeader, setReceiptHeader] = useState(DEFAULTS.receiptHeader);
  const [receiptFooter, setReceiptFooter] = useState(DEFAULTS.receiptFooter);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/business-settings?businessId=${businessId}&key=sales`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed to load settings");
      const row = Array.isArray(j.data) ? j.data[0] : null;
      const v = (row?.value ?? {}) as Partial<typeof DEFAULTS>;
      if (typeof v.taxRate === "number") setTaxRate(v.taxRate);
      if (typeof v.showTax === "boolean") setShowTax(v.showTax);
      if (typeof v.receiptHeader === "string") setReceiptHeader(v.receiptHeader);
      if (typeof v.receiptFooter === "string") setReceiptFooter(v.receiptFooter);
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
    if (taxRate < 0 || taxRate > 100) {
      setError("Tax rate must be 0–100%");
      return;
    }
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const r = await fetch("/api/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, key: "sales", value: { taxRate, showTax, receiptHeader, receiptFooter } }),
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

  // Live receipt preview at a sample LKR 5,000 subtotal.
  const sample = 500000;
  const sampleTax = Math.round((sample * taxRate) / 100);

  if (bizLoading || loading) {
    return <div className="flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading sales settings...</div>;
  }

  return (
    <div className="bg-[#0F1729] min-h-full px-6 py-8">
      <div className="max-w-2xl">
        <Link href="/dashboard/settings" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#a89880] hover:text-[#3a2f22] mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Settings
        </Link>
        <h1 className="text-xl font-semibold text-[#3a2f22]">Sales settings</h1>
        <p className="mt-1 text-sm text-[#a89880]">Receipt template and tax rate. The Sales ledger totals tax using this rate.</p>

        {bizError ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {bizError}</div>
        ) : (
          <>
            <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Tax rate (%)</label>
                <Input value={String(taxRate)} onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)} type="number" min={0} max={100} className="mt-1 bg-[#faf6ef] border-[#e6dcc8] text-[#3a2f22]" />
              </div>
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" checked={showTax} onChange={(e) => setShowTax(e.target.checked)} className="mt-1 accent-white" />
                <span>
                  <span className="font-medium text-[#3a2f22]">Show tax line on totals</span>
                  <span className="block text-xs text-[#a89880]">Sales pages split subtotal, tax, and total when on.</span>
                </span>
              </label>
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Receipt header</label>
                <Input value={receiptHeader} onChange={(e) => setReceiptHeader(e.target.value)} placeholder="Your salon tagline (optional)" className="mt-1 bg-[#faf6ef] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Receipt footer</label>
                <Input value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} placeholder="Thank-you message" className="mt-1 bg-[#faf6ef] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#e6dcc8] bg-[#faf6ef] p-5">
              <p className="text-xs uppercase tracking-wide text-[#a89880]">Receipt preview (LKR 5,000 sample)</p>
              <div className="mt-2 font-mono text-sm text-[#3a2f22] space-y-1">
                {receiptHeader && <p className="text-center">{receiptHeader}</p>}
                <div className="flex justify-between"><span>Subtotal</span><span>LKR 5,000.00</span></div>
                {showTax && <div className="flex justify-between"><span>Tax ({taxRate}%)</span><span>LKR {(sampleTax / 100).toFixed(2)}</span></div>}
                <div className="flex justify-between font-semibold border-t border-[#e6dcc8] pt-1"><span>Total</span><span>LKR {((sample + (showTax ? sampleTax : 0)) / 100).toFixed(2)}</span></div>
                {receiptFooter && <p className="text-center text-xs pt-1">{receiptFooter}</p>}
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-red-300 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {error}</p>}
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={save} disabled={saving || !businessId} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Save settings</>}
              </Button>
              {saved && <span className="text-sm text-emerald-300">Saved.</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
