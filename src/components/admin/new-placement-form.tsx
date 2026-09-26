"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Plus } from "lucide-react";

const inputClass =
  "h-9 rounded-lg border border-[#E3E8F0] bg-white px-2.5 text-sm text-[#3a2f22] outline-none focus:border-[#c9a26d] disabled:opacity-50";

/** Slugify a display name into a stable machine key, e.g. "Sidebar Banner" -> "sidebar_banner". */
function toKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function NewPlacementForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [maxActiveAds, setMaxActiveAds] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    const key = toKey(name);
    if (!key) {
      setError("Give the placement a name first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/advertisement-placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, name: name.trim(), maxActiveAds }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Failed to create placement");
      setName("");
      setMaxActiveAds(1);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create placement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-[#c9a26d]/40 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#a89880]">Add a new banner placement</p>
      <p className="mt-1 text-xs text-[#a89880]">
        A placement is a slot on the site (e.g. &quot;Sidebar Banner&quot;). Create it here, then it appears in the
        Placement dropdown above.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          className={inputClass}
          placeholder="Placement name, e.g. Sidebar Banner"
          value={name}
          disabled={saving}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          min={1}
          className={`${inputClass} w-28`}
          value={maxActiveAds}
          disabled={saving}
          onChange={(e) => setMaxActiveAds(Math.max(1, Number(e.target.value)))}
          aria-label="Max concurrent ads in this slot"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving || !name.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#3a2f22_0%,#8a6d4f_100%)] px-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Add placement
        </button>
      </div>
      {name.trim() && <p className="mt-1.5 text-[11px] text-[#a89880]">Key: {toKey(name)}</p>}
      {error && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#B91C1C]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
