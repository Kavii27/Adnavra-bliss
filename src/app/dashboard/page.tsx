"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, ArrowRight, Tag, Smile, Store, Loader2, AlertCircle, RefreshCw } from "lucide-react";

type Booking = {
  id: string;
  reference: string;
  status: string;
  startTime: string;
  endTime: string;
  customer: { name: string; email: string | null; phone: string | null };
  service: { name: string; duration: number };
  staffMember: { name: string } | null;
};

function formatLongDate(iso: string): string {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function DashboardHomePage() {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/bookings?date=${todayIso}&limit=100&page=1`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed to load bookings");
      setBookings(j.data ?? []);
    } catch (e: unknown) {
      setError((e as Error).message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isNoBusiness = (error?.toLowerCase().includes("no business") ?? false) || (error?.toLowerCase().includes("no business linked") ?? false);
  const upcoming = bookings
    .slice()
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 6);

  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED").length;
  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;

  return (
    <div className="min-h-full bg-[#0F1729] px-6 py-8 text-[#3a2f22]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#3a2f22]">Home</h1>
          <p className="mt-1 text-sm text-[#a89880]">
            {formatLongDate(todayIso)} — day at a glance. All bookings are scoped to your business.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm font-medium text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

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

      {/* Stats */}
      {isNoBusiness ? (
        <div className="mt-8 rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe3] border border-[#e6dcc8]">
            <Store className="h-5 w-5 text-[#a89880]" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-[#3a2f22]">Set up your salon to see bookings</h3>
          <p className="mt-1 text-sm text-[#a89880]">Create your business profile in Settings and bookings will appear here.</p>
          <Link
            href="/dashboard/settings"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#faf6ef] hover:bg-white/90"
          >
            Go to Settings
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-5">
              <p className="text-xs uppercase tracking-wide text-[#a89880]">Today&apos;s appointments</p>
              {loading ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-[#a89880]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                </p>
              ) : (
                <p className="mt-3 text-3xl font-semibold text-[#3a2f22]">{bookings.length}</p>
              )}
              <p className="mt-1 text-xs text-[#a89880]">
                {loading ? "—" : `${confirmedCount} confirmed · ${pendingCount} pending`}
              </p>
            </div>
            <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-5">
              <p className="text-xs uppercase tracking-wide text-[#a89880]">Next appointment</p>
              {loading ? (
                <p className="mt-3 text-sm text-[#a89880]">Loading...</p>
              ) : upcoming.length === 0 ? (
                <p className="mt-3 text-sm text-[#a89880]">No appointments today</p>
              ) : (
                <>
                  <p className="mt-3 text-sm font-medium text-[#3a2f22] truncate">
                    {upcoming[0].service?.name} — {upcoming[0].customer?.name}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-[#a89880]">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(upcoming[0].startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} to{" "}
                    {new Date(upcoming[0].endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </>
              )}
            </div>
            <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-5">
              <p className="text-xs uppercase tracking-wide text-[#a89880]">Quick actions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/dashboard/calendar"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-sidebar-active)] px-3 py-1.5 text-xs font-semibold text-[#3a2f22] hover:opacity-90"
                >
                  <Calendar className="h-3.5 w-3.5" /> Open calendar
                </Link>
                <Link href="/dashboard/sales/appointments" className="inline-flex items-center gap-1.5 rounded-full bg-[#f3ebdd] px-3 py-1.5 text-xs font-semibold text-[#3a2f22] hover:bg-white/15">
                  View all bookings
                </Link>
              </div>
            </div>
          </div>

          {/* Quick links to Calendar / Sales / Clients */}
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Link href="/dashboard/calendar" className="group flex items-center justify-between rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-5 hover:bg-white/[0.07]">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#3a2f22]">
                  <Calendar className="h-4 w-4 text-[#a89880]" /> Calendar
                </div>
                <p className="mt-1 text-xs text-[#a89880]">Day view by team member</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[#a89880] group-hover:text-[#3a2f22]" />
            </Link>
            <Link href="/dashboard/sales/appointments" className="group flex items-center justify-between rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-5 hover:bg-white/[0.07]">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#3a2f22]">
                  <Tag className="h-4 w-4 text-[#a89880]" /> Sales
                </div>
                <p className="mt-1 text-xs text-[#a89880]">Appointments and daily summary</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[#a89880] group-hover:text-[#3a2f22]" />
            </Link>
            <Link href="/dashboard/clients" className="group flex items-center justify-between rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-5 hover:bg-white/[0.07]">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#3a2f22]">
                  <Smile className="h-4 w-4 text-[#a89880]" /> Clients
                </div>
                <p className="mt-1 text-xs text-[#a89880]">Your customer list</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[#a89880] group-hover:text-[#3a2f22]" />
            </Link>
          </div>

          {/* Today's upcoming bookings */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#3a2f22]">Today&apos;s upcoming bookings</h2>
              <Link href="/dashboard/sales/appointments" className="text-xs font-medium text-[#a89880] hover:text-[#3a2f22] inline-flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-[#a89880]">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading bookings...
              </div>
            ) : upcoming.length === 0 ? (
              <div className="mt-4 rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
                <Calendar className="h-6 w-6 text-[#a89880] mx-auto" />
                <p className="mt-2 text-sm text-[#a89880]">No bookings today.</p>
                <p className="text-xs text-[#a89880]/70">Bookings appear here when customers book via your public page.</p>
                <Link href="/dashboard/calendar" className="mt-3 inline-flex text-xs font-medium text-[#3a2f22] hover:underline">
                  Open calendar
                </Link>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {upcoming.map((b) => (
                  <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e6dcc8] bg-white/[0.04] px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[#f3ebdd] px-2 py-0.5 font-mono text-xs text-[#3a2f22]">{b.reference}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            b.status === "CONFIRMED"
                              ? "bg-[#DCF5E7] text-[#166534]"
                              : b.status === "CANCELLED"
                                ? "bg-[#f3ebdd] text-[#a89880]"
                                : b.status === "PENDING"
                                  ? "bg-[#FDE68A] text-[#92400E]"
                                  : "bg-[#f3ebdd] text-[#3a2f22]"
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-[#3a2f22] truncate">
                        {b.customer?.name} · {b.service?.name}
                      </p>
                      <p className="text-xs text-[#a89880] flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                          {new Date(b.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span>{b.service?.duration} min</span>
                        {b.staffMember && <span>Staff: {b.staffMember.name}</span>}
                      </p>
                    </div>
                    <Link href="/dashboard/calendar" className="shrink-0 rounded-lg border border-[#e6dcc8] bg-[#f6efe3] px-3 py-1.5 text-xs font-medium text-[#3a2f22] hover:bg-[#f3ebdd]">
                      View in calendar
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
