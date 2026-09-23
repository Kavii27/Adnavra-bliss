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
    return <div className="flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading business...</div>;
  }

  const isNoBusiness = !businessId || (error?.toLowerCase().includes("no business") ?? false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#3a2f22]">Team members</h1>
          <p className="text-sm text-[#a89880] mt-1">Manage your team. Staff you add here appear in the booking picker so customers can choose who they want.</p>
        </div>
        <Button onClick={openCreate} disabled={!businessId} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">
          <Plus className="h-4 w-4 mr-2" /> Add team member
        </Button>
      </div>

      {isNoBusiness ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center">
          <div className="mx-auto h-10 w-10 rounded-full bg-[#f6efe3] border border-[#e6dcc8] flex items-center justify-center">
            <Store className="h-5 w-5 text-[#a89880]" />
          </div>
          <h3 className="mt-3 text-sm font-medium text-[#3a2f22]">Set up your salon to add your team</h3>
          <p className="mt-1 text-sm text-[#a89880]">You have not created a business profile yet. Create it in Settings and you can add staff right after.</p>
          <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-[#faf6ef] hover:bg-white/90">Go to Settings</Link>
          {error && <p className="mt-3 text-xs text-[#a89880]">{error}</p>}
        </div>
      ) : error ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {error}</div>
      ) : loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading staff...</div>
      ) : staff.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center">
          <Users className="h-6 w-6 text-[#a89880] mx-auto" />
          <p className="mt-2 text-sm text-[#a89880]">No team members yet. Add your team so customers can book with a specific stylist.</p>
          <Button onClick={openCreate} className="mt-4 bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90"><Plus className="h-4 w-4 mr-2" /> Add team member</Button>
        </div>
      ) : (
        <>
          {/* Desktop table header */}
          <div className="mt-6 hidden md:grid grid-cols-[1fr_1fr_120px_140px] gap-4 px-4 py-2 text-xs uppercase tracking-wide text-[#a89880]">
            <span>Name</span>
            <span>Contact</span>
            <span>Permission</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="mt-2 grid gap-2">
            {staff.map((s) => (
              <div key={s.id} className="grid md:grid-cols-[1fr_1fr_120px_140px] gap-3 items-center rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-[#f3ebdd] border border-[#e6dcc8] flex items-center justify-center text-sm font-medium text-[#3a2f22] shrink-0">
                    {s.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[#3a2f22] truncate flex items-center gap-2">
                      {s.name}
                      {!s.isActive ? <span className="inline-flex items-center gap-1 rounded-full bg-[#f3ebdd] px-2 py-0.5 text-xs text-[#a89880]"><UserX className="h-3 w-3" /> Inactive</span> : <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300"><UserCheck className="h-3 w-3" /> Active</span>}
                    </p>
                    <p className="text-xs text-[#a89880] md:hidden flex flex-col gap-0.5 mt-0.5">
                      {s.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {s.email}</span>}
                      {s.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {s.phone}</span>}
                    </p>
                  </div>
                </div>
                <div className="hidden md:block text-sm text-[#a89880] min-w-0">
                  {s.email && <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3 shrink-0" /> {s.email}</span>}
                  {s.phone && <span className="flex items-center gap-1 truncate"><Phone className="h-3 w-3 shrink-0" /> {s.phone}</span>}
                  {!s.email && !s.phone && <span className="text-[#6B7280]">No contact details</span>}
                </div>
                <div className="flex md:block items-center gap-2">
                  <span className="md:hidden text-xs uppercase tracking-wide text-[#a89880]">Permission:</span>
                  <span className="text-sm text-[#a89880]">Team member</span>
                </div>
                <div className="flex items-center gap-2 md:justify-end">
                  <button onClick={() => toggleActive(s)} className="rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-1.5 text-xs font-medium text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]" title={s.isActive ? "Deactivate" : "Activate"}>
                    {s.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => openEdit(s)} className="p-2 rounded-lg border border-[#e6dcc8] bg-[#f6efe3] hover:bg-[#f3ebdd]"><Pencil className="h-4 w-4 text-[#a89880]" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg border border-[#e6dcc8] bg-[#f6efe3] hover:bg-red-500/20"><Trash2 className="h-4 w-4 text-red-300" /></button>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex gap-2">
              <Button variant="secondaryDark" disabled={page <= 1} onClick={() => businessId && loadStaff(businessId, page - 1)}>Prev</Button>
              <span className="text-sm text-[#a89880] py-2">Page {page} of {totalPages}</span>
              <Button variant="secondaryDark" disabled={page >= totalPages} onClick={() => businessId && loadStaff(businessId, page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div className="bg-[#0F1729] rounded-xl border border-[#e6dcc8] p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[#3a2f22]">{editing ? "Edit team member" : "New team member"}</h2>
            <p className="text-xs text-[#a89880] mt-1">Team members are scoped to your business only (businessId filtered server-side).</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ayesha Perera" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ayesha@salon.lk" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="077 123 4567" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
              <label className="flex items-center gap-2 text-sm text-[#a89880]"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-white" /> Active (visible for booking)</label>
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
