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
    return <div className="flex items-center gap-2 text-sm text-[#8A8377]"><Loader2 className="h-4 w-4 animate-spin" /> Loading sales...</div>;
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
        <h3 className="font-[family-name:var(--font-display)] mt-5 text-xl font-semibold text-[#1F1B17]">Set up your salon to see sales</h3>
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
          <h1 className="font-[family-name:var(--font-display)] mt-1 text-3xl font-medium tracking-tight text-[#1F1B17]">Sales</h1>
          <p className="text-sm text-[#8A8377] mt-1.5">Detailed ledger. Package, membership, and gift-card sales post here automatically.</p>
        </div>
        <Button onClick={() => { setFormError(null); setShowForm(true); }} className="rounded-full bg-[#1F1B17] text-white hover:bg-[#795831]">
          <Plus className="h-4 w-4 mr-2" /> Record sale
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[#E9E1D3] bg-white p-4 shadow-[0_4px_20px_rgba(30,28,26,0.05)]">
          <p className="text-xs uppercase tracking-wide text-[#9A7B4F]">Net total ({filter === "ALL" ? "all" : filter.toLowerCase()})</p>
          <p className="mt-1 text-xl font-semibold text-[#1F1E1D]">{lkr(netTotal)}</p>
          {showTax && taxRate > 0 && (
            <p className="mt-1 text-xs text-[#8A8377]">incl. {lkr(Math.round((netTotal * taxRate) / (100 + taxRate)))} tax ({taxRate}%)</p>
          )}
        </div>
        <div className="rounded-2xl border border-[#E9E1D3] bg-white p-4 shadow-[0_4px_20px_rgba(30,28,26,0.05)]">
          <p className="text-xs uppercase tracking-wide text-[#9A7B4F]">Transactions</p>
          <p className="mt-1 text-xl font-semibold text-[#1F1E1D]">{filtered.length}</p>
        </div>
        <div className="rounded-2xl border border-[#E9E1D3] bg-white p-4 shadow-[0_4px_20px_rgba(30,28,26,0.05)]">
          <p className="text-xs uppercase tracking-wide text-[#9A7B4F]">Filter</p>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="mt-2 w-full rounded-md border border-[#E9E1D3] bg-[#FBF7EF] px-2 py-1.5 text-sm text-[#1F1E1D]">
            <option value="ALL" className="text-black">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="text-black">{c.replace("_", " ")}</option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#FDECEC] bg-[#FDECEC] px-4 py-3 text-sm text-[#B91C1C]"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#E5DDD0] bg-white p-10 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, #D9BE8C, #C9A467)" }}
          >
            <ReceiptText className="h-6 w-6 text-[#1B1714]" />
          </div>
          <p className="mt-4 text-sm text-[#4A4640]">No sales recorded yet. Package, membership, and gift-card sales appear here automatically — or record one manually.</p>
          <Button onClick={() => setShowForm(true)} className="mt-4 rounded-full bg-[#1F1B17] text-white hover:bg-[#795831]">Record sale</Button>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[#8A8377] border-b border-[#E9E1D3] bg-[#FBF7EF]">
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EEE4]">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FBF7EF]/60">
                    <td className="px-4 py-3 font-medium text-[#1F1E1D]">{r.label}</td>
                    <td className="px-4 py-3 text-[#8A8377] text-xs">{r.category.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-[#8A8377]">{r.customer?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-[#8A8377] text-xs">{formatDate(r.occurredAt)}</td>
                    <td className="px-4 py-3 text-right text-[#1F1E1D]">{lkr(r.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-300" : r.status === "REFUNDED" ? "bg-[#FBF7EF] text-[#8A8377]" : "bg-red-500/20 text-red-300"}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "COMPLETED" && (
                        <div className="inline-flex gap-2">
                          <button onClick={() => setStatus(r.id, "REFUNDED")} className="rounded-md border border-[#E9E1D3] bg-[#FBF7EF] px-3 py-1.5 text-xs font-medium text-[#8A8377] hover:bg-[#F3EEE4] hover:text-[#1F1E1D]">Refund</button>
                          <button onClick={() => setStatus(r.id, "VOIDED")} className="rounded-md border border-[#E9E1D3] bg-[#FBF7EF] px-3 py-1.5 text-xs font-medium text-[#8A8377] hover:bg-red-500/20 hover:text-red-300">Void</button>
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
          <div className="bg-white rounded-2xl border border-[#E9E1D3] p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#1F1B17]">Record sale</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#1F1E1D]">Description *</label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Haircut — walk-in" className="mt-1 bg-[#FBF7EF] border-[#E9E1D3] text-[#1F1E1D] placeholder:text-[#8A8377]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#1F1E1D]">Amount (LKR) *</label>
                  <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min={0} className="mt-1 bg-[#FBF7EF] border-[#E9E1D3] text-[#1F1E1D]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#1F1E1D]">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="mt-1 w-full rounded-md border border-[#E9E1D3] bg-[#FBF7EF] px-3 py-2 text-sm text-[#1F1E1D]">
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="text-black">{c.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#1F1E1D]">Customer</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="mt-1 w-full rounded-md border border-[#E9E1D3] bg-[#FBF7EF] px-3 py-2 text-sm text-[#1F1E1D]">
                  <option value="" className="text-black">None</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="text-black">{c.name}</option>
                  ))}
                </select>
              </div>
              {formError && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghostDark" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={submitting} className="rounded-full bg-[#1F1B17] text-white hover:bg-[#795831]">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Record</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
