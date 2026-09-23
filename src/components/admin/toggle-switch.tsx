"use client";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  dark?: boolean;
};

export function ToggleSwitch({ checked, onChange, disabled, label, dark }: Props) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          checked ? "bg-[#c9a26d]" : dark ? "bg-white/20" : "bg-[#E3E8F0]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
      <span className={`text-xs font-medium ${dark ? "text-[#faf6ef]/90" : "text-[#3a2f22]"}`}>{label}</span>
    </label>
  );
}
