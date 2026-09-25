"use client";
import { BUSINESS_TYPES } from "@/lib/categories";

export function StepSalonTypes({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-sm text-[#a89880]">
        Choose up to 4 types that describe your salon (e.g. Gents, Ladies, Unisex, Bridal, Home visits).
      </p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {BUSINESS_TYPES.map((type) => {
          const active = selected.includes(type.slug);
          const disabled = !active && selected.length >= 4;
          return (
            <button
              key={type.slug}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(type.slug)}
              className={`rounded-xl border p-5 text-left transition-colors disabled:opacity-40 ${active ? "border-[#c9a26d] bg-[#c9a26d]/10" : "border-[#e6dcc8] bg-[#f6efe3] hover:bg-[#f3ebdd]"}`}
            >
              <type.icon className="h-5 w-5" />
              <p className="mt-3 text-sm font-medium">{type.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
