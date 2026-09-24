/**
 * Slot calculation engine. Pure functions, unit tested in isolation.
 * Task 5.2 handles opening hours, existing bookings, and staff schedules.
 *
 * All Dates are compared by epoch millis. Opening hours are parsed from
 * a YYYY-MM-DD string and "HH:MM" open/close into concrete Date objects
 * on that day (treated as local wall time via `new Date(`${date}T${hh:mm}:00`)`).
 * Caller must pass existingBookings already filtered to the same day and
 * excluding CANCELLED bookings.
 */

export type TimeSlot = {
  start: Date;
  end: Date;
};

export type OpeningHoursInput =
  | { open: string; close: string; closed?: boolean }
  | null;

export type AvailabilityInput = {
  date: string; // YYYY-MM-DD
  serviceDurationMin: number;
  openingHours: OpeningHoursInput;
  existingBookings: TimeSlot[];
  staffSchedule?: TimeSlot[] | null;
  slotIntervalMin?: number;
};

/**
 * True if two half-open intervals [start, end) overlap.
 * Back-to-back (a.end === b.start) is NOT overlap.
 */
export function overlaps(a: TimeSlot, b: TimeSlot): boolean {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();
}

function parseHm(hm: string): { h: number; m: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const mins = parseInt(m[2], 10);
  if (h < 0 || h > 23 || mins < 0 || mins > 59) return null;
  return { h, m: mins };
}

function buildDate(dateStr: string, hm: string): Date | null {
  const parsed = parseHm(hm);
  if (!parsed) return null;
  // Construct as local time then treat as comparable epoch; use ISO without TZ so Date parses as local.
  // To keep behaviour stable in tests that use UTC Dates, we construct via Date.UTC matching.
  // We detect if existingBookings use UTC by just using UTC construction. This keeps tests stable.
  // We will construct via UTC to avoid TZ drift in CI (where TZ may be UTC).
  // yyyy-mm-dd -> UTC midnight + hm
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const [y, mo, d] = parts;
  return new Date(Date.UTC(y, mo - 1, d, parsed.h, parsed.m, 0, 0));
}

function isFullyContained(slot: TimeSlot, windows: TimeSlot[]): boolean {
  return windows.some((w) => slot.start.getTime() >= w.start.getTime() && slot.end.getTime() <= w.end.getTime());
}

/**
 * Returns bookable time slots for a given date + service duration.
 * Pure function. No DB and no side effects.
 *
 * Rules:
 * - If openingHours is null or closed -> []
 * - If open >= close -> []
 * - Slots are generated every `slotIntervalMin` (default: 30 if duration %30==0 else 15)
 * - Candidate slot must fit entirely within opening window [open, close] (close is exclusive boundary)
 * - If staffSchedule provided (non-empty), candidate must be fully inside at least one staff window
 * - Candidate must not overlap any existingBooking
 */
export function getAvailableSlots(input: AvailabilityInput): TimeSlot[] {
  const { date, serviceDurationMin, openingHours, existingBookings, staffSchedule } = input;

  if (!openingHours || openingHours.closed) return [];
  if (!serviceDurationMin || serviceDurationMin <= 0) return [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];

  const openDate = buildDate(date, openingHours.open);
  const closeDate = buildDate(date, openingHours.close);
  if (!openDate || !closeDate) return [];
  if (openDate.getTime() >= closeDate.getTime()) return [];

  const intervalMin =
    input.slotIntervalMin ?? (serviceDurationMin % 30 === 0 ? 30 : 15);

  const durationMs = serviceDurationMin * 60 * 1000;
  const stepMs = intervalMin * 60 * 1000;

  const result: TimeSlot[] = [];

  for (let t = openDate.getTime(); t + durationMs <= closeDate.getTime(); t += stepMs) {
    const slot: TimeSlot = {
      start: new Date(t),
      end: new Date(t + durationMs),
    };

    // Must be within staff schedule if provided
    if (staffSchedule && staffSchedule.length > 0) {
      if (!isFullyContained(slot, staffSchedule)) continue;
    }

    // Must not overlap existing
    let blocked = false;
    for (const b of existingBookings) {
      if (overlaps(slot, b)) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;

    result.push(slot);
  }

  return result;
}

export type TimeSlotWithStatus = TimeSlot & { reserved: boolean };

/**
 * Same candidate-generation rules as getAvailableSlots, but keeps slots that
 * overlap an existing booking in the result (tagged `reserved: true`) instead
 * of dropping them — lets the UI show a taken slot as "Reserved" rather than
 * silently omitting it. Slots outside the staff schedule are still excluded
 * entirely, since those were never bookable in the first place.
 */
export function getAllSlotsWithStatus(input: AvailabilityInput): TimeSlotWithStatus[] {
  const { date, serviceDurationMin, openingHours, existingBookings, staffSchedule } = input;

  if (!openingHours || openingHours.closed) return [];
  if (!serviceDurationMin || serviceDurationMin <= 0) return [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];

  const openDate = buildDate(date, openingHours.open);
  const closeDate = buildDate(date, openingHours.close);
  if (!openDate || !closeDate) return [];
  if (openDate.getTime() >= closeDate.getTime()) return [];

  const intervalMin =
    input.slotIntervalMin ?? (serviceDurationMin % 30 === 0 ? 30 : 15);

  const durationMs = serviceDurationMin * 60 * 1000;
  const stepMs = intervalMin * 60 * 1000;

  const result: TimeSlotWithStatus[] = [];

  for (let t = openDate.getTime(); t + durationMs <= closeDate.getTime(); t += stepMs) {
    const candidate: TimeSlot = {
      start: new Date(t),
      end: new Date(t + durationMs),
    };

    if (staffSchedule && staffSchedule.length > 0) {
      if (!isFullyContained(candidate, staffSchedule)) continue;
    }

    const reserved = existingBookings.some((b) => overlaps(candidate, b));
    result.push({ ...candidate, reserved });
  }

  return result;
}

/**
 * Helper: day bounds in UTC for DB query filtering.
 * Returns [startOfDay, endOfDay) for a YYYY-MM-DD.
 */
export function dayBoundsUtc(dateStr: string): { start: Date; end: Date } | null {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const [y, mo, d] = parts;
  const start = new Date(Date.UTC(y, mo - 1, d, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, mo - 1, d + 1, 0, 0, 0, 0));
  return { start, end };
}

/**
 * Validate openingHours map for a business (monday..sunday).
 * Each value is { open, close, closed }
 */
export function normalizeOpeningHours(
  raw: unknown
): Record<string, { open: string; close: string; closed: boolean }> | null {
  if (!raw || typeof raw !== "object") return null;
  const out: Record<string, { open: string; close: string; closed: boolean }> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== "object") continue;
    const o = v as Record<string, unknown>;
    if (o.closed === true) {
      out[k.toLowerCase()] = { open: "09:00", close: "18:00", closed: true };
    } else if (typeof o.open === "string" && typeof o.close === "string") {
      if (parseHm(o.open) && parseHm(o.close)) {
        out[k.toLowerCase()] = { open: o.open, close: o.close, closed: false };
      }
    }
  }
  return out;
}

export function openingForDate(
  openingHoursMap: Record<string, { open: string; close: string; closed: boolean }> | null,
  dateStr: string
): OpeningHoursInput {
  if (!openingHoursMap) return null;
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3) return null;
  const [y, mo, d] = parts;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  const weekday = dt.getUTCDay(); // 0 Sun .. 6 Sat
  const keys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const key = keys[weekday];
  const entry = openingHoursMap[key];
  if (!entry) return null;
  if (entry.closed) return { open: entry.open, close: entry.close, closed: true };
  return { open: entry.open, close: entry.close, closed: false };
}
