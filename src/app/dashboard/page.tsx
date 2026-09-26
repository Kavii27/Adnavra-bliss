"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, ArrowRight, Tag, Smile, Store, Loader2, AlertCircle, RefreshCw } from "lucide-react";

const SERIF = "font-[family-name:var(--font-display)]";

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

function statusPill(status: string): string {
  const map: Record<string, string> = {
    CONFIRMED: "bg-[#DCF5E7] text-[#15803D]",
    CANCELLED: "bg-[#F3EEE4] text-[#8A8377]",
    PENDING: "bg-[#FDECD8] text-[#B45309]",
    COMPLETED: "bg-[#F3EEE4] text-[#795831]",
    NO_SHOW: "bg-[#FDECEC] text-[#B91C1C]",
  };
  return map[status] ?? "bg-[#F3EEE4] text-[#4A4640]";
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
    <div className="min-h-full bg-[#FAF7F2] px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9A7B4F]">
            Dashboard
          </p>
          <h1 className={`${SERIF} mt-1 text-3xl font-medium tracking-tight text-[#1F1B17]`}>Home</h1>
          <p className="mt-1.5 text-sm text-[#8A8377]">
            {formatLongDate(todayIso)}. Day at a glance. All bookings are scoped to your business.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#E5DDD0] bg-white px-4 py-2 text-sm font-medium text-[#4A4640] transition-colors hover:bg-[#FBF7EF] hover:text-[#1F1E1D] sm:w-auto"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {!isNoBusiness && error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#FDECEC] bg-[#FDECEC] px-4 py-3 text-sm text-[#B91C1C]">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {isNoBusiness ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#E5DDD0] bg-white p-6 text-center sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F3EEE4]">
            <Store className="h-6 w-6 text-[#1B1714]" />
          </div>
          <h3 className={`${SERIF} mt-5 text-xl font-semibold text-[#1F1B17]`}>Set up your salon to see bookings</h3>
          <p className="mt-1.5 text-sm text-[#8A8377]">Create your business profile in Settings and bookings will appear here.</p>
          <Link
            href="/dashboard/settings"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#1F1B17] px-7 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#795831]"
          >
            Go to Settings
          </Link>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="overflow-hidden rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)]">
              <div className="h-1 w-full bg-[#C9A26D]" />
              <div className="p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9A7B4F]">Today&apos;s appointments</p>
                {loading ? (
                  <p className="mt-3 flex items-center gap-2 text-sm text-[#8A8377]">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                  </p>
                ) : (
                  <p className={`${SERIF} mt-2 text-4xl font-semibold text-[#1F1B17]`}>{bookings.length}</p>
                )}
                <p className="mt-1 text-xs text-[#8A8377]">{loading ? "-" : `${confirmedCount} confirmed · ${pendingCount} pending`}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)]">
              <div className="h-1 w-full bg-[#C9A26D]" />
              <div className="p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9A7B4F]">Next appointment</p>
                {loading ? (
                  <p className="mt-3 text-sm text-[#8A8377]">Loading...</p>
                ) : upcoming.length === 0 ? (
                  <p className="mt-3 text-sm text-[#8A8377]">No appointments today</p>
                ) : (
                  <>
                    <p className={`${SERIF} mt-2 truncate text-lg font-semibold text-[#1F1B17]`}>
                      {upcoming[0].service?.name} · {upcoming[0].customer?.name}
                    </p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#8A8377]">
                      <Clock className="h-3.5 w-3.5 text-[#9A7B4F]" />
                      {new Date(upcoming[0].startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} to{" "}
                      {new Date(upcoming[0].endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)]">
              <div className="h-1 w-full bg-[#C9A26D]" />
              <div className="p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9A7B4F]">Quick actions</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/dashboard/calendar"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-[#1F1B17] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#795831] sm:w-auto"
                  >
                    <Calendar className="h-3.5 w-3.5" /> Open calendar
                  </Link>
                  <Link
                    href="/dashboard/sales/appointments"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full border border-[#E5DDD0] bg-white px-3.5 py-2 text-xs font-semibold text-[#1F1E1D] transition-colors hover:bg-[#FBF7EF] sm:w-auto"
                  >
                    View all bookings
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Quick links to Calendar / Sales / Clients */}
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Link
              href="/dashboard/calendar"
              className="group flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-[#E9E1D3] bg-white p-4 shadow-[0_2px_12px_rgba(30,28,26,0.04)] transition-shadow hover:shadow-[0_8px_24px_rgba(30,28,26,0.08)] sm:p-5"
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1F1B17]">
                  <Calendar className="h-4 w-4 text-[#9A7B4F]" /> Calendar
                </div>
                <p className="mt-1 text-xs text-[#8A8377]">Day view by team member</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[#8A8377] transition-colors group-hover:text-[#1F1E1D]" />
            </Link>
            <Link
              href="/dashboard/sales/appointments"
              className="group flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-[#E9E1D3] bg-white p-4 shadow-[0_2px_12px_rgba(30,28,26,0.04)] transition-shadow hover:shadow-[0_8px_24px_rgba(30,28,26,0.08)] sm:p-5"
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1F1B17]">
                  <Tag className="h-4 w-4 text-[#9A7B4F]" /> Sales
                </div>
                <p className="mt-1 text-xs text-[#8A8377]">Appointments and daily summary</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[#8A8377] transition-colors group-hover:text-[#1F1E1D]" />
            </Link>
            <Link
              href="/dashboard/clients"
              className="group flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-[#E9E1D3] bg-white p-4 shadow-[0_2px_12px_rgba(30,28,26,0.04)] transition-shadow hover:shadow-[0_8px_24px_rgba(30,28,26,0.08)] sm:p-5"
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1F1B17]">
                  <Smile className="h-4 w-4 text-[#9A7B4F]" /> Clients
                </div>
                <p className="mt-1 text-xs text-[#8A8377]">Your customer list</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[#8A8377] transition-colors group-hover:text-[#1F1E1D]" />
            </Link>
          </div>

          {/* Today's upcoming bookings */}
          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className={`${SERIF} text-xl font-semibold text-[#1F1B17]`}>Today&apos;s upcoming bookings</h2>
              <Link href="/dashboard/sales/appointments" className="inline-flex items-center gap-1 text-xs font-medium text-[#8A8377] hover:text-[#1F1E1D]">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-[#8A8377]">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading bookings...
              </div>
            ) : upcoming.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-[#E5DDD0] bg-white p-6 text-center sm:p-10">
                <Calendar className="mx-auto h-6 w-6 text-[#B4AC9E]" />
                <p className="mt-2 text-sm text-[#4A4640]">No bookings today.</p>
                <p className="text-xs text-[#8A8377]">Bookings appear here when customers book via your public page.</p>
                <Link href="/dashboard/calendar" className="mt-3 inline-flex text-xs font-medium text-[#795831] hover:underline">
                  Open calendar
                </Link>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {upcoming.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col items-stretch gap-3 rounded-2xl border border-[#E9E1D3] bg-white px-4 py-4 shadow-[0_2px_12px_rgba(30,28,26,0.04)] sm:flex-row sm:items-center sm:px-5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#FBF7EF] px-2 py-0.5 font-mono text-xs text-[#1F1E1D]">{b.reference}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusPill(b.status)}`}>{b.status}</span>
                      </div>
                      <p className="mt-1.5 truncate text-sm font-medium text-[#1F1E1D]">
                        {b.customer?.name} · {b.service?.name}
                      </p>
                      <p className="flex flex-wrap items-center gap-3 text-xs text-[#8A8377]">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} to{" "}
                          {new Date(b.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span>{b.service?.duration} min</span>
                        {b.staffMember && <span>Staff: {b.staffMember.name}</span>}
                      </p>
                    </div>
                    <Link
                      href="/dashboard/calendar"
                      className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full border border-[#E5DDD0] bg-white px-3.5 py-1.5 text-xs font-medium text-[#1F1E1D] transition-colors hover:bg-[#FBF7EF] sm:w-auto"
                    >
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
