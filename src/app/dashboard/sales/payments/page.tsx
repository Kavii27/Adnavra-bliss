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
          list.push({ id: `ledger-${r.id}`, label: r.label, customer: r.customer?.name ?? "-", amount: r.amount, date: r.occurredAt, source: "Ledger", status: r.status });
        }
      }
      if (bR.ok && Array.isArray(bR.j.data)) {
        for (const b of bR.j.data as CompletedBooking[]) {
          list.push({ id: `booking-${b.id}`, label: b.service?.name ?? "Service", customer: b.customer?.name ?? "-", amount: b.service?.price ?? 0, date: b.startTime, source: "Booking", status: "COMPLETED" });
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
    return <div className="flex items-center gap-2 text-sm text-[#8A8377]"><Loader2 className="h-4 w-4 animate-spin" /> Loading payments...</div>;
  }
  if (isNoBusiness || bizError) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E5DDD0] bg-white p-10 text-center">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "linear-gradient(135deg, #D9BE8C, #C9A467)" }}
        >
          <Store className="h-6 w-6 text-[#1B1714]" />
        </div>
        <h3 className="font-[family-name:var(--font-display)] mt-5 text-xl font-semibold text-[#1F1B17]">Set up your salon to see payments</h3>
        <p className="mt-1.5 text-sm text-[#8A8377]">{bizError ?? "Create your business profile first."}</p>
        <Link
          href="/dashboard/settings"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#1F1B17] px-7 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#795831]"
        >
          Go to Settings
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9A7B4F]">Sales</p>
          <h1 className="font-[family-name:var(--font-display)] mt-1 text-3xl font-medium tracking-tight text-[#1F1B17]">Payments</h1>
          <p className="text-sm text-[#8A8377] mt-1.5">Every completed transaction: ledger entries plus completed-booking revenue.</p>
        </div>
        <Link href="/dashboard/settings/payments" className="inline-flex items-center rounded-full border border-[#E5DDD0] bg-white px-4 py-2 text-sm font-medium text-[#4A4640] transition-colors hover:bg-[#FBF7EF] hover:text-[#1F1E1D]">
          Payment settings
        </Link>
      </div>

      {!gatewayOn && (
        <div className="mt-6 rounded-xl border border-[#E9E1D3] bg-[#FBF7EF] p-4 text-sm text-[#8A8377]">
          No payment provider connected yet. Amounts below are recorded revenue.{" "}
          <Link href="/dashboard/settings/payments" className="font-medium text-[#795831] underline">Connect one in Settings → Payments</Link>.
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-[#E9E1D3] bg-white p-4 shadow-[0_4px_20px_rgba(30,28,26,0.05)]">
        <p className="text-xs uppercase tracking-wide text-[#9A7B4F]">Collected total</p>
        <p className="mt-1 text-xl font-semibold text-[#1F1E1D]">{lkr(total)}</p>
        <p className="mt-1 text-xs text-[#8A8377]">{rows.length} transaction(s)</p>
      </div>

      {error ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#FDECEC] bg-[#FDECEC] px-4 py-3 text-sm text-[#B91C1C]"><AlertCircle className="h-4 w-4 shrink-0" /> {error}</div>
      ) : rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#E5DDD0] bg-white p-10 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, #D9BE8C, #C9A467)" }}
          >
            <Wallet className="h-6 w-6 text-[#1B1714]" />
          </div>
          <p className="mt-4 text-sm text-[#4A4640]">No payments yet. Complete a booking or record a sale and it will appear here.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[#8A8377] border-b border-[#E9E1D3] bg-[#FBF7EF]">
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EEE4]">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FBF7EF]/60">
                    <td className="px-4 py-3 font-medium text-[#1F1E1D]">{r.label}</td>
                    <td className="px-4 py-3 text-[#8A8377]">{r.customer}</td>
                    <td className="px-4 py-3 text-[#8A8377] text-xs">{r.source}</td>
                    <td className="px-4 py-3 text-[#8A8377] text-xs">{new Date(r.date).toLocaleDateString("en-GB")}</td>
                    <td className="px-4 py-3 text-right text-[#1F1E1D]">{lkr(r.amount)}</td>
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
