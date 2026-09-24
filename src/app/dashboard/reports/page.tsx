"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Lock, BarChart3, TrendingUp, Users, CalendarDays, AlertCircle } from "lucide-react";
import { PlanGate } from "@/components/dashboard/plan-gate";

type Booking = {
  id: string;
  businessId: string;
  serviceId: string;
  staffMemberId: string | null;
  customerId: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  service?: { id: string; name: string; price: number };
  staffMember?: { id: string; name: string } | null;
};

type Staff = { id: string; name: string };

const REPORTS = [
  { id: "bookings-summary", title: "Bookings summary", description: "Bookings by status for the selected period.", available: true },
  { id: "services-summary", title: "Top services", description: "Most booked services for the selected period.", available: true },
  { id: "revenue-summary", title: "Revenue summary", description: "Completed-booking revenue by day.", available: true, gate: "basicAnalytics" as const },
  { id: "team-performance", title: "Team performance", description: "Bookings and revenue by team member.", available: true, gate: "basicAnalytics" as const },
  { id: "client-retention", title: "Client retention", description: "Repeat vs first-time clients.", available: true },
  { id: "online-presence", title: "Online presence", description: "Profile completeness signals that drive marketplace discovery.", available: true, gate: "advancedAnalytics" as const },
] as const;

type Period = "7d" | "30d" | "all";

function periodToSince(period: Period): Date | null {
  if (period === "all") return null;
  const d = new Date();
  if (period === "7d") d.setDate(d.getDate() - 7);
  if (period === "30d") d.setDate(d.getDate() - 30);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function ReportsPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("30d");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [profile, setProfile] = useState<{ logoUrl: string | null; description: string | null; address: string | null; openingHours: unknown } | null>(null);
  const [serviceCount, setServiceCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const r = await fetch("/api/businesses");
        const j = await r.json();
        if (!r.ok || !j.data?.[0]?.id) throw new Error("No business found");
        setBusinessId(j.data[0].id);
      } catch (e: unknown) {
        setError((e as Error).message);
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!businessId) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Fetch bookings (first 100) + staff. For accurate period report we fetch up to 100; if more, pagination note.
        const [bR, sR, bizR, svcR, revR] = await Promise.all([
          fetch(`/api/bookings?businessId=${businessId}&limit=100&page=1`),
          fetch(`/api/staff?businessId=${businessId}&limit=50`),
          fetch(`/api/businesses`).catch(() => null),
          fetch(`/api/services?businessId=${businessId}&limit=1`).catch(() => null),
          fetch(`/api/reviews?businessId=${businessId}&limit=1`).catch(() => null),
        ]);
        const bJ = await bR.json();
        const sJ = await sR.json();
        if (!bR.ok) throw new Error(bJ.error ?? "Failed to load bookings");
        setBookings(bJ.data ?? []);
        setStaffList((sJ.data ?? []).map((s: Staff) => ({ id: s.id, name: s.name })));
        // Presence signals — best effort, never fail the report over them.
        try {
          const bizJ = bizR ? await bizR.json() : null;
          const biz = bizR?.ok ? (bizJ.data?.[0] ?? bizJ.data) : null;
          if (biz) {
            setProfile({ logoUrl: biz.logoUrl ?? null, description: biz.description ?? null, address: biz.address ?? null, openingHours: biz.openingHours ?? null });
          }
          if (svcR?.ok) {
            const svcJ = await svcR.json();
            setServiceCount(svcJ.pagination?.total ?? (svcJ.data ?? []).length);
          }
          if (revR?.ok) {
            const revJ = await revR.json();
            setReviewCount(revJ.summary?.total ?? (revJ.data ?? []).length);
          }
        } catch {
          // presence stays at defaults
        }
        // If total > 100, warn in UI that report is sampled — honesty over fake completeness.
        if ((bJ.pagination?.total ?? 0) > 100) {
          // keep note via metadata; we surface it below
        }
      } catch (e: unknown) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [businessId]);

  const filtered = useMemo(() => {
    const since = periodToSince(period);
    if (!since) return bookings;
    return bookings.filter((b) => new Date(b.startTime) >= since);
  }, [bookings, period]);

  // --- Derived reports ---
  const bookingsByStatus = useMemo(() => {
    const map: Record<string, number> = { PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0, NO_SHOW: 0 };
    for (const b of filtered) map[b.status] = (map[b.status] ?? 0) + 1;
    return map;
  }, [filtered]);

  const topServices = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();
    for (const b of filtered) {
      const name = b.service?.name ?? "Unknown service";
      const key = b.serviceId;
      const entry = map.get(key) ?? { name, count: 0, revenue: 0 };
      entry.count += 1;
      // Revenue only from COMPLETED for honesty — don't count revenue on pending/cancelled
      if (b.status === "COMPLETED" && b.service?.price) entry.revenue += b.service.price;
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filtered]);

  const revenueByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of filtered) {
      if (b.status !== "COMPLETED") continue;
      const day = new Date(b.startTime).toISOString().slice(0, 10);
      map.set(day, (map.get(day) ?? 0) + (b.service?.price ?? 0));
    }
    const sorted = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    return sorted.slice(-14); // last 14 days with revenue
  }, [filtered]);

  const teamPerf = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();
    // Seed with known staff for zero rows
    for (const s of staffList) map.set(s.id, { name: s.name, count: 0, revenue: 0 });
    // Add unassigned bucket
    const UNASSIGNED = "__unassigned__";
    for (const b of filtered) {
      const key = b.staffMemberId ?? UNASSIGNED;
      const name = b.staffMember?.name ?? (key === UNASSIGNED ? "Unassigned" : "Unknown");
      const entry = map.get(key) ?? { name, count: 0, revenue: 0 };
      entry.count += 1;
      if (b.status === "COMPLETED" && b.service?.price) entry.revenue += b.service.price;
      map.set(key, entry);
    }
    // Ensure unassigned shows if exists, otherwise filter zeros? Keep staff zeros for visibility, drop unassigned if zero
    const arr = Array.from(map.entries()).map(([, v]) => v);
    return arr.filter((r) => r.count > 0 || staffList.some((s) => s.name === r.name)).sort((a, b) => b.count - a.count);
  }, [filtered, staffList]);

  const maxTopServicesCount = Math.max(1, ...topServices.map((t) => t.count));
  const maxRevenue = Math.max(1, ...revenueByDay.map(([, v]) => v));
  const maxTeamCount = Math.max(1, ...teamPerf.map((t) => t.count));

  // --- Retention (STARTER — pure booking counts) ---
  const retention = useMemo(() => {
    const perCustomer = new Map<string, number>();
    for (const b of filtered) {
      if (b.status === "CANCELLED") continue;
      perCustomer.set(b.customerId, (perCustomer.get(b.customerId) ?? 0) + 1);
    }
    let first = 0;
    let repeat = 0;
    for (const n of perCustomer.values()) {
      if (n <= 1) first += 1;
      else repeat += 1;
    }
    return { first, repeat, total: first + repeat };
  }, [filtered]);

  // --- Online presence checklist (PREMIUM — completeness signals) ---
  const presence = useMemo(() => {
    const items = [
      { label: "Logo uploaded", done: !!profile?.logoUrl },
      { label: "Description written", done: !!(profile?.description && profile.description.trim().length > 0) },
      { label: "Address set", done: !!(profile?.address && profile.address.trim().length > 0) },
      { label: "Opening hours set", done: !!profile?.openingHours },
      { label: "At least 1 bookable service", done: serviceCount > 0 },
      { label: "At least 1 team member", done: staffList.length > 0 },
      { label: "At least 1 review logged", done: reviewCount > 0 },
    ];
    const done = items.filter((i) => i.done).length;
    return { items, done, total: items.length };
  }, [profile, serviceCount, staffList, reviewCount]);

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-[#8A8377]"><Loader2 className="h-4 w-4 animate-spin" /> Loading reports...</div>;
  }
  if (error) {
    return <div className="flex items-center gap-2 text-sm text-red-600"><AlertCircle className="h-4 w-4" /> {error}</div>;
  }

  const periodLabel = period === "7d" ? "Last 7 days" : period === "30d" ? "Last 30 days" : "All time";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#9A7B4F" }}>Reports</p>
          <h1 className="font-[family-name:var(--font-display)] mt-1 text-3xl font-medium tracking-tight text-[#1F1B17]">All reports</h1>
          <p className="text-sm text-[#8A8377] mt-1.5">Real data from your bookings, services, and team. Locked reports show why they are not available yet.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white border border-[#E9E1D3] p-1 shadow-[0_2px_12px_rgba(30,28,26,0.04)]">
          {(["7d", "30d", "all"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${period === p ? "bg-[#1F1B17] text-white" : "text-[#8A8377] hover:text-[#1F1E1D]"}`}
            >
              {p === "7d" ? "7 days" : p === "30d" ? "30 days" : "All time"}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-[#8A8377] mt-2">Period: {periodLabel} · {filtered.length} bookings in range · Prices in LKR</p>

      {/* Catalog grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORTS.map((r) => {
          const needsGate = "gate" in r && r.gate;
          const card = (
          <div
            key={r.id}
            className="rounded-2xl border p-4 flex flex-col border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-[#1F1B17] text-white">
                {r.id === "bookings-summary" && <CalendarDays className="h-4 w-4" />}
                {r.id === "services-summary" && <BarChart3 className="h-4 w-4" />}
                {(r.id === "revenue-summary" || r.id === "client-retention") && <TrendingUp className="h-4 w-4" />}
                {r.id === "team-performance" && <Users className="h-4 w-4" />}
                {r.id === "online-presence" && <Lock className="h-4 w-4" />}
              </div>
              {needsGate ? (
                <span className="rounded-full bg-[#795831]/15 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-[#1F1E1D]">
                  {r.gate === "basicAnalytics" ? "Pro" : "Premium"}
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-medium text-emerald-700">Available</span>
              )}
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[#1F1E1D]">{r.title}</h3>
            <p className="mt-1 text-xs text-[#8A8377] flex-1">{r.description}</p>
          </div>
          );
          if (needsGate) {
            return (
              <PlanGate key={r.id} feature={r.gate}>
                {card}
              </PlanGate>
            );
          }
          return (
            <span key={r.id} className="contents">
              {card}
            </span>
          );
        })}
      </div>

      {/* Detailed reports - only for available ones */}
      <div className="mt-8 space-y-6">
        {/* Bookings summary */}
        <div className="rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)] p-5">
          <h2 className="text-sm font-semibold text-[#1F1E1D] flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#8A8377]" /> Bookings summary</h2>
          <p className="text-xs text-[#8A8377] mt-1">Bookings by status for {periodLabel.toLowerCase()}.</p>
          {filtered.length === 0 ? (
            <p className="mt-4 text-sm text-[#8A8377]">No bookings in this period yet. New appointments will appear here automatically.</p>
          ) : (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(["CONFIRMED", "COMPLETED", "PENDING", "CANCELLED", "NO_SHOW"] as const).map((s) => (
                <div key={s} className="rounded-lg bg-[#FAF7F2] border border-[#E9E1D3] p-3 text-center">
                  <p className="text-xs uppercase tracking-wide text-[#8A8377]">{s.replace("_", " ")}</p>
                  <p className="text-xl font-semibold text-[#1F1E1D] mt-1">{bookingsByStatus[s] ?? 0}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top services */}
        <div className="rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)] p-5">
          <h2 className="text-sm font-semibold text-[#1F1E1D] flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#8A8377]" /> Top services</h2>
          <p className="text-xs text-[#8A8377] mt-1">Most booked services for the selected period.</p>
          {topServices.length === 0 ? (
            <p className="mt-4 text-sm text-[#8A8377]">No bookings yet to rank services.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {topServices.map((t) => (
                <div key={t.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#1F1E1D] truncate">{t.name}</span>
                    <span className="text-[#8A8377] text-xs">{t.count} bookings · {(t.revenue / 100).toLocaleString("en-LK", { style: "currency", currency: "LKR" })} completed revenue</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F3EEE4] overflow-hidden">
                    <div className="h-full bg-[#1F1B17] rounded-full" style={{ width: `${(t.count / maxTopServicesCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue summary — PROFESSIONAL and up */}
        <PlanGate feature="basicAnalytics">
        <div className="rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)] p-5">
          <h2 className="text-sm font-semibold text-[#1F1E1D] flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[#8A8377]" /> Revenue summary</h2>
          <p className="text-xs text-[#8A8377] mt-1">Completed-booking revenue by day.</p>
          {revenueByDay.length === 0 ? (
            <p className="mt-4 text-sm text-[#8A8377]">No completed bookings in this period, so there is no revenue to chart yet. Confirm or complete bookings to see revenue here.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {revenueByDay.map(([day, amount]) => (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-xs text-[#8A8377] w-24 shrink-0">{day}</span>
                  <div className="flex-1 h-6 rounded bg-[#F3EEE4] overflow-hidden relative">
                    <div className="h-full bg-emerald-500 rounded" style={{ width: `${(amount / maxRevenue) * 100}%` }} />
                  </div>
                  <span className="text-xs text-[#1F1E1D] w-28 text-right">{(amount / 100).toLocaleString("en-LK", { style: "currency", currency: "LKR" })}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-[#E9E1D3] flex items-center justify-between text-sm">
                <span className="text-[#8A8377]">Total completed revenue</span>
                <span className="font-semibold text-[#1F1E1D]">
                  {(revenueByDay.reduce((a, [, v]) => a + v, 0) / 100).toLocaleString("en-LK", { style: "currency", currency: "LKR" })}
                </span>
              </div>
            </div>
          )}
        </div>
        </PlanGate>

        {/* Team performance — PROFESSIONAL and up */}
        <PlanGate feature="basicAnalytics">
        <div className="rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)] p-5">
          <h2 className="text-sm font-semibold text-[#1F1E1D] flex items-center gap-2"><Users className="h-4 w-4 text-[#8A8377]" /> Team performance</h2>
          <p className="text-xs text-[#8A8377] mt-1">Bookings and revenue by team member for the selected period.</p>
          {teamPerf.length === 0 ? (
            <p className="mt-4 text-sm text-[#8A8377]">No bookings to attribute yet. Add team members in Team and assign them to bookings to see performance here.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-[#8A8377] border-b border-[#E9E1D3]">
                    <th className="text-left py-2 font-medium">Team member</th>
                    <th className="text-right py-2 font-medium">Bookings</th>
                    <th className="text-right py-2 font-medium">Revenue (completed)</th>
                    <th className="text-left py-2 font-medium pl-4">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {teamPerf.map((t) => (
                    <tr key={t.name} className="border-b border-[#F0EAE0] last:border-0">
                      <td className="py-3 text-[#1F1E1D]">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-7 w-7 rounded-full bg-[#F3EEE4] flex items-center justify-center text-xs text-[#1F1E1D]">{t.name.slice(0, 2).toUpperCase()}</span>
                          {t.name}
                        </span>
                      </td>
                      <td className="py-3 text-right text-[#1F1E1D]">{t.count}</td>
                      <td className="py-3 text-right text-[#1F1E1D]">{(t.revenue / 100).toLocaleString("en-LK", { style: "currency", currency: "LKR" })}</td>
                      <td className="py-3 pl-4 w-40">
                        <div className="h-2 rounded-full bg-[#F3EEE4] overflow-hidden">
                          <div className="h-full bg-[#9A7B4F] rounded-full" style={{ width: `${(t.count / maxTeamCount) * 100}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </PlanGate>

        {/* Client retention — STARTER (booking counts only) */}
        <div className="rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)] p-5">
          <h2 className="text-sm font-semibold text-[#1F1E1D] flex items-center gap-2"><TrendingUp className="h-4 w-4 text-[#8A8377]" /> Client retention</h2>
          <p className="text-xs text-[#8A8377] mt-1">Repeat vs first-time clients for {periodLabel.toLowerCase()} (cancelled bookings excluded).</p>
          {retention.total === 0 ? (
            <p className="mt-4 text-sm text-[#8A8377]">No bookings in this period yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {[
                { label: "Repeat clients", count: retention.repeat },
                { label: "First-time clients", count: retention.first },
              ].map((row) => (
                <div key={row.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#1F1E1D]">{row.label}</span>
                    <span className="text-[#8A8377] text-xs">{row.count} ({Math.round((row.count / Math.max(1, retention.total)) * 100)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F3EEE4] overflow-hidden">
                    <div className="h-full bg-[#1F1B17] rounded-full" style={{ width: `${(row.count / Math.max(1, retention.total)) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Online presence — PREMIUM advanced analytics */}
        <PlanGate feature="advancedAnalytics">
        <div className="rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)] p-5">
          <h2 className="text-sm font-semibold text-[#1F1E1D] flex items-center gap-2"><Lock className="h-4 w-4 text-[#8A8377]" /> Online presence</h2>
          <p className="text-xs text-[#8A8377] mt-1">Profile completeness signals that drive marketplace discovery. {presence.done} of {presence.total} complete.</p>
          <div className="mt-2 h-2 rounded-full bg-[#F3EEE4] overflow-hidden">
            <div className="h-full bg-[#9A7B4F] rounded-full" style={{ width: `${(presence.done / Math.max(1, presence.total)) * 100}%` }} />
          </div>
          <ul className="mt-4 space-y-2">
            {presence.items.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-sm">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${item.done ? "bg-emerald-100 text-emerald-700" : "bg-[#F3EEE4] text-[#8A8377]"}`}>
                  {item.done ? "✓" : "·"}
                </span>
                <span className={item.done ? "text-[#1F1E1D]" : "text-[#8A8377]"}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
        </PlanGate>

        {bookings.length >= 100 && (
          <p className="text-xs text-[#8A8377] text-center">Showing first 100 bookings. Reports are sampled if you have more than 100 bookings. For full accuracy at scale, a paginated reports API will be added later.</p>
        )}
      </div>
    </div>
  );
}
