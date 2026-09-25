"use client";
import { useState } from "react";
import { Star, X } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

export function FeedbackButton({ businessId, businessName }: { businessId: string; businessName: string }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/public/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, rating, comment: comment || undefined, name: name || undefined }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? t("feedback.failed"));
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("feedback.error"));
    } finally {
      setSubmitting(false);
    }
  }

  function close() {
    setOpen(false);
    if (done) {
      setTimeout(() => {
        setDone(false);
        setName("");
        setComment("");
        setRating(5);
      }, 300);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-[#E5DDD0] bg-white px-4 py-2 text-sm font-medium text-[#1F1E1D] transition-colors hover:bg-[#F7F3ED]"
      >
        <Star className="h-4 w-4 text-[#9A7B4F]" /> {t("feedback.leave")}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("feedback.rateAria").replace("{name}", businessName)}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90dvh] w-full overflow-y-auto overscroll-contain rounded-t-2xl bg-white p-6 sm:max-w-md sm:rounded-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-[#1F1E1D]">{t("feedback.rate").replace("{name}", businessName)}</h3>
              <button
                type="button"
                aria-label={t("feedback.close")}
                onClick={close}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#F7F3ED]"
              >
                <X className="h-5 w-5 text-[#8A8377]" />
              </button>
            </div>
            {done ? (
              <p className="mt-6 text-sm text-[#4A4640]">{t("feedback.thanks")}</p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex gap-1" role="radiogroup" aria-label={t("feedback.rating")}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      aria-label={t("feedback.stars").replace("{count}", String(n))}
                      aria-pressed={n === rating}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full"
                    >
                      <Star
                        className={`h-7 w-7 ${n <= rating ? "fill-[#9A7B4F] text-[#9A7B4F]" : "text-[#E5DDD0]"}`}
                      />
                    </button>
                  ))}
                </div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("feedback.name")}
                  autoComplete="name"
                  className="h-12 w-full rounded-xl border border-[#E5DDD0] px-3 text-[15px] text-[#1F1E1D] outline-none focus:border-[#795831]"
                />
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder={t("feedback.comment")}
                  className="w-full rounded-xl border border-[#E5DDD0] px-3 py-2 text-[15px] text-[#1F1E1D] outline-none focus:border-[#795831]"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="h-12 w-full rounded-full bg-[#1F1B17] text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                >
                  {submitting ? t("feedback.submitting") : t("feedback.submit")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
