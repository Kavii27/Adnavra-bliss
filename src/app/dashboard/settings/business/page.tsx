"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { ImageUploader } from "@/components/dashboard/image-uploader";
import { isBusinessTypeSlug } from "@/lib/categories";
import { SalonTypePicker } from "@/components/business/category-picker";
// isBusinessTypeSlug is kept only for reading legacy rows whose type slugs
// still sit inside `categories` (pre-salonTypes-migration backfill).
import { Loader2, AlertCircle, Check, Store, Link as LinkIcon, ArrowLeft, Building2, Plus, Trash2 } from "lucide-react";

type Branch = { name: string; address: string };
type BusinessImageRow = { id: string; url: string; kind: string; position: number };

export default function BusinessSetupPage() {
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<Record<string, unknown> | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [salonTypes, setSalonTypes] = useState<string[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState<string | null>(null);
  const [branchesSaving, setBranchesSaving] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchAddress, setNewBranchAddress] = useState("");
  const [images, setImages] = useState<BusinessImageRow[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/businesses");
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed to load");
      if (j.data?.length > 0) {
        const b = j.data[0];
        setBusiness(b);
        setBusinessId(b.id);
        setName(b.name ?? "");
        setSlug(b.slug ?? "");
        setDescription(b.description ?? "");
        setPhone(b.phone ?? "");
        setEmail(b.email ?? "");
        setAddress(b.address ?? "");
        setLogoUrl(b.logoUrl ?? "");
        // Prefer the dedicated salonTypes column; fall back to legacy rows
        // where type slugs still sit inside categories (pre-migration).
        if (Array.isArray(b.salonTypes)) {
          setSalonTypes((b.salonTypes as unknown[]).filter((c): c is string => typeof c === "string"));
        } else {
          setSalonTypes(Array.isArray(b.categories) ? (b.categories as unknown[]).filter((c): c is string => typeof c === "string" && isBusinessTypeSlug(c)) : []);
        }
      } else {
        setBusiness(null);
        setBusinessId(null);
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    setBranchesLoading(true);
    setBranchesError(null);
    fetch(`/api/business-settings?businessId=${businessId}&key=branches`)
      .then(async (r) => {
        const j = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          if (j.error === "upgrade_required") return; // gated UI handles display
          throw new Error(j.error ?? "Failed to load branches");
        }
        const row = Array.isArray(j.data) ? j.data[0] : null;
        const v = (row?.value ?? {}) as { branches?: Branch[] };
        setBranches(Array.isArray(v.branches) ? v.branches : []);
      })
      .catch((e: unknown) => {
        if (!cancelled) setBranchesError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setBranchesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  useEffect(() => {
    if (!businessId) {
      setImages([]);
      return;
    }
    let cancelled = false;
    setImagesLoading(true);
    setImagesError(null);
    fetch(`/api/businesses/${businessId}/images`)
      .then(async (r) => {
        const j = await r.json();
        if (cancelled) return;
        if (!r.ok) throw new Error(j.error ?? "Failed to load photos");
        setImages(Array.isArray(j.data?.images) ? j.data.images : []);
      })
      .catch((e: unknown) => {
        if (!cancelled) setImagesError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setImagesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  async function handleDeleteImage(imageId: string) {
    if (!businessId) return;
    setDeletingImageId(imageId);
    setImagesError(null);
    try {
      const r = await fetch(`/api/businesses/${businessId}/images?imageId=${encodeURIComponent(imageId)}`, {
        method: "DELETE",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Delete failed");
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (e: unknown) {
      setImagesError((e as Error).message);
    } finally {
      setDeletingImageId(null);
    }
  }

  async function handleSaveBranches(next: Branch[]) {
    if (!businessId) return;
    setBranchesSaving(true);
    setBranchesError(null);
    try {
      const r = await fetch("/api/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, key: "branches", value: { branches: next } }),
      });
      const j = await r.json();
      if (!r.ok) {
        throw new Error(
          j.error === "upgrade_required"
            ? "Multiple branches need the Premium plan."
            : (j.error ?? "Save failed"),
        );
      }
      setBranches(next);
    } catch (e: unknown) {
      setBranchesError((e as Error).message);
    } finally {
      setBranchesSaving(false);
    }
  }

  // Salon-type edits go through the shared SalonTypePicker (same component
  // the admin detail page uses) — the 4-slot cap lives inside it.

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    // Preserve openingHours as-is from loaded business so we do not wipe it when saving identity fields only
    let openingHours: unknown = undefined;
    if (business && typeof (business as Record<string, unknown>).openingHours !== "undefined") {
      openingHours = (business as Record<string, unknown>).openingHours;
    }
    // Salon types live in their own `salonTypes` column — no merging with
    // the onboarding `categories` column.
    const payload: Record<string, unknown> = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description || null,
      phone: phone || null,
      email: email || null,
      address: address || null,
      logoUrl: logoUrl || null,
      salonTypes,
    };
    // Only send openingHours if it existed, to avoid overwriting with undefined on create path where hours not yet set
    // For PATCH we include it only if we have it; for POST without hours we omit so server default applies
    if (openingHours !== undefined && businessId) {
      payload.openingHours = openingHours;
    }

    try {
      const url = businessId ? `/api/businesses/${businessId}` : "/api/businesses";
      const method = businessId ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? JSON.stringify(j.details ?? j));
      setSuccess(true);
      await load();
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-[#0F1729] min-h-full px-6 py-8">
        <div className="flex items-center gap-2 text-sm text-[#a89880]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading business profile...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0F1729] min-h-full px-6 py-8">
      <div className="max-w-2xl">
        <Link href="/dashboard/settings" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#a89880] hover:text-[#3a2f22] mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Settings
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center border border-[#e6dcc8]">
            <Store className="h-5 w-5 text-[#faf6ef]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#3a2f22]">{businessId ? "Business setup" : "Create your salon profile"}</h1>
            <p className="text-sm text-[#a89880] mt-1">
              {businessId ? "Update your public booking page, contact and logo. Hours are in Scheduling." : "Set up your salon to start taking bookings. You can add hours in Scheduling after."}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}
        {success && (
          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
            <Check className="h-4 w-4" /> Saved successfully
          </div>
        )}

        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[#3a2f22]">Salon name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Glow Salon"
                className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880] focus:border-white/20 focus:ring-white/10"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#3a2f22] flex items-center gap-1">
                <LinkIcon className="h-3.5 w-3.5" /> Public URL slug *
              </label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[#a89880]">/ </span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="glow-salon"
                  className="bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880] focus:border-white/20 focus:ring-white/10"
                />
              </div>
              {slug && <p className="text-xs text-[#a89880] mt-1">Public page: /{slug}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[#3a2f22]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What makes your salon special?"
              className="mt-1 w-full rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm text-[#3a2f22] placeholder:text-[#a89880] focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[#3a2f22]">Phone</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+94 ..."
                className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880] focus:border-white/20 focus:ring-white/10"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#3a2f22]">Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hello@..."
                className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880] focus:border-white/20 focus:ring-white/10"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[#3a2f22]">Address</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city..."
              className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880] focus:border-white/20 focus:ring-white/10"
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-[#3a2f22]">Salon type</legend>
            <p className="mt-0.5 text-xs text-[#a89880]">
              Shown as tags on your marketplace card and public page. Pick up to 4.
            </p>
            <div className="mt-2">
              <SalonTypePicker value={salonTypes} onChange={setSalonTypes} idPrefix="owner-salon-type" />
            </div>
          </fieldset>

          <div>
            <label className="text-sm font-medium text-[#3a2f22]">Logo</label>
            <div className="mt-2 flex items-center gap-4">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Salon logo preview"
                  className="h-16 w-16 rounded-full object-cover border border-[#e6dcc8] shrink-0"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-[#faf6ef] border border-[#e6dcc8] flex items-center justify-center shrink-0">
                  <Store className="h-6 w-6 text-[#a89880]" />
                </div>
              )}
              <div>
                {businessId ? (
                  <ImageUploader
                    businessId={businessId}
                    kind="logo"
                    buttonLabel="Upload logo"
                    onUploaded={(url) => setLogoUrl(url)}
                  />
                ) : (
                  <p className="text-xs text-[#a89880]">Create your salon profile first, then upload a logo.</p>
                )}
                <p className="text-xs text-[#a89880] mt-1">At least 512px wide. JPG, PNG, or WebP, up to 8MB.</p>
              </div>
            </div>
            <Input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              aria-label="Logo image URL"
              className="mt-2 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880] focus:border-white/20 focus:ring-white/10"
            />
            <p className="text-xs text-[#a89880] mt-1">Uploaded automatically on save, or paste an image URL instead.</p>
          </div>

          {businessId && (
            <div className="rounded-xl border border-[#e6dcc8] bg-[#faf6ef] p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#3a2f22]">Cover photo</h3>
                <p className="text-xs text-[#a89880] mt-0.5">Shown at the top of your public booking page. Uploading replaces the current one.</p>
              </div>
              {imagesLoading ? (
                <p className="flex items-center gap-2 text-sm text-[#a89880]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading photos...
                </p>
              ) : (
                <>
                  {imagesError && (
                    <p className="flex items-center gap-2 text-sm text-red-300">
                      <AlertCircle className="h-4 w-4" /> {imagesError}
                    </p>
                  )}
                  {images
                    .filter((img) => img.kind === "cover")
                    .map((img) => (
                      <div key={img.id} className="relative overflow-hidden rounded-lg border border-[#e6dcc8]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="Salon cover photo" className="h-40 w-full object-cover" />
                        <button
                          type="button"
                          aria-label="Remove cover photo"
                          disabled={deletingImageId === img.id}
                          onClick={() => handleDeleteImage(img.id)}
                          className="absolute right-2 top-2 rounded-lg bg-black/50 p-2 text-white hover:bg-black/70 disabled:opacity-50"
                        >
                          {deletingImageId === img.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  <ImageUploader
                    businessId={businessId}
                    kind="cover"
                    buttonLabel="Upload cover photo"
                    onUploaded={(_url, image) =>
                      setImages((prev) => [
                        ...prev.filter((img) => img.kind !== "cover"),
                        ...(image ? [image] : []),
                      ])
                    }
                  />
                  <div className="pt-1">
                    <h3 className="text-sm font-semibold text-[#3a2f22]">
                      Gallery {images.filter((img) => img.kind === "gallery").length > 0 && (
                        <span className="font-normal text-[#a89880]">
                          ({images.filter((img) => img.kind === "gallery").length}/12)
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-[#a89880] mt-0.5">Extra photos shown on your public booking page.</p>
                  </div>
                  {images.filter((img) => img.kind === "gallery").length === 0 ? (
                    <p className="text-sm text-[#a89880]">No gallery photos yet.</p>
                  ) : (
                    <ul className="grid grid-cols-3 gap-2">
                      {images
                        .filter((img) => img.kind === "gallery")
                        .map((img) => (
                          <li key={img.id} className="relative overflow-hidden rounded-lg border border-[#e6dcc8]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt="Salon gallery photo" className="h-20 w-full object-cover" />
                            <button
                              type="button"
                              aria-label="Remove gallery photo"
                              disabled={deletingImageId === img.id}
                              onClick={() => handleDeleteImage(img.id)}
                              className="absolute right-1 top-1 rounded-md bg-black/50 p-1.5 text-white hover:bg-black/70 disabled:opacity-50"
                            >
                              {deletingImageId === img.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                  <ImageUploader
                    businessId={businessId}
                    kind="gallery"
                    buttonLabel="Add gallery photo"
                    onUploaded={(_url, image) => image && setImages((prev) => [...prev, image])}
                  />
                </>
              )}
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving || !name.trim() || !slug.trim()}
            className="w-full bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...
              </>
            ) : businessId ? (
              "Save changes"
            ) : (
              "Create salon profile"
            )}
          </Button>

          {business && (
            <p className="text-xs text-center text-[#a89880]">
              Public page:{" "}
              <a href={`/${slug}`} className="text-[#3a2f22] hover:underline">
                /{slug}
              </a>{" "}
              ·{" "}
              <a href={`/${slug}/book`} className="text-[#3a2f22] hover:underline">
                /{slug}/book
              </a>
            </p>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#a89880]" />
            <h2 className="text-sm font-semibold text-[#3a2f22]">Additional branches</h2>
            <span className="rounded-full bg-[#8a6d4f] px-2 py-0.5 text-[10px] font-bold text-white">PREMIUM</span>
          </div>
          <p className="text-xs text-[#a89880] mt-1">Run more than one location under the same ADNAVRA account.</p>
          <PlanGate feature="multiBranch">
            {!businessId ? (
              <p className="mt-4 text-sm text-[#a89880]">Create your salon profile first, then add branches.</p>
            ) : branchesLoading ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading branches...</p>
            ) : (
              <div className="mt-4 space-y-3">
                {branchesError && (
                  <p className="flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {branchesError}</p>
                )}
                {branches.length === 0 ? (
                  <p className="text-sm text-[#a89880]">No extra branches yet. Your main address above is branch #1.</p>
                ) : (
                  <ul className="space-y-2">
                    {branches.map((b, i) => (
                      <li key={`${b.name}-${i}`} className="flex items-center justify-between gap-2 rounded-lg border border-[#e6dcc8] bg-[#faf6ef] px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#3a2f22]">{b.name}</p>
                          {b.address && <p className="truncate text-xs text-[#a89880]">{b.address}</p>}
                        </div>
                        <button
                          aria-label={`Remove ${b.name}`}
                          disabled={branchesSaving}
                          onClick={() => handleSaveBranches(branches.filter((_, j) => j !== i))}
                          className="rounded-lg border border-[#e6dcc8] p-2 hover:bg-red-500/20 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4 text-red-300" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Input
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    placeholder="Branch name — e.g. Colombo 03"
                    className="bg-[#faf6ef] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]"
                  />
                  <Input
                    value={newBranchAddress}
                    onChange={(e) => setNewBranchAddress(e.target.value)}
                    placeholder="Branch address (optional)"
                    className="bg-[#faf6ef] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]"
                  />
                  <Button
                    disabled={branchesSaving || !newBranchName.trim()}
                    onClick={() => {
                      handleSaveBranches([...branches, { name: newBranchName.trim(), address: newBranchAddress.trim() }]);
                      setNewBranchName("");
                      setNewBranchAddress("");
                    }}
                    className="bg-[#8a6d4f] text-white hover:bg-white/90 disabled:opacity-50"
                  >
                    {branchesSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Add</>}
                  </Button>
                </div>
              </div>
            )}
          </PlanGate>
        </div>

        {businessId && slug && (
          <div className="mt-6 text-center flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/dashboard/qr-code" className="text-sm font-medium text-[#3a2f22] hover:underline">
              View and download your booking QR code →
            </Link>
            <span className="hidden sm:inline text-[#a89880]">·</span>
            <Link href="/dashboard/settings/scheduling" className="text-sm font-medium text-[#a89880] hover:text-[#3a2f22] hover:underline">
              Edit opening hours →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
