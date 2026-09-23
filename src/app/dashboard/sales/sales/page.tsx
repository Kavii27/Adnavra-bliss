"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Store, Plus, Check, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId, lkr, formatDate } from "@/components/dashboard/use-business";

type SaleRecord = {
  id: string;
  category: "SERVICE" | "PRODUCT" | "PACKAGE" | "MEMBERSHIP" | "GIFT_CARD" | "OTHER";
  label: string;
  amount: number;
  status: "COMPLETED" | "REFUNDED" | "VOIDED";
  occurredAt: string;
  customer: { id: string; name: string } | null;
};

const CATEGORIES = ["SERVICE", "PRODUCT", "PACKAGE", "MEMBERSHIP", "GIFT_CARD", "OTHER"] as const;

export default function SalesPage() {
  return (
    <PlanGate feature="detailedSales">
      <SalesInner />
    </PlanGate>
  );
}

function SalesInner() {
  const { businessId, loading: bizLoading, error: bizError, isNoBusiness } = useBusinessId();
  const [records, setRecords] = useState<SaleRecord[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("SERVICE");
  const [customerId, setCustomerId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState(0);
  const [showTax, setShowTax] = useState(true);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const [sR, cR, tR] = await Promise.all([
        fetch(`/api/sale-records?businessId=${businessId}&limit=100`),
        fetch(`/api/customers?limit=100`),
        fetch(`/api/business-settings?businessId=${businessId}&key=sales`).catch(() => null),
      ]);
      const sJ = await sR.json();
      const cJ = await cR.json();
      if (!sR.ok) throw new Error(sJ.error ?? "Failed to load sales");
      setRecords(sJ.data ?? []);
      if (cR.ok && Array.isArray(cJ.data)) setCustomers(cJ.data);
      // Receipt/tax configuration from Settings → Sales feeds these totals.
      if (tR?.ok) {
        const tJ = await tR.json();
        const row = Array.isArray(tJ.data) ? tJ.data[0] : null;
        const v = (row?.value ?? {}) as Record<string, unknown>;
        if (typeof v.taxRate === "number") setTaxRate(v.taxRate);
        if (typeof v.showTax === "boolean") setShowTax(v.showTax);
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

  const filtered = useMemo(
    () => (filter === "ALL" ? records : records.filter((r) => r.category === filter)),
    [records, filter],
  );
  const netTotal = useMemo(
    () =>
      filtered.reduce(
        (sum, r) => sum + (r.status === "COMPLETED" ? r.amount : r.status === "REFUNDED" ? -r.amount : 0),
        0,
      ),
    [filtered],
  );

  async function handleCreate() {
    if (!businessId) return;
    setFormError(null);
    if (!label.trim()) {
      setFormError("Description is required");
      return;
    }
    const amt = parseFloat(amount);
    if (Number.isNaN(amt) || amt < 0) {
      setFormError("Amount must be >= 0");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/sale-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          category,
          label: label.trim(),
          amount: amt,
          customerId: customerId || null,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Create failed");
      setShowForm(false);
      setLabel("");
      setAmount("");
      setCustomerId("");
      await load();
    } catch (e: unknown) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function setStatus(id: string, status: SaleRecord["status"]) {
    const r = await fetch(`/api/sale-records?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error ?? "Update failed");
      return;
    }
    await load();
  }

  if (bizLoading || (loading && businessId)) {
    return <div className="flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading sales...</div>;
  }
  if (isNoBusiness || bizError) {
    return (
      <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe3] border border-[#e6dcc8]">
          <Store className="h-5 w-5 text-[#a89880]" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#3a2f22]">Set up your salon to see sales</h3>
        <p className="mt-1 text-sm text-[#a89880]">{bizError ?? "Create your business profile first."}</p>
        <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#faf6ef] hover:bg-white/90">Go to Settings</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#3a2f22]">Sales</h1>
          <p className="text-sm text-[#a89880] mt-1">Detailed ledger. Package, membership, and gift-card sales post here automatically.</p>
        </div>
        <Button onClick={() => { setFormError(null); setShowForm(true); }} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">
          <Plus className="h-4 w-4 mr-2" /> Record sale
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-4">
          <p className="text-xs uppercase tracking-wide text-[#a89880]">Net total ({filter === "ALL" ? "all" : filter.toLowerCase()})</p>
          <p className="mt-1 text-xl font-semibold text-[#3a2f22]">{lkr(netTotal)}</p>
          {showTax && taxRate > 0 && (
            <p className="mt-1 text-xs text-[#a89880]">incl. {lkr(Math.round((netTotal * taxRate) / (100 + taxRate)))} tax ({taxRate}%)</p>
          )}
        </div>
        <div className="rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-4">
          <p className="text-xs uppercase tracking-wide text-[#a89880]">Transactions</p>
          <p className="mt-1 text-xl font-semibold text-[#3a2f22]">{filtered.length}</p>
        </div>
        <div className="rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-4">
          <p className="text-xs uppercase tracking-wide text-[#a89880]">Filter</p>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="mt-2 w-full rounded-md border border-[#e6dcc8] bg-[#faf6ef] px-2 py-1.5 text-sm text-[#3a2f22]">
            <option value="ALL" className="text-black">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="text-black">{c.replace("_", " ")}</option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {error}</div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center">
          <ReceiptText className="h-6 w-6 text-[#a89880] mx-auto" />
          <p className="mt-2 text-sm text-[#a89880]">No sales recorded yet. Package, membership, and gift-card sales appear here automatically — or record one manually.</p>
          <Button onClick={() => setShowForm(true)} className="mt-4 bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">Record sale</Button>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-[#e6dcc8] bg-white/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[#a89880] border-b border-[#e6dcc8] bg-white/[0.02]">
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-[#3a2f22]">{r.label}</td>
                    <td className="px-4 py-3 text-[#a89880] text-xs">{r.category.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-[#a89880]">{r.customer?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-[#a89880] text-xs">{formatDate(r.occurredAt)}</td>
                    <td className="px-4 py-3 text-right text-[#3a2f22]">{lkr(r.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-300" : r.status === "REFUNDED" ? "bg-[#f3ebdd] text-[#a89880]" : "bg-red-500/20 text-red-300"}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "COMPLETED" && (
                        <div className="inline-flex gap-2">
                          <button onClick={() => setStatus(r.id, "REFUNDED")} className="rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-1.5 text-xs font-medium text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]">Refund</button>
                          <button onClick={() => setStatus(r.id, "VOIDED")} className="rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-1.5 text-xs font-medium text-[#a89880] hover:bg-red-500/20 hover:text-red-300">Void</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div className="bg-[#0F1729] rounded-xl border border-[#e6dcc8] p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[#3a2f22]">Record sale</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Description *</label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Haircut — walk-in" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Amount (LKR) *</label>
                  <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min={0} className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="mt-1 w-full rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm text-[#3a2f22]">
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="text-black">{c.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Customer</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="mt-1 w-full rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm text-[#3a2f22]">
                  <option value="" className="text-black">None</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="text-black">{c.name}</option>
                  ))}
                </select>
              </div>
              {formError && <p className="text-sm text-red-300 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghostDark" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={submitting} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Record</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
