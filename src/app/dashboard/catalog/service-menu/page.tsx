"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Loader2, AlertCircle, Pencil, Trash2, Plus, Clock, Check, Store, Layers } from "lucide-react";
import { SERVICE_CATEGORIES } from "@/lib/categories";
import { StyledNativeSelect } from "@/components/ui/select";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  isActive: boolean;
  businessId: string;
  category: string | null;
};

export default function ServiceMenuPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("5000");
  const [category, setCategory] = useState("");
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

  async function loadServices(bId: string, p = 1) {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/services?businessId=${bId}&page=${p}&limit=50`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed to load services");
      setServices(j.data ?? []);
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
    if (businessId) loadServices(businessId, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const categoriesInUse = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of services) {
      if (!s.category) continue;
      map.set(s.category, (map.get(s.category) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([slug, count]) => ({
      slug,
      label: SERVICE_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug,
      count,
    }));
  }, [services]);

  const filtered = useMemo(() => {
    if (!selectedCategory) return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setDuration("30");
    setPrice("5000");
    setCategory(selectedCategory ?? "");
    setIsActive(true);
    setFormError(null);
    setShowForm(true);
  }
  function openEdit(s: Service) {
    setEditing(s);
    setName(s.name);
    setDescription(s.description ?? "");
    setDuration(String(s.duration));
    setPrice(String(s.price / 100));
    setCategory(s.category ?? "");
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
    const d = parseInt(duration, 10);
    const p = parseFloat(price);
    if (Number.isNaN(d) || d < 5 || d > 480) {
      setFormError("Duration must be 5-480 minutes");
      return;
    }
    if (Number.isNaN(p) || p < 0) {
      setFormError("Price must be >= 0");
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        const r = await fetch(`/api/services/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description: description || null, durationMin: d, price: p, isActive, category: category || null }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Update failed");
      } else {
        const r = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId, name, description: description || null, durationMin: d, price: p, isActive, category: category || null }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Create failed");
      }
      setShowForm(false);
      if (businessId) await loadServices(businessId, 1);
    } catch (e: unknown) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this service? If it has bookings it will be deactivated instead.")) return;
    const r = await fetch(`/api/services/${id}`, { method: "DELETE" });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error ?? "Delete failed");
      return;
    }
    if (businessId) await loadServices(businessId, page);
  }

  if (loading && !businessId) {
    return <div className="flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading business...</div>;
  }

  const isNoBusiness = !businessId || (error?.toLowerCase().includes("no business") ?? false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#3a2f22]">Service menu</h1>
          <p className="text-sm text-[#a89880] mt-1">Services customers can book on your public page.</p>
        </div>
        <Button onClick={openCreate} disabled={!businessId} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">
          <Plus className="h-4 w-4 mr-2" /> Add service
        </Button>
      </div>

      {isNoBusiness ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center">
          <div className="mx-auto h-10 w-10 rounded-full bg-[#f6efe3] border border-[#e6dcc8] flex items-center justify-center">
            <Store className="h-5 w-5 text-[#a89880]" />
          </div>
          <h3 className="mt-3 text-sm font-medium text-[#3a2f22]">Set up your salon to add services</h3>
          <p className="mt-1 text-sm text-[#a89880]">You have not created a business profile yet. Create it in Settings and you can add services right after.</p>
          <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-[#faf6ef] hover:bg-white/90">
            Go to Settings
          </Link>
          {error && <p className="mt-3 text-xs text-[#a89880]">{error}</p>}
        </div>
      ) : error ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {error}</div>
      ) : loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading services...</div>
      ) : (
        <div className="mt-6 flex flex-col lg:flex-row gap-6">
          {/* Categories mini-panel */}
          <div className="w-full lg:w-56 shrink-0">
            <div className="rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#a89880] px-2 py-1 flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> Categories</p>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`mt-2 w-full text-left rounded-lg px-3 py-2 text-sm flex items-center justify-between ${selectedCategory === null ? "bg-[#8a6d4f] text-[#ffffff] font-medium" : "text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]"}`}
              >
                <span>All categories</span>
                <span className={`text-xs rounded-full px-1.5 py-0.5 ${selectedCategory === null ? "bg-black/10" : "bg-[#f3ebdd]"}`}>{services.length}</span>
              </button>
              {categoriesInUse.length === 0 ? (
                <p className="mt-3 px-3 text-xs text-[#a89880]">No categories yet. Add a category when creating a service.</p>
              ) : (
                <div className="mt-1 space-y-0.5">
                  {categoriesInUse.map((c) => (
                    <button
                      key={c.slug}
                      onClick={() => setSelectedCategory(c.slug)}
                      className={`w-full text-left rounded-lg px-3 py-2 text-sm flex items-center justify-between ${selectedCategory === c.slug ? "bg-[#8a6d4f] text-[#ffffff] font-medium" : "text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]"}`}
                    >
                      <span className="capitalize truncate">{c.label}</span>
                      <span className={`text-xs rounded-full px-1.5 py-0.5 shrink-0 ml-2 ${selectedCategory === c.slug ? "bg-black/10" : "bg-[#f3ebdd]"}`}>{c.count}</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-3 px-3 text-xs text-[#a89880]">To add a category, choose or type a new value when creating or editing a service.</p>
            </div>
          </div>

          {/* Services list */}
          <div className="flex-1 min-w-0">
            {services.length === 0 ? (
              <div className="rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center">
                <p className="text-sm text-[#a89880]">No services yet. Create your first service to start taking bookings.</p>
                <Button onClick={openCreate} className="mt-4 bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">Create service</Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center">
                <p className="text-sm text-[#a89880]">No services in this category.</p>
                <button onClick={() => setSelectedCategory(null)} className="mt-2 text-sm text-[#3a2f22] underline">Show all</button>
              </div>
            ) : (
              <>
                <div className="grid gap-3">
                  {filtered.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[#3a2f22] truncate">{s.name}</p>
                          {!s.isActive && <span className="rounded-full bg-[#f3ebdd] px-2 py-0.5 text-xs text-[#a89880]">Inactive</span>}
                        </div>
                        {s.description && <p className="text-sm text-[#a89880] truncate">{s.description}</p>}
                        <p className="text-xs text-[#a89880] flex items-center gap-3 mt-1 flex-wrap">
                          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {s.duration} min</span>
                          <span>{(s.price / 100).toLocaleString("en-LK", { style: "currency", currency: "LKR" })}</span>
                          {s.category && <span className="rounded-full bg-[#f3ebdd] px-2 py-0.5 text-xs capitalize text-[#3a2f22]">{SERVICE_CATEGORIES.find((c) => c.slug === s.category)?.label ?? s.category}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <button onClick={() => openEdit(s)} className="p-2 rounded-lg border border-[#e6dcc8] bg-[#f6efe3] hover:bg-[#f3ebdd]">
                          <Pencil className="h-4 w-4 text-[#a89880]" />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg border border-[#e6dcc8] bg-[#f6efe3] hover:bg-red-500/20">
                          <Trash2 className="h-4 w-4 text-red-300" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-4 flex gap-2">
                    <Button variant="secondaryDark" disabled={page <= 1} onClick={() => businessId && loadServices(businessId, page - 1)}>Prev</Button>
                    <span className="text-sm text-[#a89880] py-2">Page {page} of {totalPages}</span>
                    <Button variant="secondaryDark" disabled={page >= totalPages} onClick={() => businessId && loadServices(businessId, page + 1)}>Next</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div className="bg-[#0F1729] rounded-xl border border-[#e6dcc8] p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[#3a2f22]">{editing ? "Edit service" : "New service"}</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Haircut, Colour, Bridal..." className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Description</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Duration (min) *</label>
                  <Input value={duration} onChange={(e) => setDuration(e.target.value)} type="number" min={5} max={480} className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Price (LKR) *</label>
                  <Input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min={0} className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Category</label>
                <div className="mt-1 flex gap-2">
                  <StyledNativeSelect aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} wrapperClassName="flex-1" className="w-full">
                    <option value="">No category</option>
                    {SERVICE_CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.label}</option>
                    ))}
                  </StyledNativeSelect>
                </div>
                <p className="text-xs text-[#a89880] mt-1">Or type a new category name directly in the list above via the service form. Using a new value creates it automatically.</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-[#a89880]"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-white" /> Active (visible to customers)</label>
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
