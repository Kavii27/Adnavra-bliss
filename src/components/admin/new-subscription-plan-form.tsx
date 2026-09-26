"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Plus } from "lucide-react";

const inputClass =
  "h-9 w-full rounded-lg border border-[#E3E8F0] bg-white px-2.5 text-sm text-[#3a2f22] outline-none focus:border-[#c9a26d] disabled:opacity-50";
const labelClass = "text-[11px] font-semibold uppercase tracking-wide text-[#a89880]";

export function NewSubscriptionPlanForm() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [rank, setRank] = useState(0);
  const [boostsPerWeek, setBoostsPerWeek] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = key.trim().length > 0 && name.trim().length > 0;

  async function handleCreate() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/subscription-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim(), name: name.trim(), rank, boostsPerWeek }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Failed to create plan");
      setKey("");
      setName("");
      setRank(0);
      setBoostsPerWeek(0);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create plan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="space-y-1">
          <span className={labelClass}>Key (e.g. &quot;diamond&quot;)</span>
          <input className={inputClass} value={key} disabled={saving} onChange={(e) => setKey(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Name</span>
          <input className={inputClass} value={name} disabled={saving} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Rank</span>
          <input
            type="number"
            className={inputClass}
            value={rank}
            disabled={saving}
            onChange={(e) => setRank(Number(e.target.value))}
          />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Boosts / week</span>
          <input
            type="number"
            className={inputClass}
            value={boostsPerWeek}
            disabled={saving}
            onChange={(e) => setBoostsPerWeek(Number(e.target.value))}
          />
        </label>
      </div>
      <p className="mt-3 text-xs text-[#a89880]">
        Creates the plan with sensible defaults for everything else. Edit it in its card above once created.
      </p>
      <button
        type="button"
        onClick={handleCreate}
        disabled={saving || !canSubmit}
        className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#3a2f22_0%,#8a6d4f_100%)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        {saving ? "Creating…" : "Create plan"}
      </button>
      {error && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#B91C1C]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
