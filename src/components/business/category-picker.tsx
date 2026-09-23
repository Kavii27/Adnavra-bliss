"use client";

import { BUSINESS_TYPES } from "@/lib/categories";

type PickerProps = {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  idPrefix?: string;
};

/**
 * Shared salon-type picker (Task 3.4).
 * Single source of truth for the Unisex/Gents/Ladies/etc. tags so the
 * owner-facing Settings → Business page and the admin business-detail
 * "Profile" tab can never drift apart. Cap is independent of the
 * onboarding `categories` column (see Task 1 split).
 */
export function SalonTypePicker({ value, onChange, max = 4, idPrefix = "salon-type" }: PickerProps) {
  function toggle(slug: string) {
    if (value.includes(slug)) {
      onChange(value.filter((s) => s !== slug));
      return;
    }
    if (value.length >= max) return;
    onChange([...value, slug]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {BUSINESS_TYPES.map((t) => {
        const active = value.includes(t.slug);
        const disabled = !active && value.length >= max;
        return (
          <label
            key={t.slug}
            htmlFor={`${idPrefix}-${t.slug}`}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "border-[#8a6d4f] bg-[#8a6d4f] text-white"
                : "border-[#e6dcc8] bg-[#faf6ef] text-[#3a2f22] hover:bg-[#f3ebdd]"
            } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
          >
            <input
              id={`${idPrefix}-${t.slug}`}
              type="checkbox"
              checked={active}
              disabled={disabled}
              onChange={() => toggle(t.slug)}
              className="h-3.5 w-3.5 accent-[#8a6d4f]"
            />
            {t.label}
          </label>
        );
      })}
    </div>
  );
}
