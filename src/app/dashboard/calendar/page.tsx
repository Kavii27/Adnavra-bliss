"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Store, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { CalendarProTools } from "@/components/dashboard/calendar-pro-tools";
import { AddBookingModal } from "@/components/dashboard/add-booking-modal";

type Booking = {
  id: string;
  reference: string;
  status: string;
  startTime: string;
  endTime: string;
  customer: { name: string };
  service: { name: string };
  staffMemberId?: string | null;
  staffMember?: { id: string; name: string } | null;
};

type Staff = { id: string; name: string };

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDayLabel(iso: string): string {
  try {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function addDays(iso: string, delta: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function minutesFromMidnight(dateStr: string): number {
  const d = new Date(dateStr);
  return d.getHours() * 60 + d.getMinutes();
}

export default function CalendarPage() {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [staffFilter, setStaffFilter] = useState<string>("");
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // booking fetch does not need businessId (session-scoped); staff fetch does
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/bookings?date=${date}&limit=100&page=1`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed to load");
      setBookings(j.data ?? []);

      // fetch staff for column layout — best effort, never blocks calendar
      try {
        const bRes = await fetch("/api/businesses");
        const bJson = await bRes.json();
        const bizId: string | undefined = bJson.data?.[0]?.id;
        setBusinessId(bizId ?? null);
        if (bizId) {
          const sRes = await fetch(`/api/staff?businessId=${bizId}&limit=100`);
          const sJson = await sRes.json();
          if (sRes.ok && Array.isArray(sJson.data)) {
            setStaff(sJson.data.map((s: Staff) => ({ id: s.id, name: s.name })));
          }
        } else {
          setStaff([]);
        }
      } catch {
        // keep existing staff
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => 8 + i), []);
  const HOUR_HEIGHT = 60; // px per hour
  const GRID_HEIGHT = hours.length * HOUR_HEIGHT;

  // Build columns: each real staff + trailing Unassigned column
  const columns = useMemo(() => {
    if (staff.length === 0) {
      return [{ id: null as string | null, name: "Unassigned" }];
    }
    // Include Unassigned so solo owners always have a visible column
    return [...staff.map((s) => ({ id: s.id, name: s.name })), { id: null as string | null, name: "Unassigned" }];
  }, [staff]);

  // Visible bookings after the team-member filter (empty filter = everyone)
  const visibleBookings = useMemo(() => {
    if (!staffFilter) return bookings;
    return bookings.filter((b) => (b.staffMemberId ?? b.staffMember?.id ?? "") === staffFilter);
  }, [bookings, staffFilter]);

  // Group bookings by staff column
  const bookingsByColumn = useMemo(() => {
    const map = new Map<string | null, Booking[]>();
    for (const c of columns) map.set(c.id as string | null, []);
    for (const b of visibleBookings) {
      const key = (b.staffMemberId ?? b.staffMember?.id ?? null) as string | null;
      // if column exists for this staff, place there, otherwise to Unassigned
      if (map.has(key)) map.get(key)!.push(b);
      else map.get(null)!.push(b);
    }
    return map;
  }, [visibleBookings, columns]);

  const isNoBusiness = error?.toLowerCase().includes("no business") ?? false;
  const dayLabel = formatDayLabel(date);

  return (
    <div className="min-h-full bg-[#0F1729] px-4 py-6 text-[#3a2f22] md:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-[#3a2f22]">Calendar</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm text-[#3a2f22] placeholder:text-[#a89880] focus:outline-none focus:ring-2 focus:ring-[var(--color-sidebar-active)]"
        />
      </div>

      {/* Control row — matches screenshot 10 */}
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#e6dcc8] bg-white/[0.04] px-3 py-2.5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDate(new Date().toISOString().slice(0, 10))}
            className="rounded-full border border-[#e6dcc8] bg-[#f6efe3] px-3 py-1.5 text-xs font-semibold text-[#3a2f22] hover:bg-[#f3ebdd]"
          >
            Today
          </button>
          <button
            aria-label="Previous day"
            onClick={() => setDate((d) => addDays(d, -1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            aria-label="Next day"
            onClick={() => setDate((d) => addDays(d, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="ml-1 text-sm font-medium text-[#3a2f22]">{dayLabel}</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 ml-2 pl-3 border-l border-[#e6dcc8]">
          <select
            aria-label="Filter by team member"
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="rounded-full bg-[#f6efe3] px-3 py-1.5 text-xs font-medium text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22] focus:outline-none focus:ring-2 focus:ring-[var(--color-sidebar-active)]"
          >
            <option value="">Scheduled team</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center rounded-lg border border-[#e6dcc8] bg-[#f6efe3] px-3 py-1.5 text-xs font-semibold text-[#3a2f22]">
            Day view
          </span>
          <button
            onClick={() => setAddOpen(true)}
            disabled={!businessId}
            title={businessId ? "Add a walk-in or phone booking" : "Create your business profile first"}
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-sidebar-active)] px-3 py-1.5 text-xs font-semibold text-[#3a2f22] hover:opacity-90 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-[#a89880]">Day view showing bookings on {date}, ordered by time.</p>

      {(() => {
        if (isNoBusiness) return null;
        if (error) {
          return (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-300">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          );
        }
        return null;
      })()}

      {loading ? (
        <div className="mt-8 flex items-center gap-2 text-sm text-[#a89880]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      ) : isNoBusiness ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe3] border border-[#e6dcc8]">
            <Store className="h-5 w-5 text-[#a89880]" />
          </div>
          <h3 className="mt-3 text-sm font-medium text-[#3a2f22]">Set up your salon to see your calendar</h3>
          <p className="mt-1 text-sm text-[#a89880]">You have not created a business profile yet. Create it in Settings and bookings will appear here.</p>
          <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#3a2f22] hover:bg-[#f6efe3]">
            Go to Settings
          </Link>
          {error && <p className="mt-3 text-xs text-[#a89880]/60">{error}</p>}
        </div>
      ) : visibleBookings.length === 0 && staff.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-white/[0.04] overflow-hidden">
          {/* Still render the empty column shell so solo owners see the grid */}
          <div className="grid" style={{ gridTemplateColumns: `64px 1fr` }}>
            <div className="border-r border-[#e6dcc8] bg-[#faf6ef] px-2 py-3">
              <div className="flex flex-col gap-1">
                {hours.map((h) => (
                  <div key={h} className="text-[11px] text-[#a89880] leading-none" style={{ height: HOUR_HEIGHT }}>
                    {String(h).padStart(2, "0")}:00
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-center border-b border-[#e6dcc8] bg-[#faf6ef] px-3 py-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3ebdd] text-xs font-semibold text-[#3a2f22]">—</div>
                  <span className="text-xs font-medium text-[#a89880]">Unassigned</span>
                </div>
              </div>
              <div className="relative" style={{ height: GRID_HEIGHT }}>
                <div className="absolute inset-0 flex flex-col">
                  {hours.map((h) => (
                    <div key={h} className="border-b border-white/[0.06]" style={{ height: HOUR_HEIGHT }} />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <p className="text-sm text-[#a89880] text-center">
                    {staffFilter ? "No bookings for this team member on this day." : "No bookings on this day."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-white/[0.04] overflow-hidden">
          {/* Staff header row */}
          <div className="grid border-b border-[#e6dcc8] bg-[#faf6ef]" style={{ gridTemplateColumns: `64px repeat(${columns.length}, minmax(0, 1fr))` }}>
            <div className="border-r border-[#e6dcc8] px-2 py-3 text-[11px] font-medium text-[#a89880]">Time</div>
            {columns.map((c) => (
              <div key={String(c.id ?? "unassigned")} className="flex flex-col items-center justify-center gap-1 border-r border-[#e6dcc8] px-2 py-3 last:border-r-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f3ebdd] text-xs font-semibold text-[#3a2f22] ring-1 ring-white/10">
                  {c.name === "Unassigned" ? "—" : initials(c.name)}
                </div>
                <span className="max-w-full truncate text-xs font-medium text-[#3a2f22] text-center">{c.name}</span>
              </div>
            ))}
          </div>

          {/* Grid body: gutter + each staff column as positioned container */}
          <div className="grid" style={{ gridTemplateColumns: `64px repeat(${columns.length}, minmax(0, 1fr))` }}>
            {/* Time gutter */}
            <div className="relative border-r border-[#e6dcc8] bg-[#0F1729]" style={{ height: GRID_HEIGHT }}>
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-white/[0.06] px-2 text-[11px] text-[#a89880]"
                  style={{ top: (h - 8) * HOUR_HEIGHT }}
                >
                  <span className="relative -top-2 bg-[#0F1729] pr-1">{String(h).padStart(2, "0")}:00</span>
                </div>
              ))}
            </div>

            {/* Staff columns */}
            {columns.map((c) => {
              const colBookings = bookingsByColumn.get(c.id as string | null) ?? [];
              return (
                <div key={String(c.id ?? "unassigned-col")} className="relative border-r border-white/[0.06] bg-[#0F1729] last:border-r-0" style={{ height: GRID_HEIGHT }}>
                  {/* hour lines */}
                  <div className="absolute inset-0">
                    {hours.map((h) => (
                      <div key={h} className="absolute left-0 right-0 border-t border-white/[0.06]" style={{ top: (h - 8) * HOUR_HEIGHT }} />
                    ))}
                  </div>

                  {/* bookings as colored blocks positioned by time */}
                  {colBookings
                    .slice()
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map((b) => {
                      const startMin = minutesFromMidnight(b.startTime);
                      const endMin = minutesFromMidnight(b.endTime);
                      const top = Math.max(0, startMin - 8 * 60); // 1 px per minute because HOUR_HEIGHT 60
                      const height = Math.max(22, (endMin - startMin || 30) * (HOUR_HEIGHT / 60));
                      // clamp if outside 8-19
                      if (startMin < 8 * 60 || startMin >= 20 * 60) {
                        // still render but at edge
                      }
                      const statusColor =
                        b.status === "CONFIRMED"
                          ? "bg-[#8a6d4f] text-[#faf6ef] border-[#8a6d4f]"
                          : b.status === "PENDING"
                            ? "bg-[#FDE68A] text-[#78350f] border-[#FDE68A]"
                            : b.status === "CANCELLED"
                              ? "bg-[#f3ebdd] text-[#a89880] border-[#e6dcc8]"
                              : "bg-[#A7F3D0] text-[#064e3b] border-[#A7F3D0]";
                      return (
                        <div
                          key={b.id}
                          className={`absolute left-1 right-1 rounded-lg border px-2 py-1.5 text-xs shadow-sm overflow-hidden ${statusColor}`}
                          style={{ top: `${top}px`, height: `${Math.min(height, GRID_HEIGHT - top - 2)}px` }}
                          title={`${b.service?.name} · ${b.customer?.name} · ${b.reference}`}
                        >
                          <p className="font-semibold leading-tight truncate">{b.service?.name}</p>
                          <p className="leading-tight truncate opacity-80 text-[11px]">{b.customer?.name} · {b.reference}</p>
                          <p className="text-[11px] font-medium opacity-70">
                            {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                            {new Date(b.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>

          {/* Footer summary */}
          <div className="border-t border-[#e6dcc8] bg-[#faf6ef] px-4 py-2.5 flex items-center gap-2 text-xs text-[#a89880]">
            <span>
              {visibleBookings.length} booking(s) on {date}{staffFilter ? " (filtered by team member)" : ""}
            </span>
            <button onClick={load} className="ml-auto rounded-full border border-[#e6dcc8] bg-[#f6efe3] px-3 py-1.5 text-xs font-medium text-[#3a2f22] hover:bg-[#f3ebdd]">
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Professional scheduling extras — custom labels + bulk reschedule */}
      <PlanGate feature="advancedScheduling">
        <CalendarProTools bookings={bookings} onChanged={load} />
      </PlanGate>

      {addOpen && businessId && (
        <AddBookingModal
          businessId={businessId}
          staff={staff}
          defaultDate={date}
          onClose={() => setAddOpen(false)}
          onCreated={() => {
            setAddOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
