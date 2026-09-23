"use client";

const OPTIONS = [
  { id: "INDEPENDENT", label: "I'm an independent" },
  { id: "2-5", label: "2 to 5 people" },
  { id: "6-10", label: "6 to 10 people" },
  { id: "11-20", label: "11 to 20 people" },
  { id: "20+", label: "20+ people" },
];

export function StepTeamSize({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3 max-w-md">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`w-full text-left rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${value === o.id ? "border-[#c9a26d] bg-[#c9a26d]/10" : "border-[#e6dcc8] bg-[#f6efe3] hover:bg-[#f3ebdd]"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
