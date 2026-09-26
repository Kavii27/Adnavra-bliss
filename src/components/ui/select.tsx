"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string };

type UiSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  ariaLabel: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
};

/**
 * ADNAVRA styled dropdown per DESIGN.md.
 * Custom listbox (not a native browser select) so the closed state and the
 * open panel both use DESIGN tokens: 8px trigger radius, hairline border,
 * canvas/white surface, 6px item radius, warm shadow, lucide chevron + check.
 * Keyboard: Escape closes. Click outside closes. Arrow-free, button based.
 */
export function UiSelect({
  value,
  onValueChange,
  options,
  ariaLabel,
  id,
  disabled,
  className = "",
  triggerClassName = "",
}: UiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onOutside);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  return (
    <div ref={ref} id={id} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-10 min-w-36 items-center justify-between gap-2 rounded-md border border-[#E3E8F0] bg-white px-3 text-sm font-medium text-[#3a2f22] transition outline-none hover:border-[#c9a26d] focus:border-[#8a6d4f] disabled:opacity-50 ${triggerClassName}`}
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#a89880] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-50 mt-1.5 min-w-full overflow-hidden rounded-lg border border-[#E3E8F0] bg-white py-1.5 shadow-[0_1px_2px_rgba(58,47,34,0.06),0_12px_28px_rgba(58,47,34,0.12)]"
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onValueChange(o.value);
                  setOpen(false);
                }}
                className={`mx-1.5 flex w-[calc(100%-12px)] items-center justify-between gap-2 rounded-sm px-2.5 py-2 text-left text-sm transition ${
                  active
                    ? "bg-[#faf6ef] font-semibold text-[#3a2f22]"
                    : "font-normal text-[#475467] hover:bg-[#faf6ef] hover:text-[#3a2f22]"
                }`}
              >
                <span className="truncate">{o.label}</span>
                {active && <Check className="h-3.5 w-3.5 shrink-0 text-[#8a6d4f]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

type StyledNativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string;
};

/**
 * Styled native select for form-heavy rows where native behaviour
 * (form submit, autofill) is needed. Visually identical to UiSelect trigger:
 * appearance-none, custom chevron, DESIGN tokens. Option elements keep
 * browser rendering but inherit ink text on white.
 */
export function StyledNativeSelect({ wrapperClassName = "", className = "", children, ...props }: StyledNativeSelectProps) {
  return (
    <span className={`relative inline-flex items-center ${wrapperClassName}`}>
      <select
        {...props}
        className={`h-10 appearance-none rounded-md border border-[#E3E8F0] bg-white py-0 pl-3 pr-9 text-sm font-medium text-[#3a2f22] transition outline-none hover:border-[#c9a26d] focus:border-[#8a6d4f] disabled:opacity-50 ${className}`}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 shrink-0 text-[#a89880]" />
    </span>
  );
}
