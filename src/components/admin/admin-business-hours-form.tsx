"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Clock, Loader2 } from "lucide-react";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<(typeof DAYS)[number], string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

type HoursValue = { open: string; close: string; closed: boolean };
type Hours = Record<(typeof DAYS)[number], HoursValue>;

function normalise(raw: unknown): Hours {
  const result = {} as Hours;
  for (const d of DAYS) {
    const v = raw && typeof raw === "object" ? (raw as Record<string, Partial<HoursValue>>)[d] : undefined;
    result[d] = { open: v?.open ?? "09:00", close: v?.close ?? "18:00", closed: v?.closed ?? d === "sunday" };
  }
  return result;
}

export function AdminBusinessHoursForm({ businessId, initialHours }: { businessId: string; initialHours: unknown }) {
  const router = useRouter();
  const [hours, setHours] = useState<Hours>(() => normalise(initialHours));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update(day: (typeof DAYS)[number], patch: Partial<HoursValue>) {
    setHours((h) => ({ ...h, [day]: { ...h[day], ...patch } }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/businesses/${businessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openingHours: hours }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Failed to save opening hours");
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save opening hours");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-[#E3E8F0] bg-white p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-[#3a2f22]">
        <Clock className="h-4 w-4 text-[#8a6d4f]" /> Opening hours
      </h2>
      <p className="mt-1 text-xs text-[#a89880]">Closed days are not bookable on the public page.</p>

      <div className="mt-4 space-y-2">
        {DAYS.map((day) => (
          <div
            key={day}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-[#E3E8F0] bg-[#faf6ef] px-3 py-2.5"
          >
            <span className="w-24 shrink-0 text-sm font-medium text-[#3a2f22]">{DAY_LABELS[day]}</span>
            <label className="flex items-center gap-1.5 text-xs text-[#a89880]">
              <input
                type="checkbox"
                checked={hours[day].closed}
                disabled={saving}
                onChange={(e) => update(day, { closed: e.target.checked })}
              />
              Closed
            </label>
            {!hours[day].closed && (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={hours[day].open}
                  disabled={saving}
                  onChange={(e) => update(day, { open: e.target.value })}
                  className="h-9 rounded-md border border-[#E3E8F0] bg-white px-2 text-sm text-[#3a2f22]"
                />
                <span className="text-xs text-[#a89880]">to</span>
                <input
                  type="time"
                  value={hours[day].close}
                  disabled={saving}
                  onChange={(e) => update(day, { close: e.target.value })}
                  className="h-9 rounded-md border border-[#E3E8F0] bg-white px-2 text-sm text-[#3a2f22]"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#8a6d4f] px-5 text-sm font-semibold text-white transition hover:bg-[#5f4630] disabled:opacity-50"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {saving ? "Saving…" : "Save hours"}
        </button>
        {saved && (
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
  );
}
