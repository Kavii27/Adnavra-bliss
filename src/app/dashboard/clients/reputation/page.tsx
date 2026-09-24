"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Store, Plus, Check, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId } from "@/components/dashboard/use-business";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  source: string;
  createdAt: string;
  customer: { id: string; name: string } | null;
};

function Stars({ value, onPick }: { value: number; onPick?: (v: number) => void }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onPick}
          onClick={() => onPick?.(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={onPick ? "hover:scale-110 transition-transform" : "cursor-default"}
        >
          <Star className={`h-4 w-4 ${n <= value ? "fill-[#C9A467] text-[#C9A467]" : "text-[#E9E1D3]"}`} />
        </button>
      ))}
    </span>
  );
}

export default function ReputationPage() {
  return (
    <PlanGate feature="onlineReputation">
      <ReputationInner />
    </PlanGate>
  );
}

function ReputationInner() {
  const { businessId, loading: bizLoading, error: bizError, isNoBusiness } = useBusinessId();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [total, setTotal] = useState(0);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const [rR, cR] = await Promise.all([
        fetch(`/api/reviews?businessId=${businessId}&limit=100`),
        fetch(`/api/customers?limit=200`),
      ]);
      const rJ = await rR.json();
      if (!rR.ok) throw new Error(rJ.error ?? "Failed to load reviews");
      setReviews(rJ.data ?? []);
      setAverage(rJ.summary?.average ?? 0);
      setTotal(rJ.summary?.total ?? 0);
      if (cR.ok) {
        const cJ = await cR.json();
        if (Array.isArray(cJ.data)) setCustomers(cJ.data);
      }
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

  const distribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    for (const r of reviews) counts[r.rating - 1] += 1;
    return counts;
  }, [reviews]);
  const maxCount = Math.max(1, ...distribution);

  async function handleSubmit() {
    if (!businessId) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          rating,
          comment: comment.trim() || null,
          customerId: customerId || null,
          source: "staff-logged",
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Save failed");
      setShowForm(false);
      setRating(5);
      setComment("");
      setCustomerId("");
      await load();
    } catch (e: unknown) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this review?")) return;
    const r = await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error ?? "Delete failed");
      return;
    }
    await load();
  }

  if (bizLoading || (loading && businessId)) {
    return <div className="flex items-center gap-2 text-sm text-[#8A8377]"><Loader2 className="h-4 w-4 animate-spin" /> Loading reputation...</div>;
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
        <h3 className="mt-5 font-[family-name:var(--font-display)] text-xl font-semibold text-[#1F1B17]">Set up your salon to track reviews</h3>
        <p className="mt-1.5 text-sm text-[#8A8377]">{bizError ?? "Create your business profile first."}</p>
        <Link href="/dashboard/settings" className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#1F1B17] px-7 text-[12px] font-bold uppercase tracking-[0.14em] text-white hover:bg-[#795831]">Go to Settings</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#9A7B4F" }}>Clients</p>
          <h1 className="font-[family-name:var(--font-display)] mt-1 text-3xl font-medium tracking-tight text-[#1F1B17]">Online reputation</h1>
          <p className="text-sm text-[#8A8377] mt-1.5">One ratings system — the same reviews feed your marketplace listing.</p>
        </div>
        <button
          onClick={() => { setFormError(null); setShowForm(true); }}
          className="inline-flex items-center rounded-full bg-[#1F1B17] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#795831]"
        >
          <Plus className="h-4 w-4 mr-2" /> Log review
        </button>
      </div>

      {error ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-500"><AlertCircle className="h-4 w-4" /> {error}</div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[#E9E1D3] bg-white p-5 shadow-[0_4px_20px_rgba(30,28,26,0.05)]">
              <p className="text-xs uppercase tracking-wide text-[#8A8377]">Average rating</p>
              {total === 0 ? (
                <p className="mt-2 text-sm text-[#8A8377]">No reviews yet — log walk-in feedback to build your rating.</p>
              ) : (
                <>
                  <p className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold text-[#1F1B17]">{average.toFixed(1)}</p>
                  <div className="mt-1"><Stars value={Math.round(average)} /></div>
                  <p className="mt-1 text-xs text-[#8A8377]">across {total} review(s)</p>
                </>
              )}
            </div>
            <div className="rounded-2xl border border-[#E9E1D3] bg-white p-5 shadow-[0_4px_20px_rgba(30,28,26,0.05)]">
              <p className="text-xs uppercase tracking-wide text-[#8A8377]">Rating breakdown</p>
              <div className="mt-3 space-y-2">
                {[5, 4, 3, 2, 1].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <span className="text-xs text-[#8A8377] w-8">{s} ★</span>
                    <div className="flex-1 h-2 rounded-full bg-[#FBF7EF] overflow-hidden">
                      <div className="h-full bg-[#C9A467] rounded-full" style={{ width: `${(distribution[s - 1] / maxCount) * 100}%` }} />
                    </div>
                    <span className="text-xs text-[#1F1E1D] w-6 text-right">{distribution[s - 1]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-[#E9E1D3] bg-white p-8 text-center text-sm text-[#8A8377] shadow-[0_4px_20px_rgba(30,28,26,0.05)]">
                No reviews yet. After an appointment, ask the client and log their rating here.
              </div>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-[#E9E1D3] bg-white p-4 shadow-[0_2px_12px_rgba(30,28,26,0.04)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Stars value={r.rating} />
                        <span className="text-xs text-[#8A8377]">{r.customer?.name ?? "Anonymous"} · {r.source}</span>
                      </div>
                      {r.comment && <p className="mt-1.5 text-sm text-[#1F1E1D]">{r.comment}</p>}
                      <p className="mt-1 text-xs text-[#8A8377]">{new Date(r.createdAt).toLocaleDateString("en-GB")}</p>
                    </div>
                    <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg border border-[#E9E1D3] bg-[#FAF7F2] hover:bg-red-50 shrink-0" aria-label="Delete review">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl border border-[#E9E1D3] p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[#1F1E1D]">Log review</h2>
            <div className="mt-4 space-y-4">
              <div>
                <span className="text-sm font-medium text-[#1F1E1D]">Rating *</span>
                <div className="mt-1"><Stars value={rating} onPick={setRating} /></div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#1F1E1D]">Client</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="mt-1 w-full rounded-md border border-[#E9E1D3] bg-[#FBF7EF] px-3 py-2 text-sm text-[#1F1E1D]">
                  <option value="" className="text-black">Anonymous</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="text-black">{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#1F1E1D]">Comment</label>
                <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did they say?" className="mt-1 bg-[#FBF7EF] border-[#E9E1D3] text-[#1F1E1D] placeholder:text-[#8A8377]" />
              </div>
              {formError && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="inline-flex items-center rounded-full border border-[#E5DDD0] bg-white px-4 py-2 text-sm font-medium text-[#4A4640] hover:bg-[#FBF7EF]">Cancel</button>
                <Button onClick={handleSubmit} disabled={submitting} className="bg-[#1F1B17] text-white hover:bg-[#795831]">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Save</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
