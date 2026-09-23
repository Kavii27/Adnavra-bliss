"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Plus } from "lucide-react";

const inputClass =
  "h-9 w-full rounded-lg border border-[#E3E8F0] bg-white px-2.5 text-sm text-[#3a2f22] outline-none focus:border-[#c9a26d] disabled:opacity-50";
const labelClass = "text-[11px] font-semibold uppercase tracking-wide text-[#a89880]";

export function NewAdvertisementForm({ placements }: { placements: { key: string; name: string }[] }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [placementKey, setPlacementKey] = useState(placements[0]?.key ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [priority, setPriority] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = Boolean(file && placementKey && title.trim() && destinationUrl.trim() && startAt && endAt);

  async function handleCreate() {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("placementKey", placementKey);
      form.set("title", title.trim());
      if (description.trim()) form.set("description", description.trim());
      form.set("destinationUrl", destinationUrl.trim());
      form.set("startAt", new Date(startAt).toISOString());
      form.set("endAt", new Date(endAt).toISOString());
      form.set("priority", String(priority));
      form.set("isActive", String(isActive));

      const res = await fetch("/api/admin/advertisements", { method: "POST", body: form });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Failed to create advertisement");

      setFile(null);
      setTitle("");
      setDescription("");
      setDestinationUrl("");
      setStartAt("");
      setEndAt("");
      setPriority(0);
      setIsActive(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create advertisement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="col-span-2 space-y-1 lg:col-span-4">
          <span className={labelClass}>Banner image</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={saving}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-[#3a2f22] file:mr-3 file:rounded-lg file:border-0 file:bg-[#EAF3F2] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#3a2f22]"
          />
        </label>
        <label className="col-span-2 space-y-1">
          <span className={labelClass}>Title</span>
          <input className={inputClass} value={title} disabled={saving} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="col-span-2 space-y-1">
          <span className={labelClass}>Placement</span>
          <select className={inputClass} value={placementKey} disabled={saving} onChange={(e) => setPlacementKey(e.target.value)}>
            {placements.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 space-y-1 lg:col-span-4">
          <span className={labelClass}>Description (optional)</span>
          <input
            className={inputClass}
            value={description}
            disabled={saving}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="col-span-2 space-y-1 lg:col-span-4">
          <span className={labelClass}>Destination URL</span>
          <input
            className={inputClass}
            placeholder="https://example.com/promo"
            value={destinationUrl}
            disabled={saving}
            onChange={(e) => setDestinationUrl(e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Start date</span>
          <input type="date" className={inputClass} value={startAt} disabled={saving} onChange={(e) => setStartAt(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>End date</span>
          <input type="date" className={inputClass} value={endAt} disabled={saving} onChange={(e) => setEndAt(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Priority</span>
          <input
            type="number"
            className={inputClass}
            value={priority}
            disabled={saving}
            onChange={(e) => setPriority(Number(e.target.value))}
          />
        </label>
        <label className="flex items-end gap-2 pb-1.5">
          <input
            type="checkbox"
            checked={isActive}
            disabled={saving}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span className="text-xs font-medium text-[#3a2f22]">Enabled</span>
        </label>
      </div>

      <button
        type="button"
        onClick={handleCreate}
        disabled={saving || !canSubmit}
        className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#3a2f22_0%,#8a6d4f_100%)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        {saving ? "Creating…" : "Create advertisement"}
      </button>
      {error && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#B91C1C]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
