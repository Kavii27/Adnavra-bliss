"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Store, Plus, Check, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId } from "@/components/dashboard/use-business";

type Staff = { id: string; name: string };
type Shift = {
  id: string;
  start: string;
  end: string;
  notes: string | null;
  staffMember: { id: string; name: string };
};

function dayIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function weekDates(anchor: string): string[] {
  const base = new Date(anchor + "T12:00:00");
  const dow = (base.getDay() + 6) % 7; // Monday-first
  base.setDate(base.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return dayIso(d);
  });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtHours(ms: number): string {
  return `${(ms / 3600000).toFixed(1)}h`;
}

export default function ShiftsPage() {
  return (
    <PlanGate feature="staffScheduling">
      <ShiftsInner />
    </PlanGate>
  );
}

function ShiftsInner() {
  const { businessId, loading: bizLoading, error: bizError, isNoBusiness } = useBusinessId();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [anchor, setAnchor] = useState(() => dayIso(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(() => dayIso(new Date()));
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const days = useMemo(() => weekDates(anchor), [anchor]);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const [sR, hR] = await Promise.all([
        fetch(`/api/staff?businessId=${businessId}&limit=100`),
        fetch(`/api/shifts?businessId=${businessId}&from=${days[0]}T00:00:00&to=${days[6]}T23:59:59&limit=100`),
      ]);
      const sJ = await sR.json();
      const hJ = await hR.json();
      if (!sR.ok) throw new Error(sJ.error ?? "Failed to load staff");
      if (!hR.ok) throw new Error(hJ.error ?? "Failed to load shifts");
      setStaff(sJ.data ?? []);
      setShifts(hJ.data ?? []);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [businessId, days]);

  useEffect(() => {
    if (businessId) load();
    else if (!bizLoading) setLoading(false);
  }, [businessId, bizLoading, load]);

  const shiftsByDay = useMemo(() => {
    const map = new Map<string, Shift[]>();
    for (const d of days) map.set(d, []);
    for (const s of shifts) {
      const key = dayIso(new Date(s.start));
      if (map.has(key)) map.get(key)!.push(s);
    }
    for (const list of map.values()) list.sort((a, b) => a.start.localeCompare(b.start));
    return map;
  }, [shifts, days]);

  const weekHours = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of shifts) {
      const ms = new Date(s.end).getTime() - new Date(s.start).getTime();
      map.set(s.staffMember.id, (map.get(s.staffMember.id) ?? 0) + ms);
    }
    return map;
  }, [shifts]);

  async function handleSubmit() {
    if (!businessId) return;
    setFormError(null);
    if (!staffId) {
      setFormError("Choose a staff member");
      return;
    }
    const startDt = new Date(`${date}T${start}:00`);
    const endDt = new Date(`${date}T${end}:00`);
    if (Number.isNaN(startDt.getTime()) || Number.isNaN(endDt.getTime()) || endDt <= startDt) {
      setFormError("End time must be after start time");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, staffMemberId: staffId, start: startDt.toISOString(), end: endDt.toISOString(), notes: notes.trim() || null }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Create failed");
      setShowForm(false);
      setNotes("");
      await load();
    } catch (e: unknown) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this shift?")) return;
    const r = await fetch(`/api/shifts?id=${id}`, { method: "DELETE" });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error ?? "Delete failed");
      return;
    }
    await load();
  }

  if (bizLoading || (loading && businessId)) {
    return <div className="flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading shifts...</div>;
  }
  if (isNoBusiness || bizError) {
    return (
      <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe3] border border-[#e6dcc8]">
          <Store className="h-5 w-5 text-[#a89880]" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#3a2f22]">Set up your salon to roster shifts</h3>
        <p className="mt-1 text-sm text-[#a89880]">{bizError ?? "Create your business profile first."}</p>
        <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#faf6ef] hover:bg-white/90">Go to Settings</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#3a2f22]">Scheduled shifts</h1>
          <p className="text-sm text-[#a89880] mt-1">Weekly roster per staff member. Overlapping shifts are rejected.</p>
        </div>
        <Button onClick={() => { setFormError(null); setShowForm(true); }} disabled={staff.length === 0} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">
          <Plus className="h-4 w-4 mr-2" /> Assign shift
        </Button>
      </div>

      {staff.length === 0 && !error ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-6 text-sm text-[#a89880]">
          Add team members first — shifts are assigned to staff.{" "}
          <Link href="/dashboard/team/members" className="font-medium text-[#3a2f22] underline">Go to Team members</Link>.
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-2">
            <button aria-label="Previous week" onClick={() => setAnchor((a) => dayIso(new Date(new Date(a + "T12:00:00").getTime() - 7 * 86400000)))} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e6dcc8] bg-[#f6efe3] text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setAnchor(dayIso(new Date()))} className="rounded-full border border-[#e6dcc8] bg-[#f6efe3] px-3 py-1.5 text-xs font-semibold text-[#3a2f22] hover:bg-[#f3ebdd]">This week</button>
            <span className="ml-1 text-sm font-medium text-[#3a2f22]">{days[0]} → {days[6]}</span>
            <button aria-label="Next week" onClick={() => setAnchor((a) => dayIso(new Date(new Date(a + "T12:00:00").getTime() + 7 * 86400000)))} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e6dcc8] bg-[#f6efe3] text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {error ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {error}</div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-7 gap-2">
                {days.map((d) => {
                  const list = shiftsByDay.get(d) ?? [];
                  const label = new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
                  const isToday = d === dayIso(new Date());
                  return (
                    <div key={d} className={`rounded-xl border p-3 min-h-28 ${isToday ? "border-[#8a6d4f] bg-[#8a6d4f]/10" : "border-[#e6dcc8] bg-[#f6efe3]"}`}>
                      <p className={`text-xs font-semibold ${isToday ? "text-[#3a2f22]" : "text-[#a89880]"}`}>{label}</p>
                      <div className="mt-2 space-y-1.5">
                        {list.length === 0 ? (
                          <p className="text-[11px] text-[#a89880]">—</p>
                        ) : (
                          list.map((s) => (
                            <div key={s.id} className="rounded-lg bg-[#faf6ef] border border-[#e6dcc8] px-2 py-1.5 text-[11px] group">
                              <p className="font-medium text-[#3a2f22] truncate">{s.staffMember.name}</p>
                              <p className="text-[#a89880]">{fmtTime(s.start)}–{fmtTime(s.end)}</p>
                              <button onClick={() => handleDelete(s.id)} className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-red-300 hover:underline"><Trash2 className="h-3 w-3" /> Remove</button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-wide text-[#a89880]">Scheduled hours this week</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {staff.map((s) => (
                    <span key={s.id} className="rounded-full bg-[#f3ebdd] px-3 py-1 text-xs text-[#3a2f22]">
                      {s.name}: <span className="font-semibold">{fmtHours(weekHours.get(s.id) ?? 0)}</span>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div className="bg-[#0F1729] rounded-xl border border-[#e6dcc8] p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[#3a2f22]">Assign shift</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Staff member *</label>
                <select value={staffId} onChange={(e) => setStaffId(e.target.value)} className="mt-1 w-full rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm text-[#3a2f22]">
                  <option value="" className="text-black">Choose staff</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id} className="text-black">{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Date *</label>
                <Input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Start *</label>
                  <Input value={start} onChange={(e) => setStart(e.target.value)} type="time" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">End *</label>
                  <Input value={end} onChange={(e) => setEnd(e.target.value)} type="time" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Notes</label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
              {formError && <p className="text-sm text-red-300 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghostDark" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Assign</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
