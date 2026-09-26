"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Zap } from "lucide-react";

const inputClass =
  "h-9 rounded-lg border border-[#E3E8F0] bg-white px-2.5 text-sm text-[#3a2f22] outline-none focus:border-[#c9a26d] disabled:opacity-50";

export function ManualBoostForm({ businesses }: { businesses: { id: string; name: string; slug: string }[] }) {
  const router = useRouter();
  const [businessId, setBusinessId] = useState(businesses[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (businesses.length === 0) {
    return <p className="text-xs text-[#a89880]">No salons on the platform yet — add one first.</p>;
  }

  async function handleBoost() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/boosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Failed to create boost");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create boost");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Salon to boost"
          value={businessId}
          disabled={saving}
          onChange={(e) => setBusinessId(e.target.value)}
          className={inputClass}
        >
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} (/{b.slug})
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleBoost}
          disabled={saving}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#3a2f22_0%,#8a6d4f_100%)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          {saving ? "Boosting…" : "Boost now"}
        </button>
      </div>
      <p className="mt-2 text-xs text-[#a89880]">
        Manual boosts bypass the plan&apos;s weekly limit — use for one-off promotions.
      </p>
      {error && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#B91C1C]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
