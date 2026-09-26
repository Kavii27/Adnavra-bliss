"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageOff, Loader2, Upload, X } from "lucide-react";

type Rule = { slug: string; keywords: string[]; hasImage: boolean; imageUrl: string };
type CategoryGroup = { category: string; hasDefault: boolean; defaultUrl: string; rules: Rule[] };
type Inventory = { categories: CategoryGroup[]; globalDefault: { hasImage: boolean; imageUrl: string } };

const CATEGORY_LABELS: Record<string, string> = {
  "hair-styling": "Hair & styling",
  nails: "Nails",
  "hair-removal": "Hair removal",
  "eyebrows-eyelashes": "Eyebrows & eyelashes",
  "facials-skincare": "Facials & skincare",
  massage: "Massage",
  "spa-wellness": "Spa & wellness",
  makeup: "Makeup",
};

function labelFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ServiceImageManager() {
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/service-images");
      const json = (await res.json().catch(() => null)) as { data?: Inventory; error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Failed to load treatment photos");
      if (!json?.data) throw new Error("Failed to load treatment photos");
      const data: Inventory = json.data;
      setInventory(data);
      setActiveCategory((prev) => prev ?? data.categories[0]?.category ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load treatment photos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(key: string, target: "slug" | "category" | "default", category: string, slug: string, file: File) {
    setBusyKey(key);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("target", target);
      body.append("category", category);
      if (target === "slug") body.append("slug", slug);
      const res = await fetch("/api/admin/service-images", { method: "POST", body });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Upload failed");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusyKey(null);
    }
  }

  async function remove(key: string, category: string, slug: string) {
    if (!confirm("Remove this photo? The treatment will fall back to its category's general photo.")) return;
    setBusyKey(key);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/service-images?target=slug&category=${encodeURIComponent(category)}&slug=${encodeURIComponent(slug)}`,
        { method: "DELETE" },
      );
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Remove failed");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Remove failed");
    } finally {
      setBusyKey(null);
    }
  }

  if (loading) {
    return (
      <div className="mt-6 flex items-center gap-2 text-sm text-[#a89880]">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading treatment photos...
      </div>
    );
  }
  if (error && !inventory) {
    return (
      <div className="mt-6 rounded-xl border border-[#FDECEC] bg-[#FDECEC] p-4">
        <p className="text-sm font-medium text-[#B91C1C]">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-3 inline-flex h-9 items-center rounded-lg border border-[#E3E8F0] bg-white px-3.5 text-xs font-medium text-[#5F4426] transition hover:bg-[#faf6ef]"
        >
          Try again
        </button>
      </div>
    );
  }
  if (!inventory) return null;

  const group = inventory.categories.find((c) => c.category === activeCategory) ?? inventory.categories[0];
  const totalRules = inventory.categories.reduce((n, c) => n + c.rules.length, 0);
  const totalWithImage = inventory.categories.reduce((n, c) => n + c.rules.filter((r) => r.hasImage).length, 0);

  return (
    <div className="mt-6">
      {error && <p className="mb-3 text-sm font-medium text-[#B91C1C]">{error}</p>}
      <p className="mb-4 text-xs font-medium text-[#a89880]">
        {totalWithImage} of {totalRules} treatments have their own specific photo. The rest use their
        category&apos;s general photo below.
      </p>

      <div className="flex flex-wrap gap-1.5 border-b border-[#E3E8F0] pb-3">
        {inventory.categories.map((c) => (
          <button
            key={c.category}
            type="button"
            onClick={() => setActiveCategory(c.category)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              activeCategory === c.category ? "bg-[#3a2f22] text-white" : "bg-[#F3EEE4] text-[#5F4426] hover:bg-[#e9e1d3]"
            }`}
          >
            {CATEGORY_LABELS[c.category] ?? c.category} ({c.rules.filter((r) => r.hasImage).length}/{c.rules.length})
          </button>
        ))}
      </div>

      {group && (
        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[#E3E8F0] bg-[#faf6ef] p-3">
            <div className="flex min-w-0 items-center gap-3">
              <ImagePreview src={group.hasDefault ? group.defaultUrl : inventory.globalDefault.imageUrl} />
              <div>
                <p className="text-sm font-semibold text-[#3a2f22]">
                  {CATEGORY_LABELS[group.category] ?? group.category}: category photo
                </p>
                <p className="text-xs text-[#a89880]">Used for any treatment in this category with no specific photo of its own.</p>
              </div>
            </div>
            <UploadButton
              busy={busyKey === `category:${group.category}`}
              onSelect={(file) => upload(`category:${group.category}`, "category", group.category, "", file)}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {group.rules.map((rule) => {
              const key = `slug:${group.category}:${rule.slug}`;
              return (
                <div key={rule.slug} className="flex items-center justify-between gap-3 rounded-xl border border-[#E3E8F0] bg-white p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <ImagePreview
                      src={rule.hasImage ? rule.imageUrl : group.hasDefault ? group.defaultUrl : inventory.globalDefault.imageUrl}
                      faded={!rule.hasImage}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#3a2f22]">{labelFromSlug(rule.slug)}</p>
                      <p className="truncate text-[11px] text-[#a89880]" title={rule.keywords.join(", ")}>
                        matches: {rule.keywords.slice(0, 3).join(", ")}
                        {rule.keywords.length > 3 ? "…" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {rule.hasImage && (
                      <button
                        type="button"
                        title="Remove photo"
                        aria-label={`Remove photo for ${labelFromSlug(rule.slug)}`}
                        onClick={() => remove(key, group.category, rule.slug)}
                        disabled={busyKey === key}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E3E8F0] text-[#a89880] transition hover:bg-[#faf6ef] disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <UploadButton
                      compact
                      busy={busyKey === key}
                      onSelect={(file) => upload(key, "slug", group.category, rule.slug, file)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[#E3E8F0] bg-[#faf6ef] p-3">
        <div className="flex min-w-0 items-center gap-3">
          <ImagePreview src={inventory.globalDefault.imageUrl} />
          <div>
            <p className="text-sm font-semibold text-[#3a2f22]">Global default photo</p>
            <p className="text-xs text-[#a89880]">Last-resort fallback, only used if a category photo is also missing.</p>
          </div>
        </div>
        <UploadButton busy={busyKey === "default"} onSelect={(file) => upload("default", "default", "", "", file)} />
      </div>
    </div>
  );
}

function ImagePreview({ src, faded = false }: { src: string; faded?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  if (failed) {
    return (
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#E3E8F0] bg-[#faf6ef] text-[#a89880]">
        <ImageOff className="h-5 w-5" />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className={`h-12 w-12 shrink-0 rounded-lg border border-[#E3E8F0] object-cover ${faded ? "opacity-40" : ""}`}
    />
  );
}

function UploadButton({
  onSelect,
  busy,
  compact = false,
}: {
  onSelect: (file: File) => void;
  busy: boolean;
  compact?: boolean;
}) {
  return (
    <label
      className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E3E8F0] bg-white text-xs font-medium text-[#5F4426] transition hover:bg-[#faf6ef] ${
        compact ? "h-8 px-2.5" : "h-9 px-3.5"
      } ${busy ? "pointer-events-none opacity-50" : ""}`}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
      {!compact && (busy ? "Uploading..." : "Upload")}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}
