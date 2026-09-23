"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2 } from "lucide-react";

type Status = "ACTIVE" | "SUSPENDED" | "CANCELLED";
const STATUSES: Status[] = ["ACTIVE", "SUSPENDED", "CANCELLED"];

type Props = {
  businessId: string;
  plans: { key: string; name: string }[];
  initialPlanKey: string;
  initialStatus: Status;
  initialStartDate: string; // "YYYY-MM-DD" or ""
  initialEndDate: string; // "YYYY-MM-DD" or ""
  hasSubscription: boolean;
};

const inputClass =
  "h-9 rounded-md border border-[#E3E8F0] bg-white px-2 text-sm font-medium text-[#3a2f22] disabled:opacity-50";

export function SalonSubscriptionRow({
  businessId,
  plans,
  initialPlanKey,
  initialStatus,
  initialStartDate,
  initialEndDate,
  hasSubscription,
}: Props) {
  const router = useRouter();
  const [planKey, setPlanKey] = useState(initialPlanKey);
  const [status, setStatus] = useState<Status>(initialStatus);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty =
    planKey !== initialPlanKey || status !== initialStatus || startDate !== initialStartDate || endDate !== initialEndDate;

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/business-subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey,
          status,
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          endDate: endDate ? new Date(endDate).toISOString() : null,
        }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Failed to update subscription");
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update subscription");
    } finally {
      setSaving(false);
    }
  }

  if (plans.length === 0) {
    return <p className="text-xs text-[#a89880]">No active plans to assign — create one first.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Plan"
          value={planKey}
          disabled={saving}
          onChange={(e) => {
            setPlanKey(e.target.value);
            setSaved(false);
          }}
          className={inputClass}
        >
          {plans.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Status"
          value={status}
          disabled={saving}
          onChange={(e) => {
            setStatus(e.target.value as Status);
            setSaved(false);
          }}
          className={inputClass}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <input
          type="date"
          aria-label="Start date"
          value={startDate}
          disabled={saving}
          onChange={(e) => {
            setStartDate(e.target.value);
            setSaved(false);
          }}
          className={inputClass}
        />
        <input
          type="date"
          aria-label="End date"
          value={endDate}
          disabled={saving}
          onChange={(e) => {
            setEndDate(e.target.value);
            setSaved(false);
          }}
          className={inputClass}
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[linear-gradient(135deg,#3a2f22_0%,#8a6d4f_100%)] px-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && !dirty && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#15803D]">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
      </div>
      {!hasSubscription && <p className="text-xs text-[#a89880]">No subscription row yet — saving creates one.</p>}
      {error && (
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B91C1C]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
