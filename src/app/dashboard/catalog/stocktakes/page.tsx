"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Store, Plus, Check, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId, formatDate } from "@/components/dashboard/use-business";

type Product = { id: string; name: string; stockQty: number };
type Stocktake = {
  id: string;
  title: string | null;
  status: "OPEN" | "COMPLETED";
  createdAt: string;
  completedAt: string | null;
  items: { id: string; productName: string; expectedQty: number; countedQty: number }[];
};

type DraftLine = { productId: string; productName: string; expectedQty: string; countedQty: string };

export default function StocktakesPage() {
  return (
    <PlanGate feature="inventoryOps">
      <StocktakesInner />
    </PlanGate>
  );
}

function StocktakesInner() {
  const { businessId, loading: bizLoading, error: bizError, isNoBusiness } = useBusinessId();
  const [takes, setTakes] = useState<Stocktake[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const [tR, pR] = await Promise.all([
        fetch(`/api/stocktakes?businessId=${businessId}&limit=50`),
        fetch(`/api/products?businessId=${businessId}&limit=200`),
      ]);
      const tJ = await tR.json();
      const pJ = await pR.json();
      if (!tR.ok) throw new Error(tJ.error ?? "Failed to load stocktakes");
      setTakes(tJ.data ?? []);
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

  function startNew() {
    setTitle("");
    // Prefill one line per catalog product with expected = current stock.
    setLines(products.map((p) => ({ productId: p.id, productName: p.name, expectedQty: String(p.stockQty), countedQty: "" })));
    setFormError(null);
    setShowForm(true);
  }

  function updateLine(idx: number, patch: Partial<DraftLine>) {
    setLines((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  async function handleSubmit() {
    if (!businessId) return;
    setFormError(null);
    const items = [];
    for (const [i, l] of lines.entries()) {
      const exp = parseInt(l.expectedQty, 10);
      const cnt = parseInt(l.countedQty, 10);
      if (!l.productName.trim()) {
        setFormError(`Line ${i + 1}: product name is required`);
        return;
      }
      if (Number.isNaN(exp) || exp < 0 || Number.isNaN(cnt) || cnt < 0) {
        setFormError(`Line ${i + 1}: expected and counted must be >= 0`);
        return;
      }
      items.push({ productId: l.productId || null, productName: l.productName.trim(), expectedQty: exp, countedQty: cnt });
    }
    if (items.length === 0) {
      setFormError("Nothing to count — add products in Catalog → Products first");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/stocktakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, title: title.trim() || null, items }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Create failed");
      setShowForm(false);
      await load();
    } catch (e: unknown) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function complete(id: string) {
    if (!confirm("Complete this stocktake? Linked product stock will be set to the counted quantities.")) return;
    const r = await fetch(`/api/stocktakes?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error ?? "Update failed");
      return;
    }
    await load();
  }

  if (bizLoading || (loading && businessId)) {
    return <div className="flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading stocktakes...</div>;
  }
  if (isNoBusiness || bizError) {
    return (
      <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe3] border border-[#e6dcc8]">
          <Store className="h-5 w-5 text-[#a89880]" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#3a2f22]">Set up your salon to run stocktakes</h3>
        <p className="mt-1 text-sm text-[#a89880]">{bizError ?? "Create your business profile first."}</p>
        <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#faf6ef] hover:bg-white/90">Go to Settings</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#3a2f22]">Stocktakes</h1>
          <p className="text-sm text-[#a89880] mt-1">Counted vs expected quantities. Completing reconciles product stock.</p>
        </div>
        <Button onClick={startNew} disabled={products.length === 0} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">
          <Plus className="h-4 w-4 mr-2" /> New stocktake
        </Button>
      </div>

      {products.length === 0 && !error && (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-6 text-sm text-[#a89880]">
          Add products first — stocktakes count your catalog.{" "}
          <Link href="/dashboard/catalog/products" className="font-medium text-[#3a2f22] underline">Go to Products</Link>.
        </div>
      )}

      {error ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {error}</div>
      ) : takes.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center">
          <ClipboardCheck className="h-6 w-6 text-[#a89880] mx-auto" />
          <p className="mt-2 text-sm text-[#a89880]">No stocktakes yet. Start one to reconcile your shelves with the system.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {takes.map((t) => {
            const variance = t.items.reduce((s, i) => s + (i.countedQty - i.expectedQty), 0);
            return (
              <div key={t.id} className="rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-[#3a2f22]">{t.title || `Stocktake ${formatDate(t.createdAt)}`}</p>
                    <p className="text-xs text-[#a89880] mt-0.5">
                      {t.items.length} line(s) · variance {variance >= 0 ? "+" : ""}{variance}
                      {t.completedAt ? ` · completed ${formatDate(t.completedAt)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-300" : "bg-[#FDE68A]/30 text-[#92400e]"}`}>{t.status}</span>
                    {t.status === "OPEN" && (
                      <button onClick={() => complete(t.id)} className="rounded-md bg-[#8a6d4f] px-3 py-1.5 text-xs font-semibold text-[#ffffff] hover:bg-white/90">Complete</button>
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  {t.items.map((i) => {
                    const diff = i.countedQty - i.expectedQty;
                    return (
                      <div key={i.id} className="flex items-center justify-between gap-3 text-[#a89880]">
                        <span className="truncate">{i.productName}</span>
                        <span className={`text-xs shrink-0 ${diff === 0 ? "" : diff > 0 ? "text-emerald-300 font-medium" : "text-red-300 font-medium"}`}>
                          expected {i.expectedQty} · counted {i.countedQty}{diff !== 0 ? ` (${diff > 0 ? "+" : ""}${diff})` : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div className="bg-[#0F1729] rounded-xl border border-[#e6dcc8] p-6 w-full max-w-xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[#3a2f22]">New stocktake</h2>
            <p className="text-xs text-[#a89880] mt-1">Expected quantities are prefilled from current product stock. Enter what you actually count.</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="End-of-month count (optional)" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
              {lines.map((l, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_90px_90px] gap-2 items-center">
                  <span className="text-sm text-[#3a2f22] truncate">{l.productName}</span>
                  <Input value={l.expectedQty} onChange={(e) => updateLine(idx, { expectedQty: e.target.value })} type="number" min={0} aria-label={`Expected ${l.productName}`} className="bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]" />
                  <Input value={l.countedQty} onChange={(e) => updateLine(idx, { countedQty: e.target.value })} type="number" min={0} placeholder="Counted" aria-label={`Counted ${l.productName}`} className="bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
                </div>
              ))}
              {formError && <p className="text-sm text-red-300 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghostDark" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Save count</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
