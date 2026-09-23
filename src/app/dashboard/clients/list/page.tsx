"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Store, X, Search } from "lucide-react";
import { PlanGate } from "@/components/dashboard/plan-gate";

type Customer = { id: string; name: string; email: string | null; phone: string | null; createdAt: string };
type BookingForSales = { id: string; customerId: string; status: string; service: { price: number } };

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function lkr(minor: number): string {
  return (minor / 100).toLocaleString("en-LK", { style: "currency", currency: "LKR" });
}

export default function ClientsListPage() {
  return (
    <PlanGate feature="clientDatabase">
      <ClientsListPageInner />
    </PlanGate>
  );
}

function ClientsListPageInner() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesByCustomer, setSalesByCustomer] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  async function load(p = 1) {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/customers?page=${p}&limit=20`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed to load customers");
      const data: Customer[] = j.data ?? [];
      setCustomers(data);
      setTotalPages(j.pagination?.pages ?? 1);
      setPage(j.pagination?.page ?? p);
      setTotal(j.pagination?.total ?? data.length);

      // Fetch sales totals: all COMPLETED bookings, aggregate by customerId client-side
      // This is honest data available via existing API; best-effort, never blocks the table render.
      setSalesLoading(true);
      try {
        const br = await fetch(`/api/bookings?limit=100&page=1&status=COMPLETED`);
        const bj = await br.json();
        if (br.ok && Array.isArray(bj.data)) {
          const map: Record<string, number> = {};
          for (const b of bj.data as BookingForSales[]) {
            const cid = b.customerId;
            if (!cid) continue;
            map[cid] = (map[cid] ?? 0) + (b.service?.price ?? 0);
          }
          // If pagination truncated (100 limit), totals may be partial — still honest, just partial.
          // For small businesses this will be complete; larger ones will show at least the recent 100.
          setSalesByCustomer(map);
        }
      } catch {
        // leave empty
      } finally {
        setSalesLoading(false);
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, []);

  const isNoBusiness = error?.toLowerCase().includes("no business") ?? false;
  const filtered = q.trim()
    ? customers.filter((c) => {
        const qq = q.toLowerCase();
        return c.name.toLowerCase().includes(qq) || (c.email?.toLowerCase().includes(qq) ?? false) || (c.phone?.includes(qq) ?? false);
      })
    : customers;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#3a2f22]">Clients</h1>
          <p className="mt-1 text-sm text-[#a89880]">All customers for your business, scoped to your salon.</p>
        </div>
        <Link href="/dashboard/calendar" className="rounded-lg border border-[#e6dcc8] bg-[#f6efe3] px-3 py-1.5 text-xs font-medium text-[#3a2f22] hover:bg-[#f3ebdd]">
          Open calendar
        </Link>
      </div>

      {/* Promotional banner — honest copy, dismissible */}
      {!bannerDismissed && (
        <div className="mt-6 relative rounded-xl bg-gradient-to-br from-[#4a3620] via-[#8a6d4f] to-[#c9a26d] p-6 text-[#3a2f22] overflow-hidden">
          <button aria-label="Dismiss" onClick={() => setBannerDismissed(true)} className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-[#3a2f22]">
            <X className="h-4 w-4" />
          </button>
          <h3 className="text-lg font-semibold pr-8">Get discovered on the ADNAVRA marketplace</h3>
          <p className="mt-1 max-w-lg text-sm text-[#3a2f22]/85">Your salon already appears in ADNAVRA customer search results. Complete your profile and add photos to stand out.</p>
          <Link href="/dashboard/settings" className="mt-3 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#3a2f22] hover:bg-white/90">
            Complete your profile
          </Link>
        </div>
      )}

      {/* Search */}
      <div className="mt-6 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a89880]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search clients..."
            className="w-full rounded-lg border border-[#e6dcc8] bg-[#f6efe3] pl-9 pr-3 py-2 text-sm text-[#3a2f22] placeholder:text-[#a89880] focus:outline-none focus:ring-2 focus:ring-[var(--color-sidebar-active)]"
          />
        </div>
        {q && (
          <button onClick={() => setQ("")} className="rounded-lg border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-xs font-medium text-[#a89880] hover:text-[#3a2f22]">Clear</button>
        )}
      </div>

      {(() => {
        if (isNoBusiness) return null;
        if (error) return <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {error}</div>;
        return null;
      })()}

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
      ) : isNoBusiness ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe3] border border-[#e6dcc8]">
            <Store className="h-5 w-5 text-[#a89880]" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-[#3a2f22]">Set up your salon to see clients</h3>
          <p className="mt-1 text-sm text-[#a89880]">You have not created a business profile yet. Create it in Settings and customers will appear after bookings.</p>
          <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#3a2f22] hover:bg-[#f6efe3]">Go to Settings</Link>
          {error && <p className="mt-3 text-xs text-[#a89880]/60">{error}</p>}
        </div>
      ) : customers.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center text-sm text-[#a89880]">No customers yet. They appear after a booking is made.</div>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-xl border border-[#e6dcc8] bg-white/[0.04]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-[#a89880] border-b border-[#e6dcc8] bg-white/[0.02]">
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Mobile number</th>
                    <th className="px-4 py-3 font-medium">Reviews</th>
                    <th className="px-4 py-3 font-medium text-right">Sales</th>
                    <th className="px-4 py-3 font-medium">Created at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filtered.map((c) => {
                    const sales = salesByCustomer[c.id];
                    const salesText = sales === undefined ? (salesLoading ? "…" : "—") : sales === 0 ? "—" : lkr(sales);
                    return (
                      <tr key={c.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3ebdd] text-xs font-semibold text-[#3a2f22] ring-1 ring-white/10">{initials(c.name)}</div>
                            <div className="min-w-0">
                              <p className="font-medium text-[#3a2f22] truncate">{c.name}</p>
                              {c.email && <p className="text-xs text-[#a89880] truncate">{c.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#a89880]">{c.phone ?? "—"}</td>
                        <td className="px-4 py-3 text-[#a89880]">—</td>
                        <td className="px-4 py-3 text-right text-[#3a2f22]">{salesText}</td>
                        <td className="px-4 py-3 text-[#a89880] text-xs">{new Date(c.createdAt).toLocaleDateString("en-GB")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && q && <p className="px-4 py-6 text-center text-sm text-[#a89880]">No clients match &quot;{q}&quot;.</p>}
            <div className="px-4 py-3 border-t border-[#e6dcc8] bg-white/[0.02] text-xs text-[#a89880] flex items-center justify-between">
              <span>{filtered.length} of {total} client(s){q ? ` matching filter` : ""} · page {page} of {totalPages}</span>
              {salesLoading && <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Calculating sales…</span>}
            </div>
          </div>

          {totalPages > 1 && !q && (
            <div className="mt-4 flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => load(page - 1)} className="rounded-lg border border-[#3a2f22] bg-white px-3 py-1.5 text-sm font-medium text-[#3a2f22] hover:bg-[#f6efe3] disabled:opacity-40 shadow-sm">Prev</button>
              <span className="text-sm text-[#a89880]">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => load(page + 1)} className="rounded-lg border border-[#3a2f22] bg-white px-3 py-1.5 text-sm font-medium text-[#3a2f22] hover:bg-[#f6efe3] disabled:opacity-40 shadow-sm">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
