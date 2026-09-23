"use client";

import { useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";

type Plan = "STARTER" | "PROFESSIONAL" | "PREMIUM";
type Status = "ACTIVE" | "SUSPENDED" | "CANCELLED";

const PLANS: Plan[] = ["STARTER", "PROFESSIONAL", "PREMIUM"];
const STATUSES: Status[] = ["ACTIVE", "SUSPENDED", "CANCELLED"];

type Props = {
  businessId: string;
  initialPlan: Plan;
  initialStatus: Status;
  hasSubscriptionRow: boolean;
};

export function SubscriptionRow({ businessId, initialPlan, initialStatus, hasSubscriptionRow }: Props) {
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [status, setStatus] = useState<Status>(initialStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = plan !== initialPlan || status !== initialStatus;

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, status }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Failed to update subscription");
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update subscription");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`plan-${businessId}`}>
          Plan
        </label>
        <select
          id={`plan-${businessId}`}
          value={plan}
          onChange={(e) => {
            setPlan(e.target.value as Plan);
            setSaved(false);
          }}
          disabled={saving}
          className="h-9 rounded-md border border-[#E3E8F0] bg-white px-2 text-sm font-medium text-[#3a2f22] disabled:opacity-50"
        >
          {PLANS.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0) + p.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor={`status-${businessId}`}>
          Status
        </label>
        <select
          id={`status-${businessId}`}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as Status);
            setSaved(false);
          }}
          disabled={saving}
          className="h-9 rounded-md border border-[#E3E8F0] bg-white px-2 text-sm font-medium text-[#3a2f22] disabled:opacity-50"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#3a2f22] px-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
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
      {!hasSubscriptionRow && (
        <p className="text-xs text-[#a89880]">No subscription row yet — saving creates one.</p>
      )}
      {plan === "PREMIUM" && (
        <p className="text-xs text-[#a89880]">Premium enables the “Featured” marketplace badge automatically.</p>
      )}
      {error && (
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B91C1C]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
