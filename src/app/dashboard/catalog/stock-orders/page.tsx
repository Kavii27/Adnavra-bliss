"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Store, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId, lkr, formatDate } from "@/components/dashboard/use-business";

type Supplier = { id: string; name: string; isActive: boolean };
type Product = { id: string; name: string };
type StockOrder = {
  id: string;
  status: "PENDING" | "ORDERED" | "RECEIVED" | "CANCELLED";
  notes: string | null;
  createdAt: string;
  supplier: { id: string; name: string };
  items: { id: string; productName: string; quantity: number; unitCost: number }[];
};

type DraftLine = { productId: string; productName: string; quantity: string; unitCost: string };

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-[#FDE68A]/30 text-[#92400e]",
  ORDERED: "bg-[#8a6d4f]/20 text-[#3a2f22]",
  RECEIVED: "bg-emerald-500/20 text-emerald-300",
  CANCELLED: "bg-red-500/20 text-red-300",
};

export default function StockOrdersPage() {
  return (
    <PlanGate feature="inventoryOps">
      <StockOrdersInner />
    </PlanGate>
  );
}

function StockOrdersInner() {
  const { businessId, loading: bizLoading, error: bizError, isNoBusiness } = useBusinessId();
  const [orders, setOrders] = useState<StockOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([{ productId: "", productName: "", quantity: "1", unitCost: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const [oR, sR, pR] = await Promise.all([
        fetch(`/api/stock-orders?businessId=${businessId}&limit=50`),
        fetch(`/api/suppliers?businessId=${businessId}&limit=100`),
        fetch(`/api/products?businessId=${businessId}&limit=100`),
      ]);
      const oJ = await oR.json();
      const sJ = await sR.json();
      const pJ = await pR.json();
      if (!oR.ok) throw new Error(oJ.error ?? "Failed to load stock orders");
      setOrders(oJ.data ?? []);
      if (sR.ok) setSuppliers((sJ.data ?? []).filter((s: Supplier) => s.isActive));
      if (pR.ok) setProducts(pJ.data ?? []);
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

  function updateLine(idx: number, patch: Partial<DraftLine>) {
    setLines((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      // Picking a catalog product fills the snapshot name automatically.
      if (patch.productId !== undefined) {
        const p = products.find((pr) => pr.id === patch.productId);
        next[idx].productName = p?.name ?? next[idx].productName;
      }
      return next;
    });
  }

  async function handleSubmit() {
    if (!businessId) return;
    setFormError(null);
    if (!supplierId) {
      setFormError("Choose a supplier");
      return;
    }
    const items = [];
    for (const [i, l] of lines.entries()) {
      const qty = parseInt(l.quantity, 10);
      const cost = parseFloat(l.unitCost);
      const nm = l.productName.trim();
      if (!nm) {
        setFormError(`Line ${i + 1}: product name is required`);
        return;
      }
      if (Number.isNaN(qty) || qty < 1) {
        setFormError(`Line ${i + 1}: quantity must be >= 1`);
        return;
      }
      if (Number.isNaN(cost) || cost < 0) {
        setFormError(`Line ${i + 1}: unit cost must be >= 0`);
        return;
      }
      items.push({ productId: l.productId || null, productName: nm, quantity: qty, unitCost: cost });
    }
    if (items.length === 0) {
      setFormError("Add at least one line item");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/stock-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, supplierId, notes: notes.trim() || null, items }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Create failed");
      setShowForm(false);
      setSupplierId("");
      setNotes("");
      setLines([{ productId: "", productName: "", quantity: "1", unitCost: "" }]);
      await load();
    } catch (e: unknown) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function setStatus(id: string, status: StockOrder["status"]) {
    const action = status === "RECEIVED" ? "Mark this order received? Linked product stock will increase." : `Move this order to ${status}?`;
    if (!confirm(action)) return;
    const r = await fetch(`/api/stock-orders?id=${id}`, {
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
    return <div className="flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading stock orders...</div>;
  }
  if (isNoBusiness || bizError) {
    return (
      <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe3] border border-[#e6dcc8]">
          <Store className="h-5 w-5 text-[#a89880]" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#3a2f22]">Set up your salon to order stock</h3>
        <p className="mt-1 text-sm text-[#a89880]">{bizError ?? "Create your business profile first."}</p>
        <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#faf6ef] hover:bg-white/90">Go to Settings</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#3a2f22]">Stock orders</h1>
          <p className="text-sm text-[#a89880] mt-1">Order from suppliers. Receiving an order updates product stock.</p>
        </div>
        <Button onClick={() => { setFormError(null); setShowForm(true); }} disabled={suppliers.length === 0} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">
          <Plus className="h-4 w-4 mr-2" /> New order
        </Button>
      </div>

      {suppliers.length === 0 && !error && (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-6 text-sm text-[#a89880]">
          Add a supplier first — orders are placed against a supplier.{" "}
          <Link href="/dashboard/catalog/suppliers" className="font-medium text-[#3a2f22] underline">Go to Suppliers</Link>.
        </div>
      )}

      {error ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {error}</div>
      ) : orders.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center text-sm text-[#a89880]">
          No stock orders yet. Create one when you restock.
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {orders.map((o) => {
            const total = o.items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
            return (
              <div key={o.id} className="rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-[#3a2f22]">{o.supplier?.name ?? "Unknown supplier"}</p>
                    <p className="text-xs text-[#a89880] mt-0.5">{formatDate(o.createdAt)} · {o.items.length} line(s) · {lkr(total)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  {o.items.map((i) => (
                    <div key={i.id} className="flex items-center justify-between gap-3 text-[#a89880]">
                      <span className="truncate">{i.productName} × {i.quantity}</span>
                      <span className="text-xs shrink-0">{lkr(i.unitCost)} each</span>
                    </div>
                  ))}
                </div>
                {(o.status === "PENDING" || o.status === "ORDERED") && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {o.status === "PENDING" && (
                      <button onClick={() => setStatus(o.id, "ORDERED")} className="rounded-md border border-[#e6dcc8] bg-[#faf6ef] px-3 py-1.5 text-xs font-medium text-[#3a2f22] hover:bg-[#f3ebdd]">Mark ordered</button>
                    )}
                    <button onClick={() => setStatus(o.id, "RECEIVED")} className="rounded-md bg-[#8a6d4f] px-3 py-1.5 text-xs font-semibold text-[#ffffff] hover:bg-white/90">Mark received</button>
                    <button onClick={() => setStatus(o.id, "CANCELLED")} className="rounded-md border border-[#e6dcc8] bg-[#faf6ef] px-3 py-1.5 text-xs font-medium text-[#a89880] hover:bg-red-500/20 hover:text-red-300">Cancel</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div className="bg-[#0F1729] rounded-xl border border-[#e6dcc8] p-6 w-full max-w-xl shadow-xl max-h-[90dvh] overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[#3a2f22]">New stock order</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Supplier *</label>
                <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="mt-1 w-full rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm text-[#3a2f22]">
                  <option value="" className="text-black">Choose a supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id} className="text-black">{s.name}</option>
                  ))}
                </select>
              </div>
              {lines.map((l, idx) => (
                <div key={idx} className="rounded-lg border border-[#e6dcc8] bg-[#f6efe3] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#a89880]">Line {idx + 1}</span>
                    {lines.length > 1 && (
                      <button onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))} className="text-xs text-red-300 hover:underline">Remove</button>
                    )}
                  </div>
                  <select value={l.productId} onChange={(e) => updateLine(idx, { productId: e.target.value })} className="w-full rounded-md border border-[#e6dcc8] bg-[#faf6ef] px-3 py-2 text-sm text-[#3a2f22]">
                    <option value="" className="text-black">Custom item (type name below)</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id} className="text-black">{p.name}</option>
                    ))}
                  </select>
                  <Input value={l.productName} onChange={(e) => updateLine(idx, { productName: e.target.value })} placeholder="Product name *" className="bg-[#faf6ef] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={l.quantity} onChange={(e) => updateLine(idx, { quantity: e.target.value })} type="number" min={1} placeholder="Qty *" className="bg-[#faf6ef] border-[#e6dcc8] text-[#3a2f22]" />
                    <Input value={l.unitCost} onChange={(e) => updateLine(idx, { unitCost: e.target.value })} type="number" min={0} placeholder="Unit cost (LKR) *" className="bg-[#faf6ef] border-[#e6dcc8] text-[#3a2f22]" />
                  </div>
                </div>
              ))}
              <button onClick={() => setLines((prev) => [...prev, { productId: "", productName: "", quantity: "1", unitCost: "" }])} className="text-sm font-medium text-[#8a6d4f] hover:underline">+ Add line</button>
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Notes</label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
              {formError && <p className="text-sm text-red-300 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghostDark" onClick={() => setShowForm(false)}><X className="h-4 w-4 mr-2" /> Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Create order</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
