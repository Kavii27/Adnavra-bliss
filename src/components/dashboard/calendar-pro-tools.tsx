"use client";
import { useCallback, useEffect, useState } from "react";
import { Loader2, AlertCircle, Check, Tags, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ProBooking = {
  id: string;
  reference: string;
  status: string;
  startTime: string;
  endTime: string;
  customer: { name: string };
  service: { name: string };
};

const STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;

const DEFAULT_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
};

/**
 * Task 2.4 — Professional scheduling extras, rendered inside
 * <PlanGate feature="advancedScheduling"> on the calendar page:
 * custom appointment status labels + bulk reschedule.
 */
export function CalendarProTools({ bookings, onChanged }: { bookings: ProBooking[]; onChanged: () => void }) {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [labels, setLabels] = useState<Record<string, string>>(DEFAULT_LABELS);
  const [labelsLoading, setLabelsLoading] = useState(true);
  const [savingLabels, setSavingLabels] = useState(false);
  const [labelsSaved, setLabelsSaved] = useState(false);

  const [selected, setSelected] = useState<string[]>([]);
  const [targetDate, setTargetDate] = useState("");
  const [moving, setMoving] = useState(false);
  const [moveResult, setMoveResult] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/businesses")
      .then(async (r) => {
        const j = await r.json();
        if (r.ok && j.data?.[0]?.id) {
          const id = j.data[0].id as string;
          setBusinessId(id);
          const sR = await fetch(`/api/business-settings?businessId=${id}&key=scheduling`);
          if (sR.ok) {
            const sJ = await sR.json();
            const row = Array.isArray(sJ.data) ? sJ.data[0] : null;
            const saved = (row?.value ?? {}) as { labels?: Record<string, string> };
            if (saved.labels) setLabels({ ...DEFAULT_LABELS, ...saved.labels });
          }
        }
      })
      .catch(() => null)
      .finally(() => setLabelsLoading(false));
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }, []);

  async function saveLabels() {
    if (!businessId) return;
    setSavingLabels(true);
    setLabelsSaved(false);
    try {
      const r = await fetch("/api/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, key: "scheduling", value: { labels } }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Save failed");
      setLabelsSaved(true);
    } catch {
      setLabelsSaved(false);
    } finally {
      setSavingLabels(false);
    }
  }

  async function bulkMove() {
    setMoveResult(null);
    setMoveError(null);
    if (selected.length === 0 || !targetDate) {
      setMoveError("Select at least one booking and a target date");
      return;
    }
    if (!confirm(`Move ${selected.length} booking(s) to ${targetDate} (same times)? Overlaps will be skipped with an error.`)) return;
    setMoving(true);
    let ok = 0;
    const failed: string[] = [];
    for (const id of selected) {
      const b = bookings.find((x) => x.id === id);
      if (!b) continue;
      const time = new Date(b.startTime);
      const pad = (n: number) => String(n).padStart(2, "0");
      const startAt = new Date(`${targetDate}T${pad(time.getHours())}:${pad(time.getMinutes())}:00`);
      try {
        const r = await fetch(`/api/bookings/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startAt: startAt.toISOString() }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Move failed");
        ok += 1;
      } catch (e: unknown) {
        failed.push(`${b.reference}: ${(e as Error).message}`);
      }
    }
    setMoving(false);
    setSelected([]);
    setMoveResult(`Moved ${ok} of ${ok + failed.length} booking(s).${failed.length > 0 ? ` Skipped: ${failed.join("; ")}` : ""}`);
    onChanged();
  }

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-[#3a2f22] flex items-center gap-2"><Tags className="h-4 w-4 text-[#a89880]" /> Custom status labels</h2>
        <p className="text-xs text-[#a89880] mt-1">Rename how each appointment status reads across your calendar and reports.</p>
        {labelsLoading ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</p>
        ) : (
          <>
            <div className="mt-3 space-y-2">
              {STATUSES.map((s) => (
                <div key={s} className="grid grid-cols-1 gap-2 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center">
                  <span className="text-xs uppercase tracking-wide text-[#a89880]">{s.replace("_", " ")}</span>
                  <Input value={labels[s] ?? ""} onChange={(e) => setLabels((prev) => ({ ...prev, [s]: e.target.value }))} placeholder={DEFAULT_LABELS[s]} className="min-h-11 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
              <Button onClick={saveLabels} disabled={savingLabels || !businessId} variant="secondaryDark" className="w-full sm:w-auto">
                {savingLabels ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Save labels</>}
              </Button>
              {labelsSaved && <span className="text-xs text-emerald-300">Saved.</span>}
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-[#3a2f22] flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[#a89880]" /> Bulk reschedule</h2>
        <p className="text-xs text-[#a89880] mt-1">Move several bookings to another day, keeping their times. Overlaps are rejected per booking.</p>
        {bookings.length === 0 ? (
          <p className="mt-3 text-sm text-[#a89880]">No bookings on the selected day to move.</p>
        ) : (
          <>
            <div className="mt-3 max-h-56 space-y-1.5 overflow-y-auto overscroll-contain">
              {bookings.map((b) => (
                <label key={b.id} className="grid min-h-11 cursor-pointer grid-cols-[1.25rem_minmax(0,1fr)] items-center gap-x-2 gap-y-1 rounded-lg border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm sm:flex sm:gap-2">
                  <input type="checkbox" checked={selected.includes(b.id)} onChange={() => toggle(b.id)} className="h-5 w-5 accent-[#8a6d4f]" />
                  <span className="min-w-0 flex-1 truncate font-medium text-[#3a2f22]">{b.service?.name} · {b.customer?.name}</span>
                  <span className="col-span-2 pl-[1.75rem] text-xs text-[#a89880] sm:pl-0 sm:shrink-0">
                    {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {(labels[b.status] ?? b.status)}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="min-h-11 w-full bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] sm:w-auto" />
              <Button onClick={bulkMove} disabled={moving || selected.length === 0} className="w-full bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90 sm:w-auto">
                {moving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Moving...</> : <>Move {selected.length > 0 ? `${selected.length} ` : ""}booking(s)</>}
              </Button>
            </div>
            {moveError && <p className="mt-2 text-sm text-red-300 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {moveError}</p>}
            {moveResult && <p className="mt-2 text-sm text-[#3a2f22]">{moveResult}</p>}
          </>
        )}
      </div>
    </div>
  );
}
