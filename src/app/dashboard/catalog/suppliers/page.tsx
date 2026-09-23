"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Store, Plus, Check, Pencil, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId } from "@/components/dashboard/use-business";

type Supplier = {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
};

export default function SuppliersPage() {
  return (
    <PlanGate feature="inventoryOps">
      <SuppliersInner />
    </PlanGate>
  );
}

function SuppliersInner() {
  const { businessId, loading: bizLoading, error: bizError, isNoBusiness } = useBusinessId();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/suppliers?businessId=${businessId}&limit=50`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed to load suppliers");
      setSuppliers(j.data ?? []);
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
    setContactName("");
    setEmail("");
    setPhone("");
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(s: Supplier) {
    setEditing(s);
    setName(s.name);
    setContactName(s.contactName ?? "");
    setEmail(s.email ?? "");
    setPhone(s.phone ?? "");
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
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError("Invalid email");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        contactName: contactName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
      };
      const r = editing
        ? await fetch(`/api/suppliers?id=${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/suppliers", {
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
    if (!confirm("Delete this supplier? If it has stock orders it will be deactivated instead.")) return;
    const r = await fetch(`/api/suppliers?id=${id}`, { method: "DELETE" });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error ?? "Delete failed");
      return;
    }
    await load();
  }

  if (bizLoading || (loading && businessId)) {
    return <div className="flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading suppliers...</div>;
  }
  if (isNoBusiness || bizError) {
    return (
      <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe3] border border-[#e6dcc8]">
          <Store className="h-5 w-5 text-[#a89880]" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#3a2f22]">Set up your salon to manage suppliers</h3>
        <p className="mt-1 text-sm text-[#a89880]">{bizError ?? "Create your business profile first."}</p>
        <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#faf6ef] hover:bg-white/90">Go to Settings</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#3a2f22]">Suppliers</h1>
          <p className="text-sm text-[#a89880] mt-1">Who you order retail stock from. Stock orders reference these.</p>
        </div>
        <Button onClick={openCreate} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">
          <Plus className="h-4 w-4 mr-2" /> Add supplier
        </Button>
      </div>

      {error ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {error}</div>
      ) : suppliers.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center">
          <Truck className="h-6 w-6 text-[#a89880] mx-auto" />
          <p className="mt-2 text-sm text-[#a89880]">No suppliers yet. Add one, then create stock orders against it.</p>
          <Button onClick={openCreate} className="mt-4 bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">Add supplier</Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {suppliers.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-4">
              <div className="min-w-0">
                <p className="font-medium text-[#3a2f22] flex items-center gap-2">
                  <span className="truncate">{s.name}</span>
                  {!s.isActive && <span className="rounded-full bg-[#f3ebdd] px-2 py-0.5 text-xs text-[#a89880]">Inactive</span>}
                </p>
                <p className="text-xs text-[#a89880] mt-1 truncate">
                  {[s.contactName, s.email, s.phone].filter(Boolean).join(" · ") || "No contact details"}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <button onClick={() => openEdit(s)} className="p-2 rounded-lg border border-[#e6dcc8] bg-[#f6efe3] hover:bg-[#f3ebdd]" aria-label="Edit supplier">
                  <Pencil className="h-4 w-4 text-[#a89880]" />
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg border border-[#e6dcc8] bg-[#f6efe3] hover:bg-red-500/20" aria-label="Delete supplier">
                  <Trash2 className="h-4 w-4 text-red-300" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div className="bg-[#0F1729] rounded-xl border border-[#e6dcc8] p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[#3a2f22]">{editing ? "Edit supplier" : "New supplier"}</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Supplier name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Lanka Beauty Wholesale" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Contact person</label>
                  <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Nimal" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Phone</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="077 123 4567" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="orders@supplier.lk" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
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
