"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Calendar, Loader2, Plus } from "lucide-react";
import { ToggleSwitch } from "@/components/admin/toggle-switch";
import { DatePickerModal, fromISODate, toISODate } from "@/components/shared/date-picker-modal";

const inputClass =
  "h-9 w-full rounded-lg border border-[#E3E8F0] bg-white px-2.5 text-sm text-[#3a2f22] outline-none focus:border-[#c9a26d] disabled:opacity-50";
const labelClass = "text-[11px] font-semibold uppercase tracking-wide text-[#a89880]";
const dateTriggerClass =
  "flex min-h-11 w-full items-center gap-2 rounded-lg border border-[#E3E8F0] bg-white px-2.5 text-left text-sm text-[#3a2f22] transition-colors hover:border-[#c9a26d] disabled:opacity-50";

function formatDate(iso: string): string {
  const d = fromISODate(iso);
  return d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Pick a date";
}

export function NewAdvertisementForm({ placements }: { placements: { key: string; name: string }[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [placementKey, setPlacementKey] = useState(placements[0]?.key ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [dateField, setDateField] = useState<"startAt" | "endAt" | null>(null);
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
      if (fileInputRef.current) fileInputRef.current.value = "";
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
            ref={fileInputRef}
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
        <div className="space-y-1">
          <span className={labelClass}>Start date</span>
          <button
            type="button"
            disabled={saving}
            onClick={() => setDateField("startAt")}
            className={dateTriggerClass}
          >
            <Calendar className="h-4 w-4 shrink-0 text-[#a89880]" />
            <span className={startAt ? "truncate" : "truncate text-[#a89880]"}>{formatDate(startAt)}</span>
          </button>
        </div>
        <div className="space-y-1">
          <span className={labelClass}>End date</span>
          <button
            type="button"
            disabled={saving}
            onClick={() => setDateField("endAt")}
            className={dateTriggerClass}
          >
            <Calendar className="h-4 w-4 shrink-0 text-[#a89880]" />
            <span className={endAt ? "truncate" : "truncate text-[#a89880]"}>{formatDate(endAt)}</span>
          </button>
        </div>
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
        <div className="flex min-h-9 items-end pb-1.5">
          <ToggleSwitch label="Enabled" checked={isActive} disabled={saving} onChange={setIsActive} />
        </div>
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

      <DatePickerModal
        open={dateField !== null}
        onClose={() => setDateField(null)}
        value={fromISODate(dateField === "endAt" ? endAt : startAt)}
        minDate={dateField === "endAt" ? fromISODate(startAt) : null}
        onSelect={(d) => {
          const iso = toISODate(d);
          if (dateField === "endAt") setEndAt(iso);
          else setStartAt(iso);
        }}
      />
    </div>
  );
}
