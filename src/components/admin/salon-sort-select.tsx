"use client";

import { UiSelect } from "@/components/ui/select";

export type SalonSortOption = "newest" | "oldest" | "name_asc" | "name_desc";

export const SALON_SORT_LABELS: Record<SalonSortOption, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  name_asc: "Name (A to Z)",
  name_desc: "Name (Z to A)",
};

export function SalonSortSelect({ sort, count }: { sort: SalonSortOption; count: number }) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <p className="text-xs font-medium text-[#a89880]">
        {count} salon{count === 1 ? "" : "s"}
      </p>
      <form id="salon-sort-form" className="flex items-center gap-2" action="/admin/salon-subscriptions" method="GET">
        <span className="text-xs font-semibold uppercase tracking-wide text-[#a89880]">
          Sort
        </span>
        <input type="hidden" id="salon-sort-value" name="sort" defaultValue={sort} />
        <UiSelect
          ariaLabel="Sort salons"
          value={sort}
          onValueChange={(next) => {
            const form = document.getElementById("salon-sort-form") as HTMLFormElement | null;
            const input = document.getElementById("salon-sort-value") as HTMLInputElement | null;
            if (input) input.value = next;
            form?.requestSubmit();
          }}
        options={(Object.entries(SALON_SORT_LABELS) as [SalonSortOption, string][]).map(([value, labelText]) => ({
            value,
            label: labelText,
          }))}
        />
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
