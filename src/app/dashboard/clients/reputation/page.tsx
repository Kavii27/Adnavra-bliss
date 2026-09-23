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
          <Star className={`h-4 w-4 ${n <= value ? "fill-[#c9a26d] text-[#c9a26d]" : "text-[#e6dcc8]"}`} />
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
    return <div className="flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading reputation...</div>;
  }
  if (isNoBusiness || bizError) {
    return (
      <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe3] border border-[#e6dcc8]">
          <Store className="h-5 w-5 text-[#a89880]" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#3a2f22]">Set up your salon to track reviews</h3>
        <p className="mt-1 text-sm text-[#a89880]">{bizError ?? "Create your business profile first."}</p>
        <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#faf6ef] hover:bg-white/90">Go to Settings</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#3a2f22]">Online reputation</h1>
          <p className="text-sm text-[#a89880] mt-1">One ratings system — the same reviews feed your marketplace listing.</p>
        </div>
        <Button onClick={() => { setFormError(null); setShowForm(true); }} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">
          <Plus className="h-4 w-4 mr-2" /> Log review
        </Button>
      </div>

      {error ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {error}</div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-5">
              <p className="text-xs uppercase tracking-wide text-[#a89880]">Average rating</p>
              {total === 0 ? (
                <p className="mt-2 text-sm text-[#a89880]">No reviews yet — log walk-in feedback to build your rating.</p>
              ) : (
                <>
                  <p className="mt-1 text-3xl font-semibold text-[#3a2f22]">{average.toFixed(1)}</p>
                  <div className="mt-1"><Stars value={Math.round(average)} /></div>
                  <p className="mt-1 text-xs text-[#a89880]">across {total} review(s)</p>
                </>
              )}
            </div>
            <div className="rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-5">
              <p className="text-xs uppercase tracking-wide text-[#a89880]">Rating breakdown</p>
              <div className="mt-3 space-y-2">
                {[5, 4, 3, 2, 1].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <span className="text-xs text-[#a89880] w-8">{s} ★</span>
                    <div className="flex-1 h-2 rounded-full bg-[#f3ebdd] overflow-hidden">
                      <div className="h-full bg-[#c9a26d] rounded-full" style={{ width: `${(distribution[s - 1] / maxCount) * 100}%` }} />
                    </div>
                    <span className="text-xs text-[#3a2f22] w-6 text-right">{distribution[s - 1]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {reviews.length === 0 ? (
              <div className="rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center text-sm text-[#a89880]">
                No reviews yet. After an appointment, ask the client and log their rating here.
              </div>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Stars value={r.rating} />
                        <span className="text-xs text-[#a89880]">{r.customer?.name ?? "Anonymous"} · {r.source}</span>
                      </div>
                      {r.comment && <p className="mt-1.5 text-sm text-[#3a2f22]">{r.comment}</p>}
                      <p className="mt-1 text-xs text-[#a89880]">{new Date(r.createdAt).toLocaleDateString("en-GB")}</p>
                    </div>
                    <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg border border-[#e6dcc8] bg-[#faf6ef] hover:bg-red-500/20 shrink-0" aria-label="Delete review">
                      <Trash2 className="h-4 w-4 text-red-300" />
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
          <div className="bg-[#0F1729] rounded-xl border border-[#e6dcc8] p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[#3a2f22]">Log review</h2>
            <div className="mt-4 space-y-4">
              <div>
                <span className="text-sm font-medium text-[#3a2f22]">Rating *</span>
                <div className="mt-1"><Stars value={rating} onPick={setRating} /></div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Client</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="mt-1 w-full rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm text-[#3a2f22]">
                  <option value="" className="text-black">Anonymous</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id} className="text-black">{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Comment</label>
                <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did they say?" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
              {formError && <p className="text-sm text-red-300 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghostDark" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : <><Check className="h-4 w-4 mr-2" /> Save</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
