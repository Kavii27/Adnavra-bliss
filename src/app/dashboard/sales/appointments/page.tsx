"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Calendar, Clock, RefreshCw, Store, ChevronLeft, ChevronRight } from "lucide-react";

type Booking = {
  id: string;
  reference: string;
  status: string;
  startTime: string;
  endTime: string;
  customer: { name: string; email: string | null; phone: string | null };
  service: { name: string; duration: number; price: number };
  staffMember: { name: string } | null;
};

const STATUSES = ["ALL", "CONFIRMED", "PENDING", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;

export default function AppointmentsPage() {
  const todayIso = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState<string>(todayIso);
  const [status, setStatus] = useState<string>("ALL");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  async function load(p = 1, forDate = date, forStatus = status) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ date: forDate, page: String(p), limit: "20" });
      if (forStatus !== "ALL") params.set("status", forStatus);
      const r = await fetch(`/api/bookings?${params.toString()}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed to load bookings");
      setBookings(j.data ?? []);
      setTotalPages(j.pagination?.pages ?? 1);
      setPage(j.pagination?.page ?? p);
      setTotal(j.pagination?.total ?? 0);
    } catch (e: unknown) {
      setError((e as Error).message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1, date, status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, status]);

  const isNoBusiness = error?.toLowerCase().includes("no business") ?? false;

  function addDays(iso: string, delta: number): string {
    const d = new Date(iso + "T12:00:00");
    d.setDate(d.getDate() + delta);
    return d.toISOString().slice(0, 10);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9A7B4F]">Sales</p>
          <h1 className="font-[family-name:var(--font-display)] mt-1 text-3xl font-medium tracking-tight text-[#1F1B17]">Appointments</h1>
          <p className="mt-1.5 text-sm text-[#8A8377]">All bookings for your business, scoped by your session. Filter by date and status.</p>
        </div>
        <button
          onClick={() => load(page, date, status)}
          className="inline-flex items-center gap-2 rounded-full border border-[#E5DDD0] bg-white px-4 py-2 text-sm font-medium text-[#4A4640] transition-colors hover:bg-[#FBF7EF] hover:text-[#1F1E1D]"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Filters: date nav + status */}
      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-[#E9E1D3] bg-white px-3 py-2.5 shadow-[0_4px_20px_rgba(30,28,26,0.05)]">
        <div className="flex items-center gap-1">
          <button onClick={() => setDate(todayIso)} className="rounded-full border border-[#E9E1D3] bg-[#FBF7EF] px-3 py-1.5 text-xs font-semibold text-[#1F1E1D] hover:bg-[#F3EEE4]">Today</button>
          <button aria-label="Previous day" onClick={() => setDate((d) => addDays(d, -1))} className="flex h-8 w-8 items-center justify-center rounded-full text-[#8A8377] hover:bg-[#FBF7EF] hover:text-[#1F1E1D]"><ChevronLeft className="h-4 w-4" /></button>
          <button aria-label="Next day" onClick={() => setDate((d) => addDays(d, 1))} className="flex h-8 w-8 items-center justify-center rounded-full text-[#8A8377] hover:bg-[#FBF7EF] hover:text-[#1F1E1D]"><ChevronRight className="h-4 w-4" /></button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="ml-1 rounded-lg border border-[#E9E1D3] bg-[#FBF7EF] px-2 py-1.5 text-sm text-[#1F1E1D] focus:outline-none" />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${status === s ? "bg-[#1F1B17] text-white" : "bg-[#FBF7EF] text-[#8A8377] hover:bg-[#F3EEE4] hover:text-[#1F1E1D] border border-[#E9E1D3]"}`}
            >
              {s === "ALL" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {isNoBusiness ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#E5DDD0] bg-white p-10 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, #D9BE8C, #C9A467)" }}
          >
            <Store className="h-6 w-6 text-[#1B1714]" />
          </div>
          <h3 className="font-[family-name:var(--font-display)] mt-5 text-xl font-semibold text-[#1F1B17]">Set up your salon to see appointments</h3>
          <p className="mt-1.5 text-sm text-[#8A8377]">Create your business profile in Settings and bookings will appear here.</p>
          <Link
            href="/dashboard/settings"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#1F1B17] px-7 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#795831]"
          >
            Go to Settings
          </Link>
          {error && <p className="mt-3 text-xs text-[#8A8377]/60">{error}</p>}
        </div>
      ) : error ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#FDECEC] bg-[#FDECEC] px-4 py-3 text-sm text-[#B91C1C]"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</div>
      ) : loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-[#8A8377]"><Loader2 className="h-4 w-4 animate-spin" /> Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#E5DDD0] bg-white p-10 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, #D9BE8C, #C9A467)" }}
          >
            <Calendar className="h-6 w-6 text-[#1B1714]" />
          </div>
          <p className="mt-4 text-sm text-[#4A4640]">No bookings for {date}{status !== "ALL" ? ` with status ${status}` : ""}.</p>
          <p className="text-xs text-[#8A8377]">Bookings appear here when customers book via your public page.</p>
          <Link href="/dashboard/calendar" className="mt-3 inline-flex text-xs font-medium text-[#795831] hover:underline">Open calendar</Link>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)] divide-y divide-[#F3EEE4]">
            <div className="px-4 py-3 bg-[#FBF7EF] text-xs text-[#8A8377] flex items-center gap-2">
              <Calendar className="h-4 w-4" /> {total} booking(s) — page {page} of {totalPages} · {date}
            </div>
            {bookings.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-[#FBF7EF]/60">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#FBF7EF] px-2 py-0.5 font-mono text-xs text-[#1F1E1D]">{b.reference}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.status === "CONFIRMED" ? "bg-[#DCF5E7] text-[#166534]" : b.status === "CANCELLED" ? "bg-[#FBF7EF] text-[#8A8377]" : b.status === "PENDING" ? "bg-[#FDE68A] text-[#92400E]" : b.status === "COMPLETED" ? "bg-[#A7F3D0] text-[#064e3b]" : "bg-[#FBF7EF] text-[#1F1E1D]"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-[#1F1E1D] truncate">{b.customer?.name} · {b.service?.name}</p>
                  <p className="text-xs text-[#8A8377] flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date(b.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <span>{b.service?.duration} min</span>
                    {b.staffMember && <span>Staff: {b.staffMember.name}</span>}
                  </p>
                  {(b.customer?.phone || b.customer?.email) && <p className="text-xs text-[#8A8377]/70">{b.customer.phone ?? ""}{b.customer.email ? ` · ${b.customer.email}` : ""}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#8A8377]">{new Date(b.startTime).toLocaleDateString()}</p>
                  <Link href="/dashboard/calendar" className="mt-1 inline-flex rounded-full border border-[#E5DDD0] bg-white px-3 py-1 text-xs font-medium text-[#1F1E1D] hover:bg-[#FBF7EF]">View in calendar</Link>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => load(page - 1)} className="rounded-full border border-[#E5DDD0] bg-white px-3 py-1.5 text-sm font-medium text-[#1F1E1D] hover:bg-[#FBF7EF] disabled:opacity-40 shadow-sm">Prev</button>
              <span className="text-sm text-[#8A8377]">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => load(page + 1)} className="rounded-full border border-[#E5DDD0] bg-white px-3 py-1.5 text-sm font-medium text-[#1F1E1D] hover:bg-[#FBF7EF] disabled:opacity-40 shadow-sm">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
