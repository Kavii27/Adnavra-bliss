"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, Check, Clock, ArrowLeft } from "lucide-react";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

type HoursValue = { open: string; close: string; closed: boolean };

export default function SchedulingPage() {
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [, setBusiness] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hours, setHours] = useState<Record<string, HoursValue>>(() => {
    const init: Record<string, HoursValue> = {};
    for (const d of DAYS) init[d] = { open: "09:00", close: "18:00", closed: d === "sunday" };
    return init;
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/businesses");
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed to load");
      if (j.data?.length > 0) {
        const b = j.data[0];
        setBusiness(b);
        setBusinessId(b.id);
        if (b.openingHours && typeof b.openingHours === "object") {
          const merged: Record<string, HoursValue> = {};
          for (const d of DAYS) {
            const v = (b.openingHours as Record<string, HoursValue>)[d];
            merged[d] = v ? { open: v.open ?? "09:00", close: v.close ?? "18:00", closed: !!v.closed } : { open: "09:00", close: "18:00", closed: d === "sunday" };
          }
          setHours(merged);
        }
      } else {
        setBusiness(null);
        setBusinessId(null);
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave() {
    if (!businessId) {
      setError("Create your business in Business setup first, then set hours here.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const r = await fetch(`/api/businesses/${businessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openingHours: hours }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? JSON.stringify(j.details ?? j));
      setSuccess(true);
      await load();
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-[#0F1729] min-h-full px-6 py-8">
        <div className="flex items-center gap-2 text-sm text-[#a89880]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading hours...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0F1729] min-h-full px-6 py-8">
      <div className="max-w-2xl">
        <Link href="/dashboard/settings" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#a89880] hover:text-[#3a2f22] mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Settings
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center border border-[#e6dcc8]">
            <Clock className="h-5 w-5 text-[#faf6ef]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[#3a2f22]">Scheduling</h1>
            <p className="text-sm text-[#a89880] mt-1">Set opening hours for each day. Closed days are not bookable.</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}
        {success && (
          <div className="mt-4 flex items-center gap-2 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
            <Check className="h-4 w-4" /> Hours saved
          </div>
        )}

        {!businessId ? (
          <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center">
            <p className="text-sm text-[#a89880]">No business found. Create your profile in Business setup first.</p>
            <Link href="/dashboard/settings/business" className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#faf6ef] hover:bg-white/90">
              Go to Business setup
            </Link>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-6 space-y-4">
            <div className="grid gap-2">
              {DAYS.map((d) => (
                <div key={d} className="flex items-center gap-3 rounded-lg bg-[#faf6ef] border border-[#e6dcc8] px-3 py-2.5">
                  <span className="capitalize text-sm w-24 font-medium text-[#3a2f22]">{d}</span>
                  <label className="flex items-center gap-1.5 text-xs text-[#a89880] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hours[d].closed}
                      onChange={(e) => setHours((h) => ({ ...h, [d]: { ...h[d], closed: e.target.checked } }))}
                      className="accent-white"
                    />{" "}
                    Closed
                  </label>
                  {!hours[d].closed && (
                    <>
                      <Input
                        value={hours[d].open}
                        onChange={(e) => setHours((h) => ({ ...h, [d]: { ...h[d], open: e.target.value } }))}
                        type="time"
                        className="h-8 max-w-[120px] bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]"
                      />
                      <span className="text-xs text-[#a89880]">to</span>
                      <Input
                        value={hours[d].close}
                        onChange={(e) => setHours((h) => ({ ...h, [d]: { ...h[d], close: e.target.value } }))}
                        type="time"
                        className="h-8 max-w-[120px] bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...
                </>
              ) : (
                "Save hours"
              )}
            </Button>

            <p className="text-xs text-center text-[#a89880]">
              Also manage identity fields in{" "}
              <Link href="/dashboard/settings/business" className="text-[#3a2f22] hover:underline">
                Business setup
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
