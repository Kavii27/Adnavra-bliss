"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";

export type TimeBand = "any" | "morning" | "afternoon" | "evening" | "custom";

export type DateTimeValue = {
  date: string | null; // YYYY-MM-DD
  band: TimeBand;
  from?: string; // HH:mm
  to?: string; // HH:mm
} | null;

type DateTimePickerProps = {
  value: DateTimeValue;
  onChange: (next: DateTimeValue) => void;
};

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fromISO(iso: string): Date {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(y, m - 1, day);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

const BANDS: { id: TimeBand; label: string; hint?: string }[] = [
  { id: "any", label: "Any time" },
  { id: "morning", label: "Morning", hint: "9am–12pm" },
  { id: "afternoon", label: "Afternoon", hint: "12pm–6pm" },
  { id: "evening", label: "Evening", hint: "6pm–12am" },
  { id: "custom", label: "Custom" },
];

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const tomorrow = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }, [today]);

  const [cursor, setCursor] = useState<Date>(() => startOfMonth(today));
  const [customFrom, setCustomFrom] = useState(value?.from ?? "09:00");
  const [customTo, setCustomTo] = useState(value?.to ?? "17:00");

  const ref = useRef<HTMLDivElement>(null);

  // Keep custom inputs synced when parent value changes externally
  useEffect(() => {
    if (value?.from) setCustomFrom(value.from);
    if (value?.to) setCustomTo(value.to);
    if (value?.date) {
      const d = fromISO(value.date);
      setCursor(startOfMonth(d));
    }
  }, [value?.from, value?.to, value?.date]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const selectedDate: Date | null = value?.date ? fromISO(value.date) : null;
  const band: TimeBand = value?.band ?? "any";

  function displayLabel(): string {
    if (!value?.date) return "Any time";
    const d = fromISO(value.date);
    const isToday = isSameDay(d, today);
    const isTomorrow = isSameDay(d, tomorrow);
    const dateLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const bandObj = BANDS.find((b) => b.id === band);
    const bandLabel = band && band !== "any" ? ` · ${bandObj?.label ?? band}` : "";
    if (band === "custom" && value?.from && value?.to) return `${dateLabel}, ${value.from}–${value.to}`;
    return `${dateLabel}${bandLabel}`;
  }

  function setDate(iso: string | null) {
    if (iso === null) {
      onChange(null);
      return;
    }
    const nextBand: TimeBand = value?.band ?? "any";
    onChange({ date: iso, band: nextBand, ...(nextBand === "custom" ? { from: customFrom, to: customTo } : {}) });
  }

  function setBand(next: TimeBand) {
    if (next === "custom") {
      // keep date, require from/to
      const date = value?.date ?? toISODate(today);
      onChange({ date, band: "custom", from: customFrom, to: customTo });
      return;
    }
    if (!value?.date) {
      // picking a band without a date should default to today for better UX, but spec says store date; we set today
      onChange({ date: toISODate(today), band: next });
      return;
    }
    onChange({ date: value.date, band: next });
  }

  function handleCustomTimeChange() {
    if (band !== "custom") return;
    if (!value?.date) return;
    onChange({ date: value.date, band: "custom", from: customFrom, to: customTo });
  }

  // Calendar grid: 0=Sun .. 6=Sat ; shift to Mon-first? Fresha-style shows Mon first — use locale en-GB Monday-start
  const calendar = useMemo(() => {
    const first = startOfMonth(cursor);
    // getDay() 0 Sun .. use (getDay()+6)%7 to get Mon=0
    const startOffset = (first.getDay() + 6) % 7;
    const total = daysInMonth(cursor);
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let day = 1; day <= total; day++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), day));
    return cells;
  }, [cursor]);

  const isClearable = value !== null;

  return (
    <div ref={ref} className="relative flex-1 overflow-visible">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left outline-none"
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-[#8A8377]" />
        <span className={`flex-1 truncate text-sm ${value?.date ? "text-[#1F1E1D]" : "text-[#8A8377]"}`}>{displayLabel()}</span>
        {isClearable ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear date filter"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onChange(null);
              }
            }}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#F7F3ED]"
          >
            <X className="h-3.5 w-3.5 text-[#8A8377]" />
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 top-[calc(100%+8px)] z-50 w-[520px] max-w-[min(520px,94vw)] overflow-hidden rounded-xl border border-[#E5DDD0] bg-white shadow-[0_8px_30px_rgba(16,24,40,0.12)]">
          <div className="grid md:grid-cols-[160px_1fr] gap-0">
            {/* Left: Today / Tomorrow */}
            <div className="border-b md:border-b-0 md:border-r border-[#F1EDE7] p-3 space-y-2 bg-[#FDF9F3]/50">
              <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-[#8A8377]">Quick pick</p>
              {[
                { date: today, label: "Today" },
                { date: tomorrow, label: "Tomorrow" },
              ].map(({ date, label }) => {
                const iso = toISODate(date);
                const isSelected = value?.date === iso;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setDate(iso)}
                    className={`flex w-full flex-col rounded-lg border px-3 py-3 text-left transition ${
                      isSelected ? "border-[#795831] bg-white shadow-sm" : "border-[#E5DDD0] bg-white hover:border-[#CCC6BD]"
                    }`}
                  >
                    <span className={`text-sm font-semibold ${isSelected ? "text-[#795831]" : "text-[#1F1E1D]"}`}>{label}</span>
                    <span className="text-xs text-[#8A8377]">
                      {date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setDate(null)}
                className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-[#4A4640] hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E5DDD0]"
              >
                Clear date
              </button>
            </div>

            {/* Right: Calendar */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                  aria-label="Previous month"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F7F3ED]"
                >
                  <ChevronLeft className="h-4 w-4 text-[#4A4640]" />
                </button>
                <p className="text-sm font-semibold text-[#1F1E1D]">{monthLabel(cursor)}</p>
                <button
                  type="button"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                  aria-label="Next month"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F7F3ED]"
                >
                  <ChevronRight className="h-4 w-4 text-[#4A4640]" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-1 text-center">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
                  <span key={w} className="py-1 text-[11px] font-medium text-[#8A8377]">
                    {w}
                  </span>
                ))}
                {calendar.map((cell, idx) => {
                  if (!cell) return <span key={`e-${idx}`} />;
                  const iso = toISODate(cell);
                  const isPast = cell < today;
                  const isSelected = selectedDate ? isSameDay(cell, selectedDate) : false;
                  const isTodayMark = isSameDay(cell, today);
                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={isPast}
                      onClick={() => setDate(iso)}
                      className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs transition mx-auto
                        ${isPast ? "text-[#C9C1B4] cursor-not-allowed" : "hover:bg-[#F7F3ED] text-[#1F1E1D]"}
                        ${isSelected ? "!bg-[#795831] !text-white" : ""}
                        ${!isSelected && isTodayMark ? "ring-1 ring-[#795831] ring-inset" : ""}
                      `}
                    >
                      {cell.getDate()}
                    </button>
                  );
                })}
              </div>

              {/* Time bands */}
              <div className="mt-5 border-t border-[#F1EDE7] pt-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#8A8377]">
                  <Clock className="h-3.5 w-3.5" /> Time
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {BANDS.map((b) => {
                    const isActive = band === b.id;
                    // Custom shows from/to, but button still active state matters
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBand(b.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          isActive ? "border-[#795831] bg-[#795831] text-white" : "border-[#E5DDD0] bg-white text-[#4A4640] hover:bg-[#F7F3ED]"
                        }`}
                      >
                        {b.label}
                        {b.hint ? <span className={`ml-1 ${isActive ? "text-white/80" : "text-[#8A8377]"}`}>{b.hint}</span> : null}
                      </button>
                    );
                  })}
                </div>

                {band === "custom" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <label className="flex-1">
                      <span className="sr-only">From</span>
                      <input
                        type="time"
                        value={customFrom}
                        onChange={(e) => setCustomFrom(e.target.value)}
                        onBlur={handleCustomTimeChange}
                        className="w-full rounded-md border border-[#E5DDD0] bg-white px-2 py-2 text-sm outline-none focus:border-[#795831] focus:ring-1 focus:ring-[#795831]"
                      />
                    </label>
                    <span className="text-xs text-[#8A8377]">to</span>
                    <label className="flex-1">
                      <span className="sr-only">To</span>
                      <input
                        type="time"
                        value={customTo}
                        onChange={(e) => setCustomTo(e.target.value)}
                        onBlur={handleCustomTimeChange}
                        className="w-full rounded-md border border-[#E5DDD0] bg-white px-2 py-2 text-sm outline-none focus:border-[#795831] focus:ring-1 focus:ring-[#795831]"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleCustomTimeChange}
                      className="rounded-md bg-[#795831] px-3 py-2 text-xs font-semibold text-white hover:bg-[#5F4426]"
                    >
                      Apply
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
