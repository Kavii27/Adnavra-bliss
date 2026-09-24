"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { BUSINESS_TYPES } from "@/lib/categories";

/**
 * Collapsible advanced search under the hero.
 * Only exposes filters the backend actually honors (`category` via
 * Business.categories/salonTypes has-match, `date` via the search page day pills).
 * Price range and time-of-day are deliberately omitted — the search API has
 * no support for them, and shipping them would be fake filters.
 */
export function AdvancedSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [salonType, setSalonType] = useState("");
  const [date, setDate] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (salonType) params.set("category", salonType);
    if (date) params.set("date", date);
    const qs = params.toString();
    router.push(`/customer/search${qs ? `?${qs}` : ""}`);
  }

  function handleReset() {
    setSalonType("");
    setDate("");
  }

  return (
    <section className="px-6 lg:px-10 max-w-[1600px] mx-auto">
      <div className="rounded-2xl border border-[#E5DDD0] bg-white">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 px-5 py-4 text-left"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#1F1E1D]">
            <SlidersHorizontal className="h-4 w-4 text-[#795831]" />
            Advanced search
          </span>
          <ChevronDown
            className={`h-4 w-4 text-[#8A8377] transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <form onSubmit={handleSubmit} className="grid gap-4 border-t border-[#E5DDD0] px-5 py-5 sm:grid-cols-2">
            <div>
              <label htmlFor="adv-salon-type" className="text-xs font-semibold uppercase tracking-wide text-[#8A8377]">
                Salon type
              </label>
              <select
                id="adv-salon-type"
                value={salonType}
                onChange={(e) => setSalonType(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#E5DDD0] bg-white px-3 py-2.5 text-sm text-[#1F1E1D] outline-none focus:border-[#795831] focus:ring-1 focus:ring-[#795831]"
              >
                <option value="">Any type</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="adv-date" className="text-xs font-semibold uppercase tracking-wide text-[#8A8377]">
                Date
              </label>
              <input
                id="adv-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#E5DDD0] bg-white px-3 py-2.5 text-sm text-[#1F1E1D] outline-none focus:border-[#795831] focus:ring-1 focus:ring-[#795831]"
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-[#2A1D12] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#17100A]"
              >
                Search
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-[#E5DDD0] px-5 py-2.5 text-sm font-medium text-[#4A4640] transition hover:bg-[#F7F3ED]"
              >
                Reset
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
