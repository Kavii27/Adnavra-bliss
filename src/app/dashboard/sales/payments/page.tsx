"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Store, Wallet } from "lucide-react";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId, lkr } from "@/components/dashboard/use-business";

type LedgerRow = {
  id: string;
  label: string;
  amount: number;
  status: string;
  occurredAt: string;
  customer: { name: string } | null;
};

type CompletedBooking = {
  id: string;
  startTime: string;
  customer: { name: string };
  service: { name: string; price: number };
};

type PaymentRow = {
  id: string;
  label: string;
  customer: string;
  amount: number;
  date: string;
  source: "Ledger" | "Booking";
  status: string;
};

export default function PaymentsPage() {
  return (
    <PlanGate feature="onlinePayments">
      <PaymentsInner />
    </PlanGate>
  );
}

function PaymentsInner() {
  const { businessId, loading: bizLoading, error: bizError, isNoBusiness } = useBusinessId();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gatewayOn, setGatewayOn] = useState(false);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const [lR, bR, sR] = await Promise.all([
        fetch(`/api/sale-records?businessId=${businessId}&limit=100`).then((r) => r.json().then((j) => ({ ok: r.ok, j }))).catch(() => ({ ok: false, j: {} })),
        fetch(`/api/bookings?limit=100&page=1&status=COMPLETED`).then((r) => r.json().then((j) => ({ ok: r.ok, j }))).catch(() => ({ ok: false, j: {} })),
        fetch(`/api/business-settings?businessId=${businessId}&key=payments`).then((r) => r.json().then((j) => ({ ok: r.ok, j }))).catch(() => ({ ok: false, j: {} })),
      ]);
      const list: PaymentRow[] = [];
      // Ledger rows are the source of truth when detailedSales is available;
      // a 403 here just means the viewer's tier hides the ledger, not payments.
      if (lR.ok && Array.isArray(lR.j.data)) {
        for (const r of lR.j.data as LedgerRow[]) {
          if (r.status !== "COMPLETED") continue;
          list.push({ id: `ledger-${r.id}`, label: r.label, customer: r.customer?.name ?? "—", amount: r.amount, date: r.occurredAt, source: "Ledger", status: r.status });
        }
      }
      if (bR.ok && Array.isArray(bR.j.data)) {
        for (const b of bR.j.data as CompletedBooking[]) {
          list.push({ id: `booking-${b.id}`, label: b.service?.name ?? "Service", customer: b.customer?.name ?? "—", amount: b.service?.price ?? 0, date: b.startTime, source: "Booking", status: "COMPLETED" });
        }
      }
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRows(list);
      const payRow = Array.isArray(sR.j.data) ? sR.j.data[0] : null;
      const val = (payRow?.value ?? {}) as Record<string, unknown>;
      setGatewayOn(val.provider === "payhere" || val.provider === "stripe" || val.manualCollection === true);
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

  const total = useMemo(() => rows.reduce((s, r) => s + r.amount, 0), [rows]);

  if (bizLoading || (loading && businessId)) {
    return <div className="flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading payments...</div>;
  }
  if (isNoBusiness || bizError) {
    return (
      <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe3] border border-[#e6dcc8]">
          <Store className="h-5 w-5 text-[#a89880]" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#3a2f22]">Set up your salon to see payments</h3>
        <p className="mt-1 text-sm text-[#a89880]">{bizError ?? "Create your business profile first."}</p>
        <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#faf6ef] hover:bg-white/90">Go to Settings</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#3a2f22]">Payments</h1>
          <p className="text-sm text-[#a89880] mt-1">Every completed transaction: ledger entries plus completed-booking revenue.</p>
        </div>
        <Link href="/dashboard/settings/payments" className="rounded-lg border border-[#e6dcc8] bg-[#f6efe3] px-3 py-1.5 text-xs font-medium text-[#3a2f22] hover:bg-[#f3ebdd]">
          Payment settings
        </Link>
      </div>

      {!gatewayOn && (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-4 text-sm text-[#a89880]">
          No payment provider connected yet — amounts below are recorded revenue.{" "}
          <Link href="/dashboard/settings/payments" className="font-medium text-[#3a2f22] underline">Connect one in Settings → Payments</Link>.
        </div>
      )}

      <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-4">
        <p className="text-xs uppercase tracking-wide text-[#a89880]">Collected total</p>
        <p className="mt-1 text-xl font-semibold text-[#3a2f22]">{lkr(total)}</p>
        <p className="mt-1 text-xs text-[#a89880]">{rows.length} transaction(s)</p>
      </div>

      {error ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {error}</div>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center">
          <Wallet className="h-6 w-6 text-[#a89880] mx-auto" />
          <p className="mt-2 text-sm text-[#a89880]">No payments yet. Complete a booking or record a sale and it will appear here.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-[#e6dcc8] bg-white/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[#a89880] border-b border-[#e6dcc8] bg-white/[0.02]">
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-[#3a2f22]">{r.label}</td>
                    <td className="px-4 py-3 text-[#a89880]">{r.customer}</td>
                    <td className="px-4 py-3 text-[#a89880] text-xs">{r.source}</td>
                    <td className="px-4 py-3 text-[#a89880] text-xs">{new Date(r.date).toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-3 text-right text-[#3a2f22]">{lkr(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
