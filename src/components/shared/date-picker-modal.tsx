"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type DatePickerLabels = {
  title: string;
  month: string;
  year: string;
  cancel: string;
  ok: string;
  prevMonth: string;
  nextMonth: string;
};

const DEFAULT_LABELS: DatePickerLabels = {
  title: "Select date",
  month: "Month",
  year: "Year",
  cancel: "Cancel",
  ok: "OK",
  prevMonth: "Previous month",
  nextMonth: "Next month",
};

const DEFAULT_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DEFAULT_WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

type DatePickerModalProps = {
  open: boolean;
  onClose: () => void;
  value: Date | null;
  onSelect: (d: Date) => void;
  minDate?: Date | null;
  maxDate?: Date | null;
  /** 0 = Sunday first (image 8 default), 1 = Monday first. */
  firstDayOfWeek?: 0 | 1;
  monthLabels?: string[];
  weekdayLabels?: string[];
  labels?: Partial<DatePickerLabels>;
  className?: string;
};

/**
 * One calendar for the whole app — customer search, the booking wizard's
 * "pick a date further out" jump, the dashboard add-booking modal and the
 * admin ad forms all render this instead of a native <input type="date">,
 * whose look changes per browser and OS.
 *
 * Deliberately does not call useLocale(): the customer tree is wrapped in
 * LocaleProvider but /dashboard and /admin are not, so translations are
 * passed in as props instead.
 */
export function DatePickerModal({
  open,
  onClose,
  value,
  onSelect,
  minDate,
  maxDate,
  firstDayOfWeek = 0,
  monthLabels = DEFAULT_MONTHS,
  weekdayLabels = DEFAULT_WEEKDAYS,
  labels,
  className,
}: DatePickerModalProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const floor = useMemo(() => (minDate ? startOfDay(minDate) : today), [minDate, today]);
  const ceiling = useMemo(() => (maxDate ? startOfDay(maxDate) : null), [maxDate]);

  const [cursor, setCursor] = useState<Date>(() => startOfMonth(value ?? today));
  const [pending, setPending] = useState<Date | null>(value);

  // Re-seed every time the modal opens so it never shows a stale month or a
  // pending pick that was cancelled last time.
  useEffect(() => {
    if (!open) return;
    setPending(value);
    setCursor(startOfMonth(value ?? today));
  }, [open, value, today]);

  // Escape to dismiss + stop the page behind from scrolling.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const cells = useMemo(() => {
    const totalDays = new Date(year, month + 1, 0).getDate();
    const rawOffset = new Date(year, month, 1).getDay();
    const startOffset = (rawOffset - firstDayOfWeek + 7) % 7;
    const out: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) out.push(null);
    for (let day = 1; day <= totalDays; day++) out.push(new Date(year, month, day));
    return out;
  }, [year, month, firstDayOfWeek]);

  const orderedWeekdays = useMemo(() => {
    const list = [...weekdayLabels];
    return firstDayOfWeek === 1 ? [...list.slice(1), list[0]] : list;
  }, [weekdayLabels, firstDayOfWeek]);

  const years = useMemo(() => {
    const min = Math.min(today.getFullYear(), floor.getFullYear(), value ? value.getFullYear() : today.getFullYear());
    const max = Math.max(
      today.getFullYear() + 2,
      value ? value.getFullYear() : 0,
      ceiling ? ceiling.getFullYear() : 0,
    );
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }, [today, floor, ceiling, value]);

  const L = { ...DEFAULT_LABELS, ...labels };

  const shiftMonth = useCallback((delta: number) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }, []);

  function commit() {
    if (!pending) return;
    onSelect(pending);
    onClose();
  }

  if (!open) return null;

  const todayISO = toISODate(today);
  const floorISO = toISODate(floor);
  const ceilingISO = ceiling ? toISODate(ceiling) : null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={L.title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[88dvh] w-full overflow-y-auto overscroll-contain rounded-t-2xl border border-[#E5DDD0] bg-white p-4 shadow-2xl sm:max-w-sm sm:rounded-2xl sm:p-5 ${className ?? ""}`}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A8377]">{L.title}</p>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-1.5">
            <label className="min-w-0 flex-1">
              <span className="sr-only">{L.month}</span>
              <select
                aria-label={L.month}
                value={month}
                onChange={(e) => setCursor(new Date(year, Number(e.target.value), 1))}
                className="min-h-11 w-full truncate rounded-lg border border-[#E5DDD0] bg-white px-2 text-sm font-medium text-[#1F1E1D] outline-none focus:border-[#795831] sm:min-h-9"
              >
                {monthLabels.map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="w-[5.5rem] shrink-0">
              <span className="sr-only">{L.year}</span>
              <select
                aria-label={L.year}
                value={year}
                onChange={(e) => setCursor(new Date(Number(e.target.value), month, 1))}
                className="min-h-11 w-full rounded-lg border border-[#E5DDD0] bg-white px-2 text-sm font-medium text-[#1F1E1D] outline-none focus:border-[#795831] sm:min-h-9"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label={L.prevMonth}
              onClick={() => shiftMonth(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-[#4A4640] transition-colors hover:bg-[#F7F3ED] sm:h-9 sm:w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label={L.nextMonth}
              onClick={() => shiftMonth(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-[#4A4640] transition-colors hover:bg-[#F7F3ED] sm:h-9 sm:w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-y-1 text-center">
          {orderedWeekdays.map((w, i) => (
            <span key={`${w}-${i}`} className="text-[11px] font-semibold text-[#9A9184]">
              {w}
            </span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <span key={`empty-${i}`} />;
            const iso = toISODate(d);
            const isSelected = pending ? iso === toISODate(pending) : false;
            const isToday = iso === todayISO;
            return (
              <button
                key={iso}
                type="button"
                disabled={iso < floorISO || (ceilingISO !== null && iso > ceilingISO)}
                aria-pressed={isSelected}
                aria-current={isToday ? "date" : undefined}
                onClick={() => setPending(d)}
                className={`mx-auto flex min-h-11 min-w-11 items-center justify-center rounded-full text-sm transition-colors sm:min-h-9 sm:min-w-9 ${
                  isSelected
                    ? "bg-[#1F1B17] font-semibold text-white"
                    : isToday
                      ? "border border-[#9A7B4F] text-[#1F1E1D]"
                      : "text-[#1F1E1D] hover:bg-[#F7F3ED]"
                } disabled:cursor-not-allowed disabled:text-[#D9CFBE] disabled:hover:bg-transparent`}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
      onClick={(e) => {
        // stopPropagation first: this modal is often rendered inside another
        // overlay (e.g. the add-booking sheet) whose backdrop also closes on
        // click, and a click on our backdrop must not close that one too.
        e.stopPropagation();
        onClose();
      }}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#E5DDD0] px-4 text-sm font-semibold text-[#4A4640] transition-colors hover:bg-[#F7F3ED] sm:w-auto sm:border-0 sm:px-2"
          >
            {L.cancel}
          </button>
          <button
            type="button"
            disabled={!pending}
            onClick={commit}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#1F1B17] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 sm:w-auto"
          >
            {L.ok}
          </button>
        </div>
      </div>
    </div>
  );
}
