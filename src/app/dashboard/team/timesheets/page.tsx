"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Store, Plus, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId } from "@/components/dashboard/use-business";

type Staff = { id: string; name: string };
type Entry = {
  id: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  hours: number;
  note: string | null;
  staffMember: { id: string; name: string };
};
type Shift = { id: string; start: string; end: string; staffMember: { id: string; name: string } };

export default function TimesheetsPage() {
  return (
    <PlanGate feature="staffScheduling">
      <TimesheetsInner />
    </PlanGate>
  );
}

function TimesheetsInner() {
  const { businessId, loading: bizLoading, error: bizError, isNoBusiness } = useBusinessId();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staffFilter, setStaffFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const params = staffFilter === "ALL" ? "" : `&staffMemberId=${staffFilter}`;
      const [sR, eR, hR] = await Promise.all([
        fetch(`/api/staff?businessId=${businessId}&limit=100`),
        fetch(`/api/timesheets?businessId=${businessId}${params}&limit=50`),
        fetch(`/api/shifts?businessId=${businessId}${params}&limit=100`),
      ]);
      const sJ = await sR.json();
      const eJ = await eR.json();
      const hJ = await hR.json();
      if (!sR.ok) throw new Error(sJ.error ?? "Failed to load staff");
      if (!eR.ok) throw new Error(eJ.error ?? "Failed to load timesheets");
      setStaff(sJ.data ?? []);
      setEntries(eJ.data ?? []);
      if (hR.ok) setShifts(hJ.data ?? []);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [businessId, staffFilter]);

  useEffect(() => {
    if (businessId) load();
    else if (!bizLoading) setLoading(false);
  }, [businessId, bizLoading, load]);

  // Scheduled-vs-actual: total scheduled shift hours vs logged hours, per staff.
  const comparison = useMemo(() => {
    const scheduled = new Map<string, number>();
    for (const s of shifts) {
      const ms = new Date(s.end).getTime() - new Date(s.start).getTime();
      scheduled.set(s.staffMember.id, (scheduled.get(s.staffMember.id) ?? 0) + ms / 3600000);
    }
    const actual = new Map<string, number>();
    for (const e of entries) {
      actual.set(e.staffMember.id, (actual.get(e.staffMember.id) ?? 0) + e.hours);
    }
    return staff.map((s) => ({
      name: s.name,
      scheduled: scheduled.get(s.id) ?? 0,
      actual: actual.get(s.id) ?? 0,
    }));
  }, [staff, shifts, entries]);

  const totalHours = useMemo(() => entries.reduce((s, e) => s + e.hours, 0), [entries]);

  async function handleSubmit() {
    if (!businessId) return;
    setFormError(null);
    if (!staffId) {
      setFormError("Choose a staff member");
      return;
    }
    const inDt = clockIn ? new Date(`${date}T${clockIn}:00`) : null;
    const outDt = clockOut ? new Date(`${date}T${clockOut}:00`) : null;
    if ((clockIn && !inDt) || (clockOut && !outDt)) {
      setFormError("Invalid time");
      return;
    }
    if (inDt && outDt && outDt <= inDt) {
      setFormError("Clock-out must be after clock-in");
      return;
    }
    // Hours derive from clock times when both are present, else default 8h day.
    const hours = inDt && outDt ? (outDt.getTime() - inDt.getTime()) / 3600000 : 8;
    setSubmitting(true);
    try {
      const r = await fetch("/api/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          staffMemberId: staffId,
          date: new Date(`${date}T12:00:00`).toISOString(),
          clockIn: inDt?.toISOString() ?? null,
          clockOut: outDt?.toISOString() ?? null,
          hours: Math.round(hours * 100) / 100,
          note: note.trim() || null,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Create failed");
      setShowForm(false);
      setClockIn("");
      setClockOut("");
      setNote("");
      await load();
    } catch (e: unknown) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this timesheet entry?")) return;
    const r = await fetch(`/api/timesheets?id=${id}`, { method: "DELETE" });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error ?? "Delete failed");
      return;
    }
    await load();
  }

  if (bizLoading || (loading && businessId)) {
    return <div className="flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading timesheets...</div>;
  }
  if (isNoBusiness || bizError) {
    return (
      <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe3] border border-[#e6dcc8]">
          <Store className="h-5 w-5 text-[#a89880]" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#3a2f22]">Set up your salon to track hours</h3>
        <p className="mt-1 text-sm text-[#a89880]">{bizError ?? "Create your business profile first."}</p>
        <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#faf6ef] hover:bg-white/90">Go to Settings</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#3a2f22]">Timesheets</h1>
          <p className="text-sm text-[#a89880] mt-1">Clock-in/out or manual hours, compared against scheduled shifts.</p>
        </div>
        <Button onClick={() => { setFormError(null); setShowForm(true); }} disabled={staff.length === 0} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">
          <Plus className="h-4 w-4 mr-2" /> Log hours
        </Button>
      </div>

      {staff.length === 0 && !error ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-6 text-sm text-[#a89880]">
          Add team members first — hours are logged per staff.{" "}
          <Link href="/dashboard/team/members" className="font-medium text-[#3a2f22] underline">Go to Team members</Link>.
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} className="rounded-lg border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm text-[#3a2f22]">
              <option value="ALL" className="text-black">All staff</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id} className="text-black">{s.name}</option>
              ))}
            </select>
            <span className="text-sm text-[#a89880]">{entries.length} entries · {totalHours.toFixed(1)}h logged</span>
          </div>

          <div className="mt-4 rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-wide text-[#a89880]">Scheduled vs actual</p>
            <div className="mt-2 space-y-2">
              {comparison.length === 0 ? (
                <p className="text-sm text-[#a89880]">No data yet.</p>
              ) : (
                comparison.map((c) => {
                  const diff = c.actual - c.scheduled;
                  return (
                    <div key={c.name} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-[#3a2f22] truncate">{c.name}</span>
                      <span className="text-xs text-[#a89880] shrink-0">
                        {c.scheduled.toFixed(1)}h scheduled · {c.actual.toFixed(1)}h logged ·{" "}
                        <span className={diff === 0 ? "" : diff > 0 ? "text-emerald-300 font-medium" : "text-red-300 font-medium"}>
                          {diff >= 0 ? "+" : ""}{diff.toFixed(1)}h
                        </span>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {error ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {error}</div>
          ) : entries.length === 0 ? (
            <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center text-sm text-[#a89880]">
              No hours logged yet. Log clock-in/out times or a manual day total.
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-xl border border-[#e6dcc8] bg-white/[0.04]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-[#a89880] border-b border-[#e6dcc8] bg-white/[0.02]">
                      <th className="px-4 py-3 font-medium">Staff</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Clock in → out</th>
                      <th className="px-4 py-3 font-medium text-right">Hours</th>
                      <th className="px-4 py-3 font-medium">Note</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {entries.map((e) => (
                      <tr key={e.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-medium text-[#3a2f22]">{e.staffMember.name}</td>
                        <td className="px-4 py-3 text-[#a89880] text-xs">{new Date(e.date).toLocaleDateString("en-GB")}</td>
                        <td className="px-4 py-3 text-[#a89880] text-xs">
                          {e.clockIn ? new Date(e.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                          {" → "}
                          {e.clockOut ? new Date(e.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-[#3a2f22]">{e.hours.toFixed(1)}h</td>
                        <td className="px-4 py-3 text-[#a89880] text-xs max-w-40 truncate">{e.note ?? "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDelete(e.id)} className="p-2 rounded-lg border border-[#e6dcc8] bg-[#f6efe3] hover:bg-red-500/20" aria-label="Delete entry">
                            <Trash2 className="h-4 w-4 text-red-300" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div className="bg-[#0F1729] rounded-xl border border-[#e6dcc8] p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[#3a2f22]">Log hours</h2>
            <p className="text-xs text-[#a89880] mt-1">Hours derive from clock times when both are set, otherwise an 8h day is recorded.</p>
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
                  <label className="text-sm font-medium text-[#3a2f22]">Clock in</label>
                  <Input value={clockIn} onChange={(e) => setClockIn(e.target.value)} type="time" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Clock out</label>
                  <Input value={clockOut} onChange={(e) => setClockOut(e.target.value)} type="time" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Note</label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
              {formError && <p className="text-sm text-red-300 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghostDark" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Log</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
