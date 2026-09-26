"use client";

export type SalonSortOption = "newest" | "oldest" | "name_asc" | "name_desc";

export const SALON_SORT_LABELS: Record<SalonSortOption, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  name_asc: "Name (A–Z)",
  name_desc: "Name (Z–A)",
};

export function SalonSortSelect({ sort, count }: { sort: SalonSortOption; count: number }) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <p className="text-xs font-medium text-[#a89880]">
        {count} salon{count === 1 ? "" : "s"}
      </p>
      <form className="flex items-center gap-2" action="/admin/salon-subscriptions" method="GET">
        <label htmlFor="salon-sort" className="text-xs font-semibold uppercase tracking-wide text-[#a89880]">
          Sort
        </label>
        <select
          id="salon-sort"
          name="sort"
          defaultValue={sort}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="h-9 rounded-md border border-[#E3E8F0] bg-white px-2.5 text-sm font-medium text-[#3a2f22] outline-none focus:border-[#c9a26d]"
        >
          {(Object.entries(SALON_SORT_LABELS) as [SalonSortOption, string][]).map(([value, labelText]) => (
            <option key={value} value={value}>
              {labelText}
            </option>
          ))}
        </select>
        <noscript>
          <button
            type="submit"
            className="h-9 rounded-md border border-[#E3E8F0] bg-white px-3 text-sm font-medium text-[#3a2f22]"
          >
            Apply
          </button>
        </noscript>
      </form>
    </div>
  );
}
