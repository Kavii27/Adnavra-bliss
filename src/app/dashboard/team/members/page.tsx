"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Loader2, AlertCircle, Pencil, Trash2, Plus, Check, Users, Mail, Phone, UserCheck, UserX, Store } from "lucide-react";
import { PlanGate } from "@/components/dashboard/plan-gate";

type Staff = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  businessId: string;
  createdAt: string;
};

export default function TeamMembersPage() {
  return (
    <PlanGate feature="staffManagement">
      <TeamMembersPageInner />
    </PlanGate>
  );
}

function TeamMembersPageInner() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadBusiness() {
    const r = await fetch("/api/businesses");
    const j = await r.json();
    if (r.ok && j.data?.[0]?.id) setBusinessId(j.data[0].id);
    else {
      setBusinessId(null);
      setError("No business linked. Create your business in Settings first.");
      setLoading(false);
    }
  }

  async function loadStaff(bId: string, p = 1) {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/staff?businessId=${bId}&page=${p}&limit=20`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed to load staff");
      setStaff(j.data ?? []);
      setTotalPages(j.pagination?.pages ?? 1);
      setPage(j.pagination?.page ?? 1);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBusiness();
  }, []);

  useEffect(() => {
    if (businessId) loadStaff(businessId, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  function openCreate() {
    setEditing(null);
    setName("");
    setEmail("");
    setPhone("");
    setIsActive(true);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(s: Staff) {
    setEditing(s);
    setName(s.name);
    setEmail(s.email ?? "");
    setPhone(s.phone ?? "");
    setIsActive(s.isActive);
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
    if (email.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError("Invalid email");
      return;
    }
    if (phone.trim() !== "" && phone.trim().length < 7) {
      setFormError("Phone must be at least 7 characters");
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        const r = await fetch(`/api/staff/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim() === "" ? null : email.trim(),
            phone: phone.trim() === "" ? null : phone.trim(),
            isActive,
          }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Update failed");
      } else {
        const r = await fetch(`/api/staff`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId,
            name: name.trim(),
            email: email.trim() === "" ? null : email.trim(),
            phone: phone.trim() === "" ? null : phone.trim(),
            isActive,
          }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Create failed");
      }
      setShowForm(false);
      if (businessId) await loadStaff(businessId, 1);
    } catch (e: unknown) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this staff member? If they have bookings they will be deactivated instead.")) return;
    const r = await fetch(`/api/staff/${id}`, { method: "DELETE" });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error ?? "Delete failed");
      return;
    }
    if (businessId) await loadStaff(businessId, page);
  }

  async function toggleActive(s: Staff) {
    const r = await fetch(`/api/staff/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error ?? "Update failed");
      return;
    }
    if (businessId) await loadStaff(businessId, page);
  }

  if (loading && !businessId) {
    return <div className="flex items-center gap-2 text-sm text-[#8A8377]"><Loader2 className="h-4 w-4 animate-spin" /> Loading business...</div>;
  }

  const isNoBusiness = !businessId || (error?.toLowerCase().includes("no business") ?? false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#9A7B4F" }}>Team</p>
          <h1 className="font-[family-name:var(--font-display)] mt-1 text-3xl font-medium tracking-tight text-[#1F1B17]">Team members</h1>
          <p className="text-sm text-[#8A8377] mt-1.5">Manage your team. Staff you add here appear in the booking picker so customers can choose who they want.</p>
        </div>
        <button
          onClick={openCreate}
          disabled={!businessId}
          className="inline-flex items-center rounded-full bg-[#1F1B17] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#795831] disabled:opacity-40"
        >
          <Plus className="h-4 w-4 mr-2" /> Add team member
        </button>
      </div>

      {isNoBusiness ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#E5DDD0] bg-white p-10 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, #D9BE8C, #C9A467)" }}
          >
            <Store className="h-6 w-6 text-[#1B1714]" />
          </div>
          <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold text-[#1F1B17]">Set up your salon to add your team</h3>
          <p className="mt-1.5 text-sm text-[#8A8377]">You have not created a business profile yet. Create it in Settings and you can add staff right after.</p>
          <Link href="/dashboard/settings" className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#1F1B17] px-7 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#795831]">Go to Settings</Link>
          {error && <p className="mt-3 text-xs text-[#8A8377]">{error}</p>}
        </div>
      ) : error ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-500"><AlertCircle className="h-4 w-4" /> {error}</div>
      ) : loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-[#8A8377]"><Loader2 className="h-4 w-4 animate-spin" /> Loading staff...</div>
      ) : staff.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#E5DDD0] bg-white p-10 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, #D9BE8C, #C9A467)" }}
          >
            <Users className="h-6 w-6 text-[#1B1714]" />
          </div>
          <p className="mt-4 text-sm text-[#8A8377]">No team members yet. Add your team so customers can book with a specific stylist.</p>
          <button onClick={openCreate} className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#1F1B17] px-7 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#795831]"><Plus className="h-4 w-4 mr-2" /> Add team member</button>
        </div>
      ) : (
        <>
          {/* Desktop table header */}
          <div className="mt-6 hidden md:grid grid-cols-[1fr_1fr_120px_140px] gap-4 px-4 py-2 text-xs uppercase tracking-wide text-[#8A8377]">
            <span>Name</span>
            <span>Contact</span>
            <span>Permission</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="mt-2 grid gap-2">
            {staff.map((s) => (
              <div key={s.id} className="grid md:grid-cols-[1fr_1fr_120px_140px] gap-3 items-center rounded-2xl border border-[#E9E1D3] bg-white p-4 shadow-[0_4px_20px_rgba(30,28,26,0.05)]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full border-2 border-[#D9BE8C] bg-[#FBF7EF] flex items-center justify-center text-sm font-medium text-[#1F1E1D] shrink-0">
                    {s.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[#1F1E1D] truncate flex items-center gap-2">
                      {s.name}
                      {!s.isActive ? <span className="inline-flex items-center gap-1 rounded-full bg-[#FBF7EF] px-2 py-0.5 text-xs text-[#8A8377]"><UserX className="h-3 w-3" /> Inactive</span> : <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700"><UserCheck className="h-3 w-3" /> Active</span>}
                    </p>
                    <p className="text-xs text-[#8A8377] md:hidden flex flex-col gap-0.5 mt-0.5">
                      {s.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {s.email}</span>}
                      {s.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {s.phone}</span>}
                    </p>
                  </div>
                </div>
                <div className="hidden md:block text-sm text-[#8A8377] min-w-0">
                  {s.email && <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3 shrink-0" /> {s.email}</span>}
                  {s.phone && <span className="flex items-center gap-1 truncate"><Phone className="h-3 w-3 shrink-0" /> {s.phone}</span>}
                  {!s.email && !s.phone && <span className="text-[#B4AC9E]">No contact details</span>}
                </div>
                <div className="flex md:block items-center gap-2">
                  <span className="md:hidden text-xs uppercase tracking-wide text-[#8A8377]">Permission:</span>
                  <span className="text-sm text-[#8A8377]">Team member</span>
                </div>
                <div className="flex items-center gap-2 md:justify-end">
                  <button onClick={() => toggleActive(s)} className="rounded-md border border-[#E9E1D3] bg-white px-3 py-1.5 text-xs font-medium text-[#8A8377] hover:bg-[#FBF7EF] hover:text-[#1F1E1D]" title={s.isActive ? "Deactivate" : "Activate"}>
                    {s.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => openEdit(s)} className="p-2 rounded-lg border border-[#E9E1D3] bg-white hover:bg-[#FBF7EF]"><Pencil className="h-4 w-4 text-[#8A8377]" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg border border-[#E9E1D3] bg-white hover:bg-red-50"><Trash2 className="h-4 w-4 text-red-500" /></button>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => businessId && loadStaff(businessId, page - 1)} className="rounded-lg border border-[#E5DDD0] bg-white px-3 py-1.5 text-sm font-medium text-[#1F1E1D] hover:bg-[#FBF7EF] disabled:opacity-40 shadow-sm">Prev</button>
              <span className="text-sm text-[#8A8377] py-2">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => businessId && loadStaff(businessId, page + 1)} className="rounded-lg border border-[#E5DDD0] bg-white px-3 py-1.5 text-sm font-medium text-[#1F1E1D] hover:bg-[#FBF7EF] disabled:opacity-40 shadow-sm">Next</button>
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl border border-[#E9E1D3] p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[#1F1E1D]">{editing ? "Edit team member" : "New team member"}</h2>
            <p className="text-xs text-[#8A8377] mt-1">Team members are scoped to your business only (businessId filtered server-side).</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#1F1E1D]">Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ayesha Perera" className="mt-1 bg-[#FBF7EF] border-[#E9E1D3] text-[#1F1E1D] placeholder:text-[#8A8377]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1F1E1D]">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ayesha@salon.lk" className="mt-1 bg-[#FBF7EF] border-[#E9E1D3] text-[#1F1E1D] placeholder:text-[#8A8377]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1F1E1D]">Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="077 123 4567" className="mt-1 bg-[#FBF7EF] border-[#E9E1D3] text-[#1F1E1D] placeholder:text-[#8A8377]" />
              </div>
              <label className="flex items-center gap-2 text-sm text-[#8A8377]"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-[#795831]" /> Active (visible for booking)</label>
              {formError && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="inline-flex items-center rounded-full border border-[#E5DDD0] bg-white px-4 py-2 text-sm font-medium text-[#4A4640] hover:bg-[#FBF7EF]">Cancel</button>
                <Button onClick={handleSubmit} disabled={submitting} className="bg-[#1F1B17] text-white hover:bg-[#795831]">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> {editing ? "Save" : "Create"}</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
