"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Store, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId, lkr } from "@/components/dashboard/use-business";

type Service = { id: string; name: string; price: number };
type CatalogPackage = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  items: { serviceId: string; quantity: number; service: Service }[];
};

export default function CatalogPackagesPage() {
  return (
    <PlanGate feature="packageCatalog">
      <CatalogPackagesInner />
    </PlanGate>
  );
}

function CatalogPackagesInner() {
  const { businessId, loading: bizLoading, error: bizError, isNoBusiness } = useBusinessId();
  const [packages, setPackages] = useState<CatalogPackage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const [pR, sR] = await Promise.all([
        fetch(`/api/packages?businessId=${businessId}&limit=50`),
        fetch(`/api/services?businessId=${businessId}&limit=100`),
      ]);
      const pJ = await pR.json();
      const sJ = await sR.json();
      if (!pR.ok) throw new Error(pJ.error ?? "Failed to load packages");
      setPackages(pJ.data ?? []);
      if (sR.ok && Array.isArray(sJ.data)) setServices(sJ.data);
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
    setName("");
    setDescription("");
    setPrice("");
    setPicked([]);
    setFormError(null);
    setShowForm(true);
  }

  function toggleService(id: string) {
    setPicked((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  const pickedTotal = services.filter((s) => picked.includes(s.id)).reduce((sum, s) => sum + s.price, 0);

  async function handleSubmit() {
    if (!businessId) return;
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }
    const pr = parseFloat(price);
    if (Number.isNaN(pr) || pr < 0) {
      setFormError("Bundle price must be >= 0");
      return;
    }
    if (picked.length === 0) {
      setFormError("Pick at least one service to bundle");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          name: name.trim(),
          description: description.trim() || null,
          price: pr,
          items: picked.map((serviceId) => ({ serviceId, quantity: 1 })),
        }),
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

  async function handleDelete(id: string) {
    if (!confirm("Delete this package? Past sales keep the package name as a snapshot.")) return;
    const r = await fetch(`/api/packages?id=${id}`, { method: "DELETE" });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error ?? "Delete failed");
      return;
    }
    await load();
  }

  if (bizLoading || (loading && businessId)) {
    return <div className="flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading packages...</div>;
  }
  if (isNoBusiness || bizError) {
    return (
      <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe3] border border-[#e6dcc8]">
          <Store className="h-5 w-5 text-[#a89880]" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#3a2f22]">Set up your salon to build packages</h3>
        <p className="mt-1 text-sm text-[#a89880]">{bizError ?? "Create your business profile first."}</p>
        <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#faf6ef] hover:bg-white/90">Go to Settings</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#3a2f22]">Packages</h1>
          <p className="text-sm text-[#a89880] mt-1">Bundle services at a fixed price. Customers buy them in Sales → Packages sold.</p>
        </div>
        <Button onClick={openCreate} disabled={services.length === 0} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">
          <Plus className="h-4 w-4 mr-2" /> New package
        </Button>
      </div>

      {services.length === 0 && !error && (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-6 text-sm text-[#a89880]">
          Add services first — packages bundle your existing services.{" "}
          <Link href="/dashboard/catalog/service-menu" className="font-medium text-[#3a2f22] underline">Go to Service menu</Link>.
        </div>
      )}

      {error ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {error}</div>
      ) : packages.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center text-sm text-[#a89880]">
          No packages yet. Bundle two or more services at a special price.
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {packages.map((p) => (
            <div key={p.id} className="rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-[#3a2f22] flex items-center gap-2">
                    {p.name}
                    {!p.isActive && <span className="rounded-full bg-[#f3ebdd] px-2 py-0.5 text-xs text-[#a89880]">Inactive</span>}
                  </p>
                  {p.description && <p className="text-sm text-[#a89880] mt-0.5">{p.description}</p>}
                  <p className="text-xs text-[#a89880] mt-1">
                    {p.items.map((i) => i.service?.name ?? "Unknown").join(" + ")} ·{" "}
                    <span className="font-semibold text-[#3a2f22]">{lkr(p.price)}</span>
                  </p>
                </div>
                <button onClick={() => handleDelete(p.id)} className="rounded-md border border-[#e6dcc8] bg-[#faf6ef] px-3 py-1.5 text-xs font-medium text-[#a89880] hover:bg-red-500/20 hover:text-red-300 shrink-0">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div className="bg-[#0F1729] rounded-xl border border-[#e6dcc8] p-6 w-full max-w-lg shadow-xl max-h-[90dvh] overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[#3a2f22]">New package</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bridal Glow Bundle" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Description</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's included" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
              <div>
                <span className="text-sm font-medium text-[#3a2f22]">Services in this bundle *</span>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto rounded-lg border border-[#e6dcc8] bg-[#f6efe3] p-2">
                  {services.map((s) => {
                    const on = picked.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleService(s.id)}
                        className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm ${on ? "bg-[#8a6d4f] text-[#ffffff]" : "text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]"}`}
                      >
                        <span className="truncate">{s.name}</span>
                        <span className="text-xs shrink-0 ml-2">{lkr(s.price)}</span>
                      </button>
                    );
                  })}
                </div>
                {picked.length > 0 && (
                  <p className="mt-1 text-xs text-[#a89880]">Services total {lkr(pickedTotal)} — price the bundle below that to show a saving.</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Bundle price (LKR) *</label>
                <Input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min={0} placeholder={String(Math.round(pickedTotal / 100))} className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]" />
              </div>
              {formError && <p className="text-sm text-red-300 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghostDark" onClick={() => setShowForm(false)}><X className="h-4 w-4 mr-2" /> Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Create</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
