"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, Clock, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SERVICE_CATEGORIES } from "@/lib/categories";
import { ServiceImage } from "@/components/business/service-image";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  isActive: boolean;
  businessId: string;
  category: string | null;
  imageUrl?: string | null;
};

type Props = {
  businessId: string;
  businessSlug: string;
};

/**
 * Admin-side services manager (Task 3.3).
 * Same shape as the owner-facing service manager at
 * dashboard/catalog/service-menu (name, description, duration, price,
 * category), but parameterized with a businessId prop like the images
 * manager — calls POST/PATCH/DELETE /api/services with that businessId
 * under the ADMIN bypass instead of the session's own business.
 */
export function AdminBusinessServicesManager({ businessId, businessSlug }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/services?businessId=${businessId}&page=1&limit=100`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed to load services");
      setServices(j.data ?? []);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setDuration("30");
    setPrice("5000");
    setCategory("");
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
          body: JSON.stringify({
            name,
            description: description || null,
            durationMin: d,
            price: p,
            isActive,
            category: category || null,
          }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Update failed");
      } else {
        const r = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId,
            name,
            description: description || null,
            durationMin: d,
            price: p,
            isActive,
            category: category || null,
          }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Create failed");
      }
      setShowForm(false);
      await loadServices();
    } catch (e: unknown) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this service? If it has bookings it will be deactivated instead.")) return;
    const r = await fetch(`/api/services/${id}`, { method: "DELETE" });
    const j = await r.json().catch(() => null);
    if (!r.ok) {
      alert(j?.error ?? "Delete failed");
      return;
    }
    await loadServices();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#a89880]">
          {loading ? "Loading..." : `${services.length} service${services.length === 1 ? "" : "s"}`}
        </p>
        <Button onClick={openCreate} className="bg-[#8a6d4f] text-white hover:bg-[#5f4630]">
          <Plus className="mr-2 h-4 w-4" /> Add service
        </Button>
      </div>

      {error ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#FDECEC] bg-[#FDECEC] p-3 text-sm font-medium text-[#B91C1C]">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      ) : loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-[#a89880]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading services...
        </div>
      ) : services.length === 0 ? (
        <div className="mt-4 rounded-lg border border-[#E3E8F0] bg-white p-8 text-center">
          <p className="text-sm text-[#a89880]">No services yet. Add the salon&apos;s price list here.</p>
          <Button onClick={openCreate} className="mt-4 bg-[#8a6d4f] text-white hover:bg-[#5f4630]">
            Create service
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {services.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-[#E3E8F0] bg-white p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
              <ServiceImage name={s.name} category={s.category} imageUrl={s.imageUrl} className="h-14 w-14 rounded-lg" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-[#3a2f22]">{s.name}</p>
                  {!s.isActive && (
                    <span className="rounded-full bg-[#E7ECF2] px-2 py-0.5 text-xs text-[#a89880]">Inactive</span>
                  )}
                </div>
                {s.description && <p className="truncate text-sm text-[#a89880]">{s.description}</p>}
                <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#a89880]">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {s.duration} min
                  </span>
                  <span>{(s.price / 100).toLocaleString("en-LK", { style: "currency", currency: "LKR" })}</span>
                  {s.category && (
                    <span className="rounded-full bg-[#faf6ef] px-2 py-0.5 text-xs capitalize text-[#3a2f22]">
                      {SERVICE_CATEGORIES.find((c) => c.slug === s.category)?.label ?? s.category}
                    </span>
                  )}
                </p>
              </div>
              </div>
              <div className="ml-3 flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(s)}
                  aria-label={`Edit ${s.name}`}
                  className="rounded-lg border border-[#E3E8F0] bg-white p-2 hover:bg-[#faf6ef]"
                >
                  <Pencil className="h-4 w-4 text-[#a89880]" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  aria-label={`Delete ${s.name}`}
                  className="rounded-lg border border-[#E3E8F0] bg-white p-2 hover:bg-[#FDECEC]"
                >
                  <Trash2 className="h-4 w-4 text-[#B91C1C]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-[#a89880]">
        Public page:{" "}
        <a href={`/${businessSlug}`} className="font-medium text-[#8a6d4f] hover:underline">
          /{businessSlug}
        </a>
      </p>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-[#E3E8F0] bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-[#3a2f22]">{editing ? "Edit service" : "New service"}</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="admin-svc-name" className="text-sm font-medium text-[#3a2f22]">
                  Name *
                </label>
                <Input
                  id="admin-svc-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Haircut, Colour, Bridal..."
                  className="mt-1 bg-white"
                />
              </div>
              <div>
                <label htmlFor="admin-svc-desc" className="text-sm font-medium text-[#3a2f22]">
                  Description
                </label>
                <Input
                  id="admin-svc-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details"
                  className="mt-1 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="admin-svc-duration" className="text-sm font-medium text-[#3a2f22]">
                    Duration (min) *
                  </label>
                  <Input
                    id="admin-svc-duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    type="number"
                    min={5}
                    max={480}
                    className="mt-1 bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="admin-svc-price" className="text-sm font-medium text-[#3a2f22]">
                    Price (LKR) *
                  </label>
                  <Input
                    id="admin-svc-price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    type="number"
                    min={0}
                    className="mt-1 bg-white"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="admin-svc-category" className="text-sm font-medium text-[#3a2f22]">
                  Category
                </label>
                <select
                  id="admin-svc-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#E5DDD0] bg-white px-3 py-2 text-sm text-[#1F1E1D]"
                >
                  <option value="">No category</option>
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-[#475467]">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="accent-[#8a6d4f]"
                />
                Active (visible to customers)
              </label>
              {formError && (
                <p className="flex items-center gap-1 text-sm text-[#B91C1C]">
                  <AlertCircle className="h-4 w-4" /> {formError}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="border border-[#E3E8F0] bg-white text-[#3a2f22] hover:bg-[#faf6ef]"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-[#8a6d4f] text-white hover:bg-[#5f4630] disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" /> {editing ? "Save" : "Create"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
