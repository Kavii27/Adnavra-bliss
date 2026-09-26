"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Store, Plus, Check, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId, lkr } from "@/components/dashboard/use-business";
import { StyledNativeSelect } from "@/components/ui/select";

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
    return <div className="flex items-center gap-2 text-sm text-[#8A8377]"><Loader2 className="h-4 w-4 animate-spin" /> Loading packages...</div>;
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
        <h3 className="font-[family-name:var(--font-display)] mt-5 text-xl font-semibold text-[#1F1B17]">Set up your salon to sell packages</h3>
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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9A7B4F]">Sales</p>
          <h1 className="font-[family-name:var(--font-display)] mt-1 text-3xl font-medium tracking-tight text-[#1F1B17]">Packages sold</h1>
          <p className="text-sm text-[#8A8377] mt-1.5">Bundles bought by customers. Define bundles in Catalog → Packages first.</p>
        </div>
        <Button onClick={() => { setFormError(null); setShowForm(true); }} disabled={catalog.length === 0} className="rounded-full bg-[#1F1B17] text-white hover:bg-[#795831]">
          <Plus className="h-4 w-4 mr-2" /> Record sale
        </Button>
      </div>

      {catalog.length === 0 && !error && (
        <div className="mt-6 rounded-2xl border border-[#E9E1D3] bg-white p-6 text-sm text-[#8A8377] shadow-[0_2px_12px_rgba(30,28,26,0.04)]">
          No packages in your catalog yet.{" "}
          <Link href="/dashboard/catalog/packages" className="font-medium text-[#795831] underline">Create one in Catalog → Packages</Link>,
          then record sales here.
        </div>
      )}

      {error ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#FDECEC] bg-[#FDECEC] px-4 py-3 text-sm text-[#B91C1C]"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</div>
      ) : sales.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#E5DDD0] bg-white p-10 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, #D9BE8C, #C9A467)" }}
          >
            <Package className="h-6 w-6 text-[#1B1714]" />
          </div>
          <p className="mt-4 text-sm text-[#4A4640]">No packages sold yet. Record a sale when a customer buys a bundle.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[#8A8377] border-b border-[#E9E1D3] bg-[#FBF7EF]">
                  <th className="px-4 py-3 font-medium">Package</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium text-right">Paid</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EEE4]">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FBF7EF]/60">
                    <td className="px-4 py-3 font-medium text-[#1F1E1D]">{s.packageName}</td>
                    <td className="px-4 py-3 text-[#8A8377]">{s.customer?.name ?? "Walk-in"}</td>
                    <td className="px-4 py-3 text-right text-[#1F1E1D]">{lkr(s.pricePaid)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-300" : "bg-[#FBF7EF] text-[#8A8377]"}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.status === "ACTIVE" && (
                        <button onClick={() => setStatus(s.id, "REDEEMED")} className="rounded-md border border-[#E9E1D3] bg-[#FBF7EF] px-3 py-1.5 text-xs font-medium text-[#8A8377] hover:bg-[#F3EEE4] hover:text-[#1F1E1D]">Mark redeemed</button>
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
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#1F1B17]">Record package sale</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#1F1E1D]">Package *</label>
                <StyledNativeSelect aria-label="Package" value={packageId} onChange={(e) => setPackageId(e.target.value)} wrapperClassName="mt-1 w-full" className="w-full">
                  <option value="">Choose a package</option>
                  {catalog.filter((p) => p.isActive).map((p) => (
                    <option key={p.id} value={p.id}>{p.name} · {lkr(p.price)}</option>
                  ))}
                </StyledNativeSelect>
              </div>
              <div>
                <label className="text-sm font-medium text-[#1F1E1D]">Customer</label>
                <StyledNativeSelect aria-label="Customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} wrapperClassName="mt-1 w-full" className="w-full">
                  <option value="">Walk-in (no customer)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </StyledNativeSelect>
              </div>
              {formError && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghostDark" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleSell} disabled={submitting} className="rounded-full bg-[#1F1B17] text-white hover:bg-[#795831]">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Record</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
