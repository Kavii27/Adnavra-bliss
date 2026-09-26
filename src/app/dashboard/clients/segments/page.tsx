"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Store, Users } from "lucide-react";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId, lkr } from "@/components/dashboard/use-business";

type Customer = { id: string; name: string; email: string | null; phone: string | null; createdAt: string };
type BookingRow = {
  id: string;
  customerId: string;
  status: string;
  startTime: string;
  service: { price: number };
};

type Segment = "New" | "Regular" | "Loyal" | "At risk" | "High spend";

type Row = {
  customer: Customer;
  visits: number;
  spend: number;
  lastVisit: string | null;
  segments: Segment[];
};

const SEGMENT_DEFS: { name: Segment; description: string }[] = [
  { name: "New", description: "First visit only. Welcome them back." },
  { name: "Regular", description: "2 to 5 visits. Your core repeat base." },
  { name: "Loyal", description: "6+ visits. Candidates for loyalty rewards." },
  { name: "At risk", description: "No visit in 60+ days. Win them back." },
  { name: "High spend", description: "Top 25% by completed spend." },
];

export default function SegmentsPage() {
  return (
    <PlanGate feature="clientSegments">
      <SegmentsInner />
    </PlanGate>
  );
}

function SegmentsInner() {
  const { businessId, loading: bizLoading, error: bizError, isNoBusiness } = useBusinessId();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Segment | "All">("All");

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const [cR, bR] = await Promise.all([
        fetch(`/api/customers?limit=200`),
        fetch(`/api/bookings?limit=200&page=1`),
      ]);
      const cJ = await cR.json();
      const bJ = await bR.json();
      if (!cR.ok) throw new Error(cJ.error ?? "Failed to load customers");
      const customers: Customer[] = cJ.data ?? [];
      const bookings: BookingRow[] = bR.ok && Array.isArray(bJ.data) ? bJ.data : [];

      const visitsBy = new Map<string, { count: number; last: string | null; spend: number }>();
      for (const b of bookings) {
        if (b.status === "CANCELLED") continue;
        const entry = visitsBy.get(b.customerId) ?? { count: 0, last: null, spend: 0 };
        entry.count += 1;
        if (!entry.last || b.startTime > entry.last) entry.last = b.startTime;
        if (b.status === "COMPLETED") entry.spend += b.service?.price ?? 0;
        visitsBy.set(b.customerId, entry);
      }

      const spends = customers.map((c) => visitsBy.get(c.id)?.spend ?? 0).sort((a, b) => a - b);
      const highSpendFloor = spends.length > 0 ? spends[Math.floor(spends.length * 0.75)] : Infinity;
      const now = Date.now();

      const computed: Row[] = customers.map((c) => {
        const v = visitsBy.get(c.id) ?? { count: 0, last: null, spend: 0 };
        const segments: Segment[] = [];
        if (v.count <= 1) segments.push("New");
        else if (v.count <= 5) segments.push("Regular");
        else segments.push("Loyal");
        if (v.last && now - new Date(v.last).getTime() > 60 * 86400000) segments.push("At risk");
        if (v.spend > 0 && v.spend >= highSpendFloor) segments.push("High spend");
        return { customer: c, visits: v.count, spend: v.spend, lastVisit: v.last, segments };
      });
      setRows(computed);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (businessId) load();
    else if (!bizLoading) setLoading(false);
  }, [businessId, bizLoading, load]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) for (const s of r.segments) map.set(s, (map.get(s) ?? 0) + 1);
    return map;
  }, [rows]);

  const filtered = useMemo(
    () => (active === "All" ? rows : rows.filter((r) => r.segments.includes(active))),
    [rows, active],
  );

  if (bizLoading || (loading && businessId)) {
    return <div className="flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading segments...</div>;
  }
  if (isNoBusiness || bizError) {
    return (
      <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe3] border border-[#e6dcc8]">
          <Store className="h-5 w-5 text-[#a89880]" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#3a2f22]">Set up your salon to segment clients</h3>
        <p className="mt-1 text-sm text-[#a89880]">{bizError ?? "Create your business profile first."}</p>
        <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#faf6ef] hover:bg-white/90">Go to Settings</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#3a2f22]">Client segments</h1>
          <p className="text-sm text-[#a89880] mt-1">Computed live from visit frequency, recency, and completed spend. No manual tagging needed.</p>
        </div>
        <button onClick={load} className="rounded-lg border border-[#e6dcc8] bg-[#f6efe3] px-3 py-1.5 text-xs font-medium text-[#3a2f22] hover:bg-[#f3ebdd]">Refresh</button>
      </div>

      {error ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {error}</div>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center">
          <Users className="h-6 w-6 text-[#a89880] mx-auto" />
          <p className="mt-2 text-sm text-[#a89880]">No clients yet. Segments appear automatically after bookings.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            <button
              onClick={() => setActive("All")}
              className={`rounded-xl border p-4 text-left ${active === "All" ? "border-[#8a6d4f] bg-[#8a6d4f] text-[#ffffff]" : "border-[#e6dcc8] bg-[#f6efe3] text-[#3a2f22] hover:bg-[#f3ebdd]"}`}
            >
              <p className="text-xl font-semibold">{rows.length}</p>
              <p className={`text-xs mt-0.5 ${active === "All" ? "text-white/80" : "text-[#a89880]"}`}>All clients</p>
            </button>
            {SEGMENT_DEFS.map((s) => (
              <button
                key={s.name}
                onClick={() => setActive(s.name)}
                title={s.description}
                className={`rounded-xl border p-4 text-left ${active === s.name ? "border-[#8a6d4f] bg-[#8a6d4f] text-[#ffffff]" : "border-[#e6dcc8] bg-[#f6efe3] text-[#3a2f22] hover:bg-[#f3ebdd]"}`}
              >
                <p className="text-xl font-semibold">{counts.get(s.name) ?? 0}</p>
                <p className={`text-xs mt-0.5 ${active === s.name ? "text-white/80" : "text-[#a89880]"}`}>{s.name}</p>
              </button>
            ))}
          </div>
          {active !== "All" && (
            <p className="mt-3 text-xs text-[#a89880]">{SEGMENT_DEFS.find((s) => s.name === active)?.description}</p>
          )}

          <div className="mt-6 overflow-hidden rounded-xl border border-[#e6dcc8] bg-white/[0.04]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-[#a89880] border-b border-[#e6dcc8] bg-white/[0.02]">
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Segments</th>
                    <th className="px-4 py-3 font-medium text-right">Visits</th>
                    <th className="px-4 py-3 font-medium text-right">Spend</th>
                    <th className="px-4 py-3 font-medium">Last visit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filtered.map((r) => (
                    <tr key={r.customer.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-medium text-[#3a2f22]">{r.customer.name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex flex-wrap gap-1">
                          {r.segments.map((s) => (
                            <span key={s} className="rounded-full bg-[#f3ebdd] px-2 py-0.5 text-xs text-[#3a2f22]">{s}</span>
                          ))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-[#3a2f22]">{r.visits}</td>
                      <td className="px-4 py-3 text-right text-[#3a2f22]">{r.spend > 0 ? lkr(r.spend) : "-"}</td>
                      <td className="px-4 py-3 text-[#a89880] text-xs">{r.lastVisit ? new Date(r.lastVisit).toLocaleDateString("en-GB") : "Never"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && <p className="px-4 py-6 text-center text-sm text-[#a89880]">No clients in this segment yet.</p>}
          </div>
        </>
      )}
    </div>
  );
}
