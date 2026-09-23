"use client";
import {
  Scissors,
  Sparkles,
  Wand2,
  Droplets,
  Sun,
  Bike,
  HeartHandshake,
  Dog,
  Stethoscope,
  PawPrint,
  type LucideIcon,
} from "lucide-react";

const CATEGORIES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "hair-salon", label: "Hair salon", icon: Scissors },
  { id: "nails", label: "Nails", icon: Sparkles },
  { id: "eyebrows-lashes", label: "Eyebrows and lashes", icon: Wand2 },
  { id: "beauty-salon", label: "Beauty salon", icon: Sparkles },
  { id: "medspa", label: "Medspa", icon: Stethoscope },
  { id: "barber", label: "Barber", icon: Scissors },
  { id: "massage", label: "Massage", icon: HeartHandshake },
  { id: "spa-sauna", label: "Spa and sauna", icon: Droplets },
  { id: "waxing", label: "Waxing salon", icon: Sun },
  { id: "tattoo-piercing", label: "Tattooing and piercing", icon: PawPrint },
  { id: "fitness", label: "Fitness and recovery", icon: Bike },
  { id: "pet-grooming", label: "Pet grooming", icon: Dog },
];

export function StepCategories({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-sm text-[#a89880] mb-4">
        Choose your primary category and up to three related ones.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {CATEGORIES.map((c) => {
          const active = selected.includes(c.id);
          const disabled = !active && selected.length >= 4;
          return (
            <button
              key={c.id}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(c.id)}
              className={`rounded-xl border p-5 text-left transition-colors ${active ? "border-[#c9a26d] bg-[#c9a26d]/10" : "border-[#e6dcc8] bg-[#f6efe3] hover:bg-[#f3ebdd]"} disabled:opacity-40`}
            >
              <c.icon className="h-5 w-5" />
              <p className="mt-3 text-sm font-medium">{c.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
