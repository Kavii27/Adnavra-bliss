"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { AlertCircle, BarChart3, Check, Loader2, Trash2 } from "lucide-react";
import { ToggleSwitch } from "@/components/admin/toggle-switch";

type AdWithPlacement = Prisma.AdvertisementGetPayload<{ include: { placement: true } }> & {
  stats: { impressions: number; clicks: number };
};

const inputClass =
  "h-9 w-full rounded-lg border border-[#E3E8F0] bg-[#faf6ef] px-2.5 text-sm text-[#3a2f22] outline-none focus:border-[#c9a26d] disabled:opacity-50";
const labelClass = "text-[11px] font-semibold uppercase tracking-wide text-[#a89880]";

export function AdvertisementCard({ ad, placements }: { ad: AdWithPlacement; placements: { key: string; name: string }[] }) {
  const router = useRouter();
  const initial = {
    title: ad.title,
    description: ad.description ?? "",
    destinationUrl: ad.destinationUrl,
    placementKey: ad.placement.key,
    priority: ad.priority,
    isActive: ad.isActive,
    startAt: new Date(ad.startAt).toISOString().slice(0, 10),
    endAt: new Date(ad.endAt).toISOString().slice(0, 10),
  };
  const [fields, setFields] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = JSON.stringify(fields) !== JSON.stringify(initial);

  function update<K extends keyof typeof fields>(key: K, value: (typeof fields)[K]) {
    setFields((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    if (saving || deleting) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/advertisements/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fields.title,
          description: fields.description || undefined,
          destinationUrl: fields.destinationUrl,
          placementKey: fields.placementKey,
          priority: fields.priority,
          isActive: fields.isActive,
          startAt: new Date(fields.startAt).toISOString(),
          endAt: new Date(fields.endAt).toISOString(),
        }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Failed to save advertisement");
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save advertisement");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (saving || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/advertisements/${ad.id}`, { method: "DELETE" });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Failed to delete advertisement");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete advertisement");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E3E8F0] bg-white shadow-[0_1px_2px_rgba(58,47,34,0.04)]">
      <div className="relative h-32 w-full bg-[#EAF3F2]">
        {/* Plain <img>, not next/image — ad banners can be uploaded to any
            path and next/image would need every possible host allowlisted. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ad.imageUrl} alt={ad.title} className="h-full w-full object-cover" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#a89880]">
            <BarChart3 className="h-3 w-3" /> {ad.stats.impressions} views • {ad.stats.clicks} clicks
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving || deleting}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#B91C1C] transition hover:bg-[#FDECEC] disabled:opacity-40"
            aria-label="Delete advertisement"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>

        <div className="mt-3 grid gap-2">
          <label className="space-y-1">
            <span className={labelClass}>Title</span>
            <input className={inputClass} value={fields.title} disabled={saving || deleting} onChange={(e) => update("title", e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className={labelClass}>Placement</span>
            <select
              className={inputClass}
              value={fields.placementKey}
              disabled={saving || deleting}
              onChange={(e) => update("placementKey", e.target.value)}
            >
              {placements.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className={labelClass}>Destination URL</span>
            <input
              className={inputClass}
              value={fields.destinationUrl}
              disabled={saving || deleting}
              onChange={(e) => update("destinationUrl", e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className={labelClass}>Start</span>
              <input
                type="date"
                className={inputClass}
                value={fields.startAt}
                disabled={saving || deleting}
                onChange={(e) => update("startAt", e.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span className={labelClass}>End</span>
              <input
                type="date"
                className={inputClass}
                value={fields.endAt}
                disabled={saving || deleting}
                onChange={(e) => update("endAt", e.target.value)}
              />
            </label>
          </div>
          <label className="space-y-1">
            <span className={labelClass}>Priority</span>
            <input
              type="number"
              className={inputClass}
              value={fields.priority}
              disabled={saving || deleting}
              onChange={(e) => update("priority", Number(e.target.value))}
            />
          </label>
        </div>

        <div className="mt-3 rounded-xl bg-[#faf6ef] px-3 py-2">
          <ToggleSwitch label="Enabled" checked={fields.isActive} disabled={saving || deleting} onChange={(v) => update("isActive", v)} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || deleting || !dirty}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#3a2f22_0%,#8a6d4f_100%)] px-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && !dirty && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#15803D]">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
        </div>
        {error && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#B91C1C]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
          </p>
        )}
      </div>
    </div>
  );
}
