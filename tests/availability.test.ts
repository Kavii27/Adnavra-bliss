/**
 * Task 5.2 — Availability engine unit tests (pure, no DB)
 * Covers: back-to-back, boundary, fully-booked, closed day, staff schedule.
 * Run: npm test  OR  npx tsx tests/availability.test.ts
 */
import { describe, it, expect } from "vitest";
import { getAvailableSlots, overlaps } from "@/lib/availability";

function slot(startIso: string, endIso: string) {
  return { start: new Date(startIso), end: new Date(endIso) };
}

// Kept for `npx tsx` manual run — also exported for backwards compat
function run() {
  console.log("[availability] unit tests (legacy run())...");
  // quick smoke — vitest suite below is authoritative
  if (!overlaps(slot("2026-08-01T10:00:00Z", "2026-08-01T11:00:00Z"), slot("2026-08-01T11:00:00Z", "2026-08-01T12:00:00Z"))) {
    console.log("  ✓ back-to-back does not overlap");
  }
  console.log("[availability] legacy run() done — use `npm test` for full suite\n");
}

if (require.main === module) run();

describe("availability — overlaps", () => {
  it("back-to-back does not overlap", () => {
    expect(overlaps(slot("2026-08-01T10:00:00Z", "2026-08-01T11:00:00Z"), slot("2026-08-01T11:00:00Z", "2026-08-01T12:00:00Z"))).toBe(false);
  });
  it("overlapping detected", () => {
    expect(overlaps(slot("2026-08-01T10:00:00Z", "2026-08-01T11:00:00Z"), slot("2026-08-01T10:30:00Z", "2026-08-01T11:30:00Z"))).toBe(true);
  });
  it("containment overlaps", () => {
    expect(overlaps(slot("2026-08-01T10:00:00Z", "2026-08-01T12:00:00Z"), slot("2026-08-01T10:30:00Z", "2026-08-01T11:00:00Z"))).toBe(true);
  });
});

describe("availability — getAvailableSlots", () => {
  it("60min in 09-17 unbooked -> 15 slots, first 09:00 last ends 17:00", () => {
    const slots = getAvailableSlots({
      date: "2026-08-03",
      serviceDurationMin: 60,
      openingHours: { open: "09:00", close: "17:00" },
      existingBookings: [],
    });
    expect(slots.length).toBe(15);
    expect(slots[0].start.toISOString()).toBe("2026-08-03T09:00:00.000Z");
    expect(slots[slots.length - 1].end.toISOString()).toBe("2026-08-03T17:00:00.000Z");
  });

  it("30min 09-10 -> 2 slots", () => {
    const slots = getAvailableSlots({
      date: "2026-08-03",
      serviceDurationMin: 30,
      openingHours: { open: "09:00", close: "10:00" },
      existingBookings: [],
    });
    expect(slots.length).toBe(2);
  });

  it("60min 09-10 only 09:00 fits", () => {
    const slots = getAvailableSlots({
      date: "2026-08-03",
      serviceDurationMin: 60,
      openingHours: { open: "09:00", close: "10:00" },
      existingBookings: [],
    });
    expect(slots.length).toBe(1);
    expect(slots[0].start.toISOString()).toBe("2026-08-03T09:00:00.000Z");
  });

  it("fully booked day returns 0 slots", () => {
    const base = getAvailableSlots({
      date: "2026-08-03",
      serviceDurationMin: 60,
      openingHours: { open: "09:00", close: "17:00" },
      existingBookings: [],
    });
    const booked = base.map((s) => ({ start: s.start, end: s.end }));
    const slotsFull = getAvailableSlots({
      date: "2026-08-03",
      serviceDurationMin: 60,
      openingHours: { open: "09:00", close: "17:00" },
      existingBookings: booked,
    });
    expect(slotsFull.length).toBe(0);
  });

  it("one booking 10-11 blocks overlapping slots -> 2 free (09:00 and 11:00)", () => {
    const slots = getAvailableSlots({
      date: "2026-08-03",
      serviceDurationMin: 60,
      openingHours: { open: "09:00", close: "12:00" },
      existingBookings: [slot("2026-08-03T10:00:00.000Z", "2026-08-03T11:00:00.000Z")],
    });
    expect(slots.length).toBe(2);
    expect(slots[0].start.toISOString()).toBe("2026-08-03T09:00:00.000Z");
    expect(slots[1].start.toISOString()).toBe("2026-08-03T11:00:00.000Z");
  });

  it("closed day returns 0", () => {
    const slots = getAvailableSlots({
      date: "2026-08-03",
      serviceDurationMin: 30,
      openingHours: { open: "09:00", close: "17:00", closed: true },
      existingBookings: [],
    });
    expect(slots.length).toBe(0);
  });

  it("null openingHours returns 0", () => {
    const slots = getAvailableSlots({
      date: "2026-08-03",
      serviceDurationMin: 30,
      openingHours: null,
      existingBookings: [],
    });
    expect(slots.length).toBe(0);
  });

  it("staff window 10-12 -> 4 slots", () => {
    const slots = getAvailableSlots({
      date: "2026-08-03",
      serviceDurationMin: 30,
      openingHours: { open: "09:00", close: "15:00" },
      existingBookings: [],
      staffSchedule: [slot("2026-08-03T10:00:00.000Z", "2026-08-03T12:00:00.000Z")],
    });
    expect(slots.length).toBe(4);
    expect(slots[0].start.toISOString()).toBe("2026-08-03T10:00:00.000Z");
  });

  it("45min 09-11 with 15 interval -> 6 slots", () => {
    const slots = getAvailableSlots({
      date: "2026-08-03",
      serviceDurationMin: 45,
      openingHours: { open: "09:00", close: "11:00" },
      existingBookings: [],
    });
    expect(slots.length).toBe(6);
  });
});

export { run };
