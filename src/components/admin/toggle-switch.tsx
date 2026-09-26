"use client";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  dark?: boolean;
};

// Fixed pixel geometry, defined once, used both for computing the knob's
// travel distance and as inline-style fallbacks below. Never rely on
// Tailwind utility classes alone for a component this small — a single
// dropped class is exactly what caused the original bug.
const TRACK_WIDTH = 36; // px
const TRACK_HEIGHT = 20; // px
const KNOB_SIZE = 16; // px
const KNOB_INSET = 2; // px

export function ToggleSwitch({ checked, onChange, disabled, label, dark }: Props) {
  const knobTravel = TRACK_WIDTH - KNOB_SIZE - KNOB_INSET * 2; // px the knob moves when checked

  return (
    <label className="grid w-full cursor-pointer grid-cols-[36px_1fr] items-center gap-x-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        style={{
          width: TRACK_WIDTH,
          height: TRACK_HEIGHT,
          minWidth: TRACK_WIDTH,
          padding: 0,
          margin: 0,
          border: "none",
          outline: "none",
          appearance: "none",
          WebkitAppearance: "none",
          lineHeight: 0,
        }}
        className={`relative inline-block shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "bg-[#c9a26d]" : dark ? "bg-white/20" : "bg-[#E3E8F0]"
        }`}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: KNOB_INSET,
            left: KNOB_INSET,
            width: KNOB_SIZE,
            height: KNOB_SIZE,
            borderRadius: 9999,
            background: "#ffffff",
            boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
            transform: `translateX(${checked ? knobTravel : 0}px)`,
            transition: "transform 150ms ease",
            pointerEvents: "none",
          }}
        />
      </button>
      <span className={`text-xs font-medium leading-tight ${dark ? "text-[#faf6ef]/90" : "text-[#3a2f22]"}`}>
        {label}
      </span>
    </label>
  );
}
