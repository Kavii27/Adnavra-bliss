"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Store, Plus, Check, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId, lkr } from "@/components/dashboard/use-business";

type CatalogPackage = { id: string; name: string; price: number; isActive: boolean };
type PackageSale = {
  id: string;
  packageName: string;
  pricePaid: number;
  status: "ACTIVE" | "REDEEMED" | "EXPIRED" | "CANCELLED";
  soldAt: string;
  customer: { id: string; name: string } | null;
};

export default function PackagesSoldPage() {
  return (
    <PlanGate feature="packagesSold">
      <PackagesSoldInner />
    </PlanGate>
  );
}

function PackagesSoldInner() {
  const { businessId, loading: bizLoading, error: bizError, isNoBusiness } = useBusinessId();
  const [catalog, setCatalog] = useState<CatalogPackage[]>([]);
  const [sales, setSales] = useState<PackageSale[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [packageId, setPackageId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const [pR, sR, cR] = await Promise.all([
        fetch(`/api/packages?businessId=${businessId}&limit=50`),
        fetch(`/api/package-sales?businessId=${businessId}&limit=50`),
        fetch(`/api/customers?limit=100`),
      ]);
      const pJ = await pR.json();
      const sJ = await sR.json();
      const cJ = await cR.json();
      if (!sR.ok) throw new Error(sJ.error ?? "Failed to load package sales");
      setSales(sJ.data ?? []);
      if (pR.ok) setCatalog(pJ.data ?? []);
      if (cR.ok && Array.isArray(cJ.data)) setCustomers(cJ.data);
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

  async function handleSell() {
    if (!businessId) return;
    setFormError(null);
    const pkg = catalog.find((p) => p.id === packageId);
    if (!pkg) {
      setFormError("Choose a package from your catalog");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/package-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          packageId: pkg.id,
          customerId: customerId || null,
          pricePaid: pkg.price / 100,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Sale failed");
      setShowForm(false);
      setPackageId("");
      setCustomerId("");
      await load();
    } catch (e: unknown) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function setStatus(id: string, status: PackageSale["status"]) {
    const r = await fetch(`/api/package-sales?id=${id}`, {
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
    return <div className="flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading packages...</div>;
  }
  if (isNoBusiness || bizError) {
    return (
      <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe3] border border-[#e6dcc8]">
          <Store className="h-5 w-5 text-[#a89880]" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#3a2f22]">Set up your salon to sell packages</h3>
        <p className="mt-1 text-sm text-[#a89880]">{bizError ?? "Create your business profile first."}</p>
        <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#faf6ef] hover:bg-white/90">Go to Settings</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#3a2f22]">Packages sold</h1>
          <p className="text-sm text-[#a89880] mt-1">Bundles bought by customers. Define bundles in Catalog → Packages first.</p>
        </div>
        <Button onClick={() => { setFormError(null); setShowForm(true); }} disabled={catalog.length === 0} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">
          <Plus className="h-4 w-4 mr-2" /> Record sale
        </Button>
      </div>

      {catalog.length === 0 && !error && (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-6 text-sm text-[#a89880]">
          No packages in your catalog yet.{" "}
          <Link href="/dashboard/catalog/packages" className="font-medium text-[#3a2f22] underline">Create one in Catalog → Packages</Link>,
          then record sales here.
        </div>
      )}

      {error ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {error}</div>
      ) : sales.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center">
          <Package className="h-6 w-6 text-[#a89880] mx-auto" />
          <p className="mt-2 text-sm text-[#a89880]">No packages sold yet. Record a sale when a customer buys a bundle.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-[#e6dcc8] bg-white/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[#a89880] border-b border-[#e6dcc8] bg-white/[0.02]">
                  <th className="px-4 py-3 font-medium">Package</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium text-right">Paid</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-[#3a2f22]">{s.packageName}</td>
                    <td className="px-4 py-3 text-[#a89880]">{s.customer?.name ?? "Walk-in"}</td>
                    <td className="px-4 py-3 text-right text-[#3a2f22]">{lkr(s.pricePaid)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-300" : "bg-[#f3ebdd] text-[#a89880]"}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.status === "ACTIVE" && (
                        <button onClick={() => setStatus(s.id, "REDEEMED")} className="rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-1.5 text-xs font-medium text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]">Mark redeemed</button>
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
            <h2 className="text-lg font-semibold text-[#3a2f22]">Record package sale</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Package *</label>
                <select value={packageId} onChange={(e) => setPackageId(e.target.value)} className="mt-1 w-full rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm text-[#3a2f22]">
                  <option value="" className="text-black">Choose a package</option>
                  {catalog.filter((p) => p.isActive).map((p) => (
                    <option key={p.id} value={p.id} className="text-black">{p.name} · {lkr(p.price)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Customer</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="mt-1 w-full rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm text-[#3a2f22]">
                  <option value="" className="text-black">Walk-in (no customer)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="text-black">{c.name}</option>
                  ))}
                </select>
              </div>
              {formError && <p className="text-sm text-red-300 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghostDark" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleSell} disabled={submitting} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Record</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
