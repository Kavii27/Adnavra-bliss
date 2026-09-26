"use client";

import { useState } from "react";
import type { SubscriptionPlan } from "@prisma/client";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { getPlanVisual } from "@/lib/plan-visuals";
import { ToggleSwitch } from "@/components/admin/toggle-switch";

type EditableFields = {
  name: string;
  description: string;
  isActive: boolean;
  rank: number;
  priceMonthly: string; // kept as string for the input, parsed on save
  boostsPerWeek: number;
  maxBoostHours: number;
  galleryLimit: string;
  serviceLimit: string;
  searchWeight: number;
  isFeaturedEligible: boolean;
  isPriorityEligible: boolean;
};

function toFields(plan: SubscriptionPlan): EditableFields {
  return {
    name: plan.name,
    description: plan.description ?? "",
    isActive: plan.isActive,
    rank: plan.rank,
    priceMonthly: plan.priceMonthly?.toString() ?? "",
    boostsPerWeek: plan.boostsPerWeek,
    maxBoostHours: plan.maxBoostHours,
    galleryLimit: plan.galleryLimit?.toString() ?? "",
    serviceLimit: plan.serviceLimit?.toString() ?? "",
    searchWeight: plan.searchWeight,
    isFeaturedEligible: plan.isFeaturedEligible,
    isPriorityEligible: plan.isPriorityEligible,
  };
}

export function SubscriptionPlanCard({ plan }: { plan: SubscriptionPlan }) {
  const visual = getPlanVisual(plan.rank);
  const Icon = visual.icon;
  const [initial, setInitial] = useState(() => toFields(plan));
  const [fields, setFields] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty = JSON.stringify(fields) !== JSON.stringify(initial);

  const inputClass = visual.isDark
    ? "h-9 w-full rounded-lg border border-white/20 bg-white/10 px-2.5 text-sm text-[#faf6ef] placeholder:text-[#faf6ef]/40 outline-none focus:border-[#c9a26d] disabled:opacity-50"
    : "h-9 w-full rounded-lg border border-[#E3E8F0] bg-[#faf6ef] px-2.5 text-sm text-[#3a2f22] outline-none focus:border-[#c9a26d] disabled:opacity-50";
  const labelClass = `text-[11px] font-semibold uppercase tracking-wide ${visual.isDark ? "text-[#f5ead9]/60" : "text-[#a89880]"}`;

  function update<K extends keyof EditableFields>(key: K, value: EditableFields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/subscription-plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fields.name,
          description: fields.description || undefined,
          isActive: fields.isActive,
          rank: fields.rank,
          priceMonthly: fields.priceMonthly === "" ? undefined : Number(fields.priceMonthly),
          boostsPerWeek: fields.boostsPerWeek,
          maxBoostHours: fields.maxBoostHours,
          galleryLimit: fields.galleryLimit === "" ? undefined : Number(fields.galleryLimit),
          serviceLimit: fields.serviceLimit === "" ? undefined : Number(fields.serviceLimit),
          searchWeight: fields.searchWeight,
          isFeaturedEligible: fields.isFeaturedEligible,
          isPriorityEligible: fields.isPriorityEligible,
        }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Failed to save plan");
      setInitial(fields);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save plan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`relative flex flex-col rounded-2xl border p-6 transition ${visual.cardClass}`}>
      {!fields.isActive && (
        <span className="absolute right-4 top-4 z-10 rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-current opacity-70">
          Disabled
        </span>
      )}

      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            visual.isDark ? "bg-white/10" : "bg-[#EAF3F2]"
          }`}
        >
          <Icon className={`h-5 w-5 ${visual.isDark ? "text-[#c9a26d]" : "text-[#8a6d4f]"}`} />
        </span>
        <div className={`min-w-0 ${!fields.isActive ? "pr-16" : ""}`}>
          <p className={`truncate text-lg font-semibold leading-tight tracking-tight ${visual.headingClass}`}>{fields.name}</p>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${visual.badgeClass}`}>
            {visual.label}
          </span>
        </div>
      </div>

      <p className={`mt-3 text-xs leading-relaxed ${visual.isDark ? "text-[#f5ead9]/60" : "text-[#a89880]"}`}>
        key: {plan.key}
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        <label className="col-span-2 space-y-1">
          <span className={labelClass}>Name</span>
          <input className={inputClass} value={fields.name} disabled={saving} onChange={(e) => update("name", e.target.value)} />
        </label>
        <label className="col-span-2 space-y-1">
          <span className={labelClass}>Description</span>
          <textarea
            className={inputClass + " h-16 resize-none py-1.5"}
            value={fields.description}
            disabled={saving}
            onChange={(e) => update("description", e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Rank</span>
          <input
            type="number"
            className={inputClass}
            value={fields.rank}
            disabled={saving}
            onChange={(e) => update("rank", Number(e.target.value))}
          />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Price/mo (LKR cents)</span>
          <input
            type="number"
            className={inputClass}
            value={fields.priceMonthly}
            disabled={saving}
            placeholder="-"
            onChange={(e) => update("priceMonthly", e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Boosts / week</span>
          <input
            type="number"
            className={inputClass}
            value={fields.boostsPerWeek}
            disabled={saving}
            onChange={(e) => update("boostsPerWeek", Number(e.target.value))}
          />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Boost hours</span>
          <input
            type="number"
            className={inputClass}
            value={fields.maxBoostHours}
            disabled={saving}
            onChange={(e) => update("maxBoostHours", Number(e.target.value))}
          />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Gallery limit</span>
          <input
            type="number"
            className={inputClass}
            value={fields.galleryLimit}
            disabled={saving}
            placeholder="Unlimited"
            onChange={(e) => update("galleryLimit", e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span className={labelClass}>Service limit</span>
          <input
            type="number"
            className={inputClass}
            value={fields.serviceLimit}
            disabled={saving}
            placeholder="Unlimited"
            onChange={(e) => update("serviceLimit", e.target.value)}
          />
        </label>
        <label className="col-span-2 space-y-1">
          <span className={labelClass}>Search weight (ranking multiplier)</span>
          <input
            type="number"
            step="0.1"
            className={inputClass}
            value={fields.searchWeight}
            disabled={saving}
            onChange={(e) => update("searchWeight", Number(e.target.value))}
          />
        </label>
      </div>

      <div className={`mt-5 grid grid-cols-1 gap-3 rounded-xl px-4 py-4 min-[480px]:grid-cols-3 ${visual.isDark ? "bg-white/5" : "bg-[#faf6ef]"}`}>
        <div className="flex items-center justify-between min-[480px]:flex-col min-[480px]:items-start min-[480px]:gap-2">
          <ToggleSwitch label="Active" checked={fields.isActive} disabled={saving} dark={visual.isDark} onChange={(v) => update("isActive", v)} />
        </div>
        <div className="flex items-center justify-between min-[480px]:flex-col min-[480px]:items-start min-[480px]:gap-2">
          <ToggleSwitch
            label="Featured-eligible"
            checked={fields.isFeaturedEligible}
            disabled={saving}
            dark={visual.isDark}
            onChange={(v) => update("isFeaturedEligible", v)}
          />
        </div>
        <div className="flex items-center justify-between min-[480px]:flex-col min-[480px]:items-start min-[480px]:gap-2">
          <ToggleSwitch
            label="Priority-eligible"
            checked={fields.isPriorityEligible}
            disabled={saving}
            dark={visual.isDark}
            onChange={(v) => update("isPriorityEligible", v)}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className={`inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition disabled:opacity-40 ${
            visual.isDark
              ? "bg-[#c9a26d] text-[#3a2f22] hover:bg-[#d9b483]"
              : "bg-[linear-gradient(135deg,#3a2f22_0%,#8a6d4f_100%)] text-white hover:opacity-90"
          }`}
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && !dirty && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#15803D]">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
      </div>
      {error && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#B91C1C]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
