"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId } from "@/components/dashboard/use-business";

type FormField = {
  label: string;
  type: "text" | "textarea" | "select" | "checkbox";
  required: boolean;
  options: string;
};

const DEFAULTS = {
  fields: [] as FormField[],
  attachToBooking: true,
};

export default function FormsSettingsPage() {
  return (
    <PlanGate feature="intakeForms">
      <FormsSettingsInner />
    </PlanGate>
  );
}

function FormsSettingsInner() {
  const { businessId, loading: bizLoading, error: bizError } = useBusinessId();
  const [fields, setFields] = useState<FormField[]>(DEFAULTS.fields);
  const [attachToBooking, setAttachToBooking] = useState(DEFAULTS.attachToBooking);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [label, setLabel] = useState("");
  const [type, setType] = useState<FormField["type"]>("text");

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/business-settings?businessId=${businessId}&key=forms`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed to load settings");
      const row = Array.isArray(j.data) ? j.data[0] : null;
      const v = (row?.value ?? {}) as Partial<typeof DEFAULTS>;
      if (Array.isArray(v.fields)) setFields(v.fields);
      if (typeof v.attachToBooking === "boolean") setAttachToBooking(v.attachToBooking);
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

  function addField() {
    if (!label.trim()) return;
    setFields((prev) => [...prev, { label: label.trim(), type, required: false, options: "" }]);
    setLabel("");
  }

  async function save() {
    if (!businessId) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const r = await fetch("/api/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, key: "forms", value: { fields, attachToBooking } }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Save failed");
      setSaved(true);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (bizLoading || loading) {
    return <div className="flex items-center gap-2 text-sm text-[#8A8377]"><Loader2 className="h-4 w-4 animate-spin" /> Loading form settings...</div>;
  }

  return (
    <div className="bg-[#FAF7F2] min-h-full px-6 py-8">
      <div className="max-w-2xl">
        <Link href="/dashboard/settings" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8A8377] hover:text-[#1F1E1D] mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Settings
        </Link>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#9A7B4F" }}>
          Settings
        </p>
        <h1 className="font-[family-name:var(--font-display)] mt-0.5 text-2xl font-medium tracking-tight text-[#1F1B17]">Client intake forms</h1>
        <p className="mt-1 text-sm text-[#8A8377]">Build the questions clients answer when booking. Stored per business.</p>

        {bizError ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-700"><AlertCircle className="h-4 w-4" /> {bizError}</div>
        ) : (
          <>
            <label className="mt-6 flex items-start gap-3 text-sm rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)] p-4">
              <input type="checkbox" checked={attachToBooking} onChange={(e) => setAttachToBooking(e.target.checked)} className="mt-1 accent-[#795831]" />
              <span>
                <span className="font-medium text-[#1F1E1D]">Attach to booking flow</span>
                <span className="block text-xs text-[#8A8377]">When on, the public booking form shows these questions before confirming.</span>
              </span>
            </label>

            <div className="mt-4 rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)] p-5">
              <h2 className="text-sm font-semibold text-[#1F1E1D]">Questions ({fields.length})</h2>
              <div className="mt-3 space-y-2">
                {fields.length === 0 ? (
                  <p className="text-sm text-[#8A8377]">No questions yet. Add allergies, health notes, or preferences below.</p>
                ) : (
                  fields.map((f, i) => (
                    <div key={i} className="rounded-lg bg-[#FAF7F2] border border-[#E9E1D3] px-3 py-2.5">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-[#1F1E1D] flex-1 truncate">{i + 1}. {f.label}{f.required ? " *" : ""}</span>
                        <span className="text-xs text-[#8A8377]">{f.type}</span>
                        <button onClick={() => setFields((prev) => prev.filter((_, xi) => xi !== i))} className="p-1 hover:bg-red-50 rounded" aria-label="Remove question">
                          <Trash2 className="h-4 w-4 text-red-700" />
                        </button>
                      </div>
                      {f.type === "select" ? (
                        <Input value={f.options} onChange={(e) => setFields((prev) => prev.map((x, xi) => (xi === i ? { ...x, options: e.target.value } : x)))} placeholder="Options, comma separated" className="mt-2 bg-[#FBF7EF] border-[#E9E1D3] text-[#1F1E1D] placeholder:text-[#8A8377]" />
                      ) : (
                        <div className="mt-2 rounded-md border border-dashed border-[#E9E1D3] bg-[#FBF7EF] px-3 py-2 text-xs text-[#8A8377]">
                          {f.type === "textarea" ? "Long answer box" : f.type === "checkbox" ? "Yes / no checkbox" : "Short answer box"} preview
                        </div>
                      )}
                      <label className="mt-2 flex items-center gap-1.5 text-xs text-[#8A8377]">
                        <input type="checkbox" checked={f.required} onChange={(e) => setFields((prev) => prev.map((x, xi) => (xi === i ? { ...x, required: e.target.checked } : x)))} className="accent-[#795831]" /> Required
                      </label>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Question, e.g. Any allergies?" className="flex-1 bg-[#FAF7F2] border-[#E9E1D3] text-[#1F1E1D] placeholder:text-[#8A8377]" />
                <select value={type} onChange={(e) => setType(e.target.value as FormField["type"])} className="rounded-md border border-[#E9E1D3] bg-[#FAF7F2] px-2 py-2 text-sm text-[#1F1E1D]">
                  <option value="text" className="text-black">Short answer</option>
                  <option value="textarea" className="text-black">Long answer</option>
                  <option value="select" className="text-black">Pick one</option>
                  <option value="checkbox" className="text-black">Yes / no</option>
                </select>
                <Button onClick={addField} variant="secondaryDark"><Plus className="h-4 w-4" /></Button>
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-red-700 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {error}</p>}
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={save} disabled={saving || !businessId} className="rounded-full bg-[#1F1B17] text-white text-xs font-bold uppercase tracking-[0.12em] hover:bg-[#795831]">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Save form</>}
              </Button>
              {saved && <span className="text-sm text-emerald-700">Saved.</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
