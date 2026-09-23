"use client";
import { Check } from "lucide-react";

const OPTIONS = [
  { id: "PHYSICAL", label: "Clients come to me at a physical location" },
  { id: "MOBILE", label: "I visit my clients as a mobile operator" },
  { id: "VIRTUAL", label: "I provide virtual services online" },
];

export function StepLocationType({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3 max-w-md">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${value === o.id ? "border-[#c9a26d] bg-[#c9a26d]/10" : "border-[#e6dcc8] bg-[#f6efe3] hover:bg-[#f3ebdd]"}`}
        >
          {o.label}
          {value === o.id && (
            <span className="h-5 w-5 rounded-full bg-[#c9a26d] flex items-center justify-center">
              <Check className="h-3 w-3 text-[#faf6ef]" />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
