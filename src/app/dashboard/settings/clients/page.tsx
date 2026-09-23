"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId } from "@/components/dashboard/use-business";

type CustomField = { name: string; type: "text" | "phone" | "date" | "checkbox"; required: boolean };

const DEFAULTS = {
  customFields: [] as CustomField[],
  smsReminders: true,
  emailConfirmations: true,
  birthdayOffers: false,
};

export default function ClientSettingsPage() {
  return (
    <PlanGate feature="clientSettings">
      <ClientSettingsInner />
    </PlanGate>
  );
}

function ClientSettingsInner() {
  const { businessId, loading: bizLoading, error: bizError } = useBusinessId();
  const [fields, setFields] = useState<CustomField[]>(DEFAULTS.customFields);
  const [smsReminders, setSmsReminders] = useState(DEFAULTS.smsReminders);
  const [emailConfirmations, setEmailConfirmations] = useState(DEFAULTS.emailConfirmations);
  const [birthdayOffers, setBirthdayOffers] = useState(DEFAULTS.birthdayOffers);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState<CustomField["type"]>("text");

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/business-settings?businessId=${businessId}&key=clients`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed to load settings");
      const row = Array.isArray(j.data) ? j.data[0] : null;
      const v = (row?.value ?? {}) as Partial<typeof DEFAULTS>;
      if (Array.isArray(v.customFields)) setFields(v.customFields);
      if (typeof v.smsReminders === "boolean") setSmsReminders(v.smsReminders);
      if (typeof v.emailConfirmations === "boolean") setEmailConfirmations(v.emailConfirmations);
      if (typeof v.birthdayOffers === "boolean") setBirthdayOffers(v.birthdayOffers);
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
    if (!fieldName.trim()) return;
    setFields((prev) => [...prev, { name: fieldName.trim(), type: fieldType, required: false }]);
    setFieldName("");
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
        body: JSON.stringify({ businessId, key: "clients", value: { customFields: fields, smsReminders, emailConfirmations, birthdayOffers } }),
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
    return <div className="flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading client settings...</div>;
  }

  return (
    <div className="bg-[#0F1729] min-h-full px-6 py-8">
      <div className="max-w-2xl">
        <Link href="/dashboard/settings" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#a89880] hover:text-[#3a2f22] mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Settings
        </Link>
        <h1 className="text-xl font-semibold text-[#3a2f22]">Client settings</h1>
        <p className="mt-1 text-sm text-[#a89880]">Custom client fields plus booking notification preferences.</p>

        {bizError ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {bizError}</div>
        ) : (
          <>
            <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-5">
              <h2 className="text-sm font-semibold text-[#3a2f22]">Custom client fields</h2>
              <p className="text-xs text-[#a89880] mt-1">Extra details collected for every client (allergies, preferred stylist, ...).</p>
              <div className="mt-3 space-y-2">
                {fields.length === 0 ? (
                  <p className="text-sm text-[#a89880]">No custom fields. Add one below.</p>
                ) : (
                  fields.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-[#faf6ef] border border-[#e6dcc8] px-3 py-2 text-sm">
                      <span className="font-medium text-[#3a2f22] flex-1 truncate">{f.name}</span>
                      <span className="text-xs text-[#a89880]">{f.type}</span>
                      <label className="flex items-center gap-1 text-xs text-[#a89880]">
                        <input type="checkbox" checked={f.required} onChange={(e) => setFields((prev) => prev.map((x, xi) => (xi === i ? { ...x, required: e.target.checked } : x)))} className="accent-white" /> Required
                      </label>
                      <button onClick={() => setFields((prev) => prev.filter((_, xi) => xi !== i))} className="p-1 hover:bg-red-500/20 rounded" aria-label="Remove field">
                        <Trash2 className="h-4 w-4 text-red-300" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <Input value={fieldName} onChange={(e) => setFieldName(e.target.value)} placeholder="Field name, e.g. Allergies" className="flex-1 bg-[#faf6ef] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
                <select value={fieldType} onChange={(e) => setFieldType(e.target.value as CustomField["type"])} className="rounded-md border border-[#e6dcc8] bg-[#faf6ef] px-2 py-2 text-sm text-[#3a2f22]">
                  <option value="text" className="text-black">Text</option>
                  <option value="phone" className="text-black">Phone</option>
                  <option value="date" className="text-black">Date</option>
                  <option value="checkbox" className="text-black">Checkbox</option>
                </select>
                <Button onClick={addField} variant="secondaryDark"><Plus className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-5 space-y-3">
              <h2 className="text-sm font-semibold text-[#3a2f22]">Notifications</h2>
              {[
                { label: "SMS booking reminders", hint: "Text clients before their appointment.", value: smsReminders, set: setSmsReminders },
                { label: "Email confirmations", hint: "Email a confirmation on every booking.", value: emailConfirmations, set: setEmailConfirmations },
                { label: "Birthday offers", hint: "Flag clients with upcoming birthdays for a treat.", value: birthdayOffers, set: setBirthdayOffers },
              ].map((t) => (
                <label key={t.label} className="flex items-start gap-3 text-sm">
                  <input type="checkbox" checked={t.value} onChange={(e) => t.set(e.target.checked)} className="mt-1 accent-white" />
                  <span>
                    <span className="font-medium text-[#3a2f22]">{t.label}</span>
                    <span className="block text-xs text-[#a89880]">{t.hint}</span>
                  </span>
                </label>
              ))}
            </div>

            {error && <p className="mt-3 text-sm text-red-300 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {error}</p>}
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={save} disabled={saving || !businessId} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Save settings</>}
              </Button>
              {saved && <span className="text-sm text-emerald-300">Saved.</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
