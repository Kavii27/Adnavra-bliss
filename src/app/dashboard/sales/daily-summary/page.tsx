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
          <h1 className="text-xl font-semibold text-[#3a2f22]">Daily sales summary</h1>
          <p className="mt-1 text-sm text-[#a89880]">Transaction summary for the selected day. Only completed bookings are counted.</p>
        </div>
        <Link href="/dashboard/sales/appointments" className="rounded-lg border border-[#e6dcc8] bg-[#f6efe3] px-3 py-1.5 text-xs font-medium text-[#3a2f22] hover:bg-[#f3ebdd]">
          View appointments
        </Link>
      </div>

      {/* Date navigation */}
      <div className="mt-6 flex items-center gap-2">
        <button aria-label="Previous day" onClick={() => setDate((d) => addDays(d, -1))} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e6dcc8] bg-[#f6efe3] text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => setDate(todayStr)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${isToday ? "bg-[#8a6d4f] text-[#ffffff]" : "border border-[#e6dcc8] bg-[#f6efe3] text-[#3a2f22] hover:bg-[#f3ebdd]"}`}
        >
          Today
        </button>
        <span className="ml-1 text-sm font-medium text-[#3a2f22]">{formatDateLabel(date)}</span>
        <button aria-label="Next day" onClick={() => setDate((d) => addDays(d, 1))} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e6dcc8] bg-[#f6efe3] text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]">
          <ChevronRight className="h-4 w-4" />
        </button>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="ml-2 rounded-lg border border-[#e6dcc8] bg-[#f6efe3] px-2 py-1.5 text-sm text-[#3a2f22] focus:outline-none focus:ring-2 focus:ring-[var(--color-sidebar-active)]" />
      </div>

      {isNoBusiness ? (
        <div className="mt-8 rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe3] border border-[#e6dcc8]">
            <Store className="h-5 w-5 text-[#a89880]" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-[#3a2f22]">Set up your salon to see sales</h3>
          <p className="mt-1 text-sm text-[#a89880]">Create your business profile and completed bookings will appear here.</p>
          <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#faf6ef] hover:bg-white/90">Go to Settings</Link>
          {error && <p className="mt-3 text-xs text-[#a89880]/60">{error}</p>}
        </div>
      ) : error ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {error}</div>
      ) : loading ? (
        <div className="mt-8 flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
      ) : (
        <>
          {/* Transaction summary */}
          <div className="mt-8 rounded-xl border border-[#e6dcc8] bg-white/[0.04] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e6dcc8]">
              <h2 className="text-sm font-semibold text-[#3a2f22]">Transaction summary</h2>
              <p className="mt-1 text-xs text-[#a89880]">Completed bookings only. Other categories are not yet tracked.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-[#a89880] border-b border-[#e6dcc8] bg-white/[0.02]">
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium text-right">Sales qty</th>
                    <th className="px-5 py-3 font-medium text-right">Gross total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <tr>
                    <td className="px-5 py-3 text-[#3a2f22]">Services</td>
                    <td className="px-5 py-3 text-right text-[#3a2f22]">{servicesQty}</td>
                    <td className="px-5 py-3 text-right text-[#3a2f22]">{lkr(grossTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-xs text-[#a89880]">Product sales, packages, and memberships are not yet tracked in ADNAVRA.</p>
          </div>

          {/* Cash movement — honest placeholder */}
          <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-5">
            <h3 className="text-sm font-semibold text-[#3a2f22]">Cash movement summary</h3>
            <p className="mt-1 text-xs text-[#a89880]">Cash and payment tracking is on the ADNAVRA roadmap. Once online payments are available, daily cash movements will appear here.</p>
          </div>

          <p className="mt-4 text-xs text-[#a89880]">{bookings.length} booking(s) on this date · {completed.length} completed</p>
        </>
      )}
    </div>
  );
}
