"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, Store } from "lucide-react";
import { PlanGate } from "@/components/dashboard/plan-gate";

type Booking = {
  id: string;
  status: string;
  startTime: string;
  service: { name: string; price: number };
};

function lkr(minor: number): string {
  return (minor / 100).toLocaleString("en-LK", { style: "currency", currency: "LKR" });
}

function formatDateLabel(iso: string): string {
  try {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function addDays(iso: string, delta: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export default function DailySummaryPage() {
  return (
    <PlanGate feature="dailySummary">
      <DailySummaryPageInner />
    </PlanGate>
  );
}

function DailySummaryPageInner() {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(forDate: string) {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/bookings?date=${forDate}&limit=100&page=1`);
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
    load(date);
  }, [date]);

  const isNoBusiness = error?.toLowerCase().includes("no business") ?? false;

  // Only COMPLETED bookings count toward revenue; fallback to CONFIRMED if no COMPLETED yet
  // Spec says pick one consistent definition — we use COMPLETED, but if none, show 0 rather than silently switching.
  const completed = bookings.filter((b) => b.status === "COMPLETED");
  const servicesQty = completed.length;
  const grossTotal = completed.reduce((sum, b) => sum + (b.service?.price ?? 0), 0);
  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = date === todayStr;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9A7B4F]">Sales</p>
          <h1 className="font-[family-name:var(--font-display)] mt-1 text-3xl font-medium tracking-tight text-[#1F1B17]">Daily sales summary</h1>
          <p className="mt-1.5 text-sm text-[#8A8377]">Transaction summary for the selected day. Only completed bookings are counted.</p>
        </div>
        <Link href="/dashboard/sales/appointments" className="inline-flex items-center rounded-full border border-[#E5DDD0] bg-white px-4 py-2 text-sm font-medium text-[#4A4640] transition-colors hover:bg-[#FBF7EF] hover:text-[#1F1E1D]">
          View appointments
        </Link>
      </div>

      {/* Date navigation */}
      <div className="mt-6 flex items-center gap-2">
        <button aria-label="Previous day" onClick={() => setDate((d) => addDays(d, -1))} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E9E1D3] bg-white text-[#8A8377] hover:bg-[#FBF7EF] hover:text-[#1F1E1D]">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => setDate(todayStr)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${isToday ? "bg-[#1F1B17] text-white" : "border border-[#E9E1D3] bg-white text-[#1F1E1D] hover:bg-[#FBF7EF]"}`}
        >
          Today
        </button>
        <span className="ml-1 text-sm font-medium text-[#1F1E1D]">{formatDateLabel(date)}</span>
        <button aria-label="Next day" onClick={() => setDate((d) => addDays(d, 1))} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E9E1D3] bg-white text-[#8A8377] hover:bg-[#FBF7EF] hover:text-[#1F1E1D]">
          <ChevronRight className="h-4 w-4" />
        </button>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="ml-2 rounded-lg border border-[#E9E1D3] bg-white px-2 py-1.5 text-sm text-[#1F1E1D] focus:outline-none focus:ring-2 focus:ring-[#9A7B4F]" />
      </div>

      {isNoBusiness ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#E5DDD0] bg-white p-10 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, #D9BE8C, #C9A467)" }}
          >
            <Store className="h-6 w-6 text-[#1B1714]" />
          </div>
          <h3 className="font-[family-name:var(--font-display)] mt-5 text-xl font-semibold text-[#1F1B17]">Set up your salon to see sales</h3>
          <p className="mt-1.5 text-sm text-[#8A8377]">Create your business profile and completed bookings will appear here.</p>
          <Link
            href="/dashboard/settings"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#1F1B17] px-7 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#795831]"
          >
            Go to Settings
          </Link>
          {error && <p className="mt-3 text-xs text-[#8A8377]/60">{error}</p>}
        </div>
      ) : error ? (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-[#FDECEC] bg-[#FDECEC] px-4 py-3 text-sm text-[#B91C1C]"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</div>
      ) : loading ? (
        <div className="mt-8 flex items-center gap-2 text-sm text-[#8A8377]"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
      ) : (
        <>
          {/* Transaction summary */}
          <div className="mt-8 rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E9E1D3]">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#1F1B17]">Transaction summary</h2>
              <p className="mt-1 text-xs text-[#8A8377]">Completed bookings only. Other categories are not yet tracked.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-[#8A8377] border-b border-[#E9E1D3] bg-[#FBF7EF]">
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium text-right">Sales qty</th>
                    <th className="px-5 py-3 font-medium text-right">Gross total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EEE4]">
                  <tr>
                    <td className="px-5 py-3 text-[#1F1E1D]">Services</td>
                    <td className="px-5 py-3 text-right text-[#1F1E1D]">{servicesQty}</td>
                    <td className="px-5 py-3 text-right text-[#1F1E1D]">{lkr(grossTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-xs text-[#8A8377]">Product sales, packages, and memberships are not yet tracked in ADNAVRA.</p>
          </div>

          {/* Cash movement — honest placeholder */}
          <div className="mt-6 rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)] p-5">
            <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#1F1B17]">Cash movement summary</h3>
            <p className="mt-1 text-xs text-[#8A8377]">Cash and payment tracking is on the ADNAVRA roadmap. Once online payments are available, daily cash movements will appear here.</p>
          </div>

          <p className="mt-4 text-xs text-[#8A8377]">{bookings.length} booking(s) on this date · {completed.length} completed</p>
        </>
      )}
    </div>
  );
}
