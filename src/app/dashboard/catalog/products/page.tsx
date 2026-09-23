"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Store, Plus, Check, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId, lkr } from "@/components/dashboard/use-business";

type Product = { id: string; name: string; price: number; stockQty: number; isActive: boolean };

export default function ProductsPage() {
  return (
    <PlanGate feature="retailProducts">
      <ProductsInner />
    </PlanGate>
  );
}

function ProductsInner() {
  const { businessId, loading: bizLoading, error: bizError, isNoBusiness } = useBusinessId();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("2500");
  const [stockQty, setStockQty] = useState("0");
  const [sku, setSku] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/products?businessId=${businessId}&limit=50`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed to load products");
      setProducts(j.data ?? []);
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

  function openCreate() {
    setEditing(null);
    setName("");
    setPrice("2500");
    setStockQty("0");
    setSku("");
    setIsActive(true);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setName(p.name);
    setPrice(String(p.price / 100));
    setStockQty(String(p.stockQty));
    setSku("");
    setIsActive(p.isActive);
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!businessId) return;
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }
    const pr = parseFloat(price);
    const qty = parseInt(stockQty, 10);
    if (Number.isNaN(pr) || pr < 0) {
      setFormError("Price must be >= 0");
      return;
    }
    if (Number.isNaN(qty) || qty < 0) {
      setFormError("Stock must be >= 0");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        price: pr,
        stockQty: qty,
        sku: sku.trim() || null,
        isActive,
      };
      const r = editing
        ? await fetch(`/api/products/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId, ...payload }),
          });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Save failed");
      setShowForm(false);
      await load();
    } catch (e: unknown) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    const r = await fetch(`/api/products/${id}`, { method: "DELETE" });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error ?? "Delete failed");
      return;
    }
    await load();
  }

  if (bizLoading || (loading && businessId)) {
    return <div className="flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading products...</div>;
  }
  if (isNoBusiness || bizError) {
    return (
      <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe3] border border-[#e6dcc8]">
          <Store className="h-5 w-5 text-[#a89880]" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#3a2f22]">Set up your salon to sell products</h3>
        <p className="mt-1 text-sm text-[#a89880]">{bizError ?? "Create your business profile first."}</p>
        <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#faf6ef] hover:bg-white/90">Go to Settings</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#3a2f22]">Products</h1>
          <p className="text-sm text-[#a89880] mt-1">Retail items sold alongside services. Stock updates when orders arrive.</p>
        </div>
        <Button onClick={openCreate} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">
          <Plus className="h-4 w-4 mr-2" /> Add product
        </Button>
      </div>

      {error ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {error}</div>
      ) : products.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center">
          <ClipboardList className="h-6 w-6 text-[#a89880] mx-auto" />
          <p className="mt-2 text-sm text-[#a89880]">No products yet. Add shampoos, oils, and styling goods you sell at the counter.</p>
          <Button onClick={openCreate} className="mt-4 bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">Add product</Button>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-[#e6dcc8] bg-white/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[#a89880] border-b border-[#e6dcc8] bg-white/[0.02]">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium text-right">Price</th>
                  <th className="px-4 py-3 font-medium text-right">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-[#3a2f22]">{p.name}</td>
                    <td className="px-4 py-3 text-right text-[#3a2f22]">{lkr(p.price)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={p.stockQty <= 0 ? "text-red-300 font-medium" : "text-[#3a2f22]"}>
                        {p.stockQty}{p.stockQty <= 0 ? " · out of stock" : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-[#f3ebdd] text-[#a89880]"}`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button onClick={() => openEdit(p)} className="rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-1.5 text-xs font-medium text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]">Edit</button>
                        <button onClick={() => handleDelete(p.id)} className="rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-1.5 text-xs font-medium text-[#a89880] hover:bg-red-500/20 hover:text-red-300">Delete</button>
                      </div>
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
            <h2 className="text-lg font-semibold text-[#3a2f22]">{editing ? "Edit product" : "New product"}</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Argan oil 100ml" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Price (LKR) *</label>
                  <Input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min={0} className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Stock *</label>
                  <Input value={stockQty} onChange={(e) => setStockQty(e.target.value)} type="number" min={0} className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">SKU</label>
                  <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Optional" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-[#a89880]"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-white" /> Active (visible for sale)</label>
              {formError && <p className="text-sm text-red-300 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghostDark" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> {editing ? "Save" : "Create"}</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
