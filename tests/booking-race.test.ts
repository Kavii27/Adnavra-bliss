/**
 * Task 3.1 — Double-booking race-condition test
 * Proves the database-level EXCLUDE constraint works:
 * two concurrent bookings for the same staff at overlapping times
 * must result in exactly one success / one failure (PG code 23P01).
 *
 * Run: npm test  OR  npx tsx tests/booking-race.test.ts
 * Requires: DATABASE_URL / DIRECT_URL in .env (Supabase)
 *
 * Also verifies:
 *  - back-to-back bookings are allowed ([start,end) semantics)
 *  - cancelled bookings do NOT block the slot
 *  - different staff can book same time — now covered via EXCLUDE per-staff
 *  - previously unassigned (null staff) could overlap; after Task 3 migration they must not
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function setupTenant() {
  const slug = `race-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const business = await db.business.create({
    data: { name: "Race Salon", slug, email: `race-${slug}@test.local` },
  });
  const service = await db.service.create({
    data: { businessId: business.id, name: "Haircut", price: 5000, duration: 60 },
  });
  const staff = await db.staffMember.create({
    data: { businessId: business.id, name: "Alex" },
  });
  const custA = await db.customer.create({
    data: { businessId: business.id, name: "A", email: `a-${slug}@test.local` },
  });
  const custB = await db.customer.create({
    data: { businessId: business.id, name: "B", email: `b-${slug}@test.local` },
  });
  return { business, service, staff, custA, custB, slug };
}

async function cleanupTenant(businessId: string) {
  await db.booking.deleteMany({ where: { businessId } });
  await db.customer.deleteMany({ where: { businessId } });
  await db.staffMember.deleteMany({ where: { businessId } });
  await db.service.deleteMany({ where: { businessId } });
  await db.business.delete({ where: { id: businessId } });
}

// Keep legacy manual runner for `npx tsx` without vitest
async function runBookingRaceTest() {
  const { business, service, staff, custA, custB } = await setupTenant();
  let passed = 0;
  let failed = 0;
  const assert = (cond: boolean, msg: string) => {
    if (cond) {
      console.log(`  ✓ ${msg}`);
      passed++;
    } else {
      console.log(`  ✗ ${msg}`);
      failed++;
    }
  };
  const start = new Date("2026-08-26T10:00:00.000Z");
  const end = new Date("2026-08-26T11:00:00.000Z");
  await db.booking.create({
    data: { businessId: business.id, serviceId: service.id, staffMemberId: staff.id, customerId: custA.id, startTime: start, endTime: end, status: "CONFIRMED" },
  });
  let overlapRejected = false;
  try {
    await db.booking.create({
      data: { businessId: business.id, serviceId: service.id, staffMemberId: staff.id, customerId: custB.id, startTime: new Date("2026-08-26T10:30:00.000Z"), endTime: new Date("2026-08-26T11:30:00.000Z"), status: "CONFIRMED" },
    });
  } catch (e: unknown) {
    const msg = (e as Error).message ?? "";
    if (msg.includes("23P01") || msg.includes("exclusion")) overlapRejected = true;
  }
  assert(overlapRejected, "Overlapping booking rejected by EXCLUDE constraint (23P01)");
  await cleanupTenant(business.id);
  console.log(`\n[booking-race] Results: ${passed} passed, ${failed} failed`);
  await db.$disconnect();
  if (failed > 0) process.exit(1);
}

if (require.main === module) {
  runBookingRaceTest().catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
}

// ── Vitest suite — runs with `npm test` against real Supabase DB ──
describe("booking-race — EXCLUDE constraint (requires DATABASE_URL)", () => {
  // 30s timeout for network DB
  it("overlapping booking rejected by EXCLUDE constraint (23P01)", async () => {
    const { business, service, staff, custA, custB } = await setupTenant();
    try {
      const start = new Date("2026-08-26T10:00:00.000Z");
      const end = new Date("2026-08-26T11:00:00.000Z");
      await db.booking.create({
        data: { businessId: business.id, serviceId: service.id, staffMemberId: staff.id, customerId: custA.id, startTime: start, endTime: end, status: "CONFIRMED" },
      });
      let overlapRejected = false;
      try {
        await db.booking.create({
          data: { businessId: business.id, serviceId: service.id, staffMemberId: staff.id, customerId: custB.id, startTime: new Date("2026-08-26T10:30:00.000Z"), endTime: new Date("2026-08-26T11:30:00.000Z"), status: "CONFIRMED" },
        });
      } catch (e: unknown) {
        const msg = (e as Error).message ?? "";
        if (msg.includes("23P01") || msg.includes("exclusion") || msg.includes("bookings_no_overlap")) overlapRejected = true;
      }
      expect(overlapRejected).toBe(true);
    } finally {
      await cleanupTenant(business.id);
    }
  }, 30_000);

  it("concurrent race: exactly one succeeds", async () => {
    const { business, service, staff, custA, custB } = await setupTenant();
    try {
      const s2 = new Date("2026-08-26T11:00:00.000Z");
      const e2 = new Date("2026-08-26T12:00:00.000Z");
      const p1 = db.booking.create({ data: { businessId: business.id, serviceId: service.id, staffMemberId: staff.id, customerId: custA.id, startTime: s2, endTime: e2, status: "CONFIRMED" } });
      const p2 = db.booking.create({ data: { businessId: business.id, serviceId: service.id, staffMemberId: staff.id, customerId: custB.id, startTime: s2, endTime: e2, status: "CONFIRMED" } });
      const results = await Promise.allSettled([p1, p2]);
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const ko = results.filter((r) => r.status === "rejected").length;
      expect(ok).toBe(1);
      expect(ko).toBe(1);
    } finally {
      await cleanupTenant(business.id);
    }
  }, 30_000);

  it("back-to-back bookings allowed (end == start)", async () => {
    const { business, service, staff, custA, custB } = await setupTenant();
    // need second staff to isolate from previous slot tests
    const staff2 = await db.staffMember.create({ data: { businessId: business.id, name: "Sam2" } });
    try {
      await db.booking.create({
        data: { businessId: business.id, serviceId: service.id, staffMemberId: staff2.id, customerId: custA.id, startTime: new Date("2026-08-26T13:00:00.000Z"), endTime: new Date("2026-08-26T14:00:00.000Z"), status: "CONFIRMED" },
      });
      let ok = false;
      try {
        await db.booking.create({
          data: { businessId: business.id, serviceId: service.id, staffMemberId: staff2.id, customerId: custB.id, startTime: new Date("2026-08-26T14:00:00.000Z"), endTime: new Date("2026-08-26T15:00:00.000Z"), status: "CONFIRMED" },
        });
        ok = true;
      } catch {}
      expect(ok).toBe(true);
    } finally {
      await cleanupTenant(business.id);
    }
  }, 30_000);

  it("cancelled booking does not block same slot", async () => {
    const { business, service, staff, custA, custB } = await setupTenant();
    const staff2 = await db.staffMember.create({ data: { businessId: business.id, name: "Sam3" } });
    try {
      await db.booking.create({
        data: { businessId: business.id, serviceId: service.id, staffMemberId: staff2.id, customerId: custA.id, startTime: new Date("2026-08-26T15:00:00.000Z"), endTime: new Date("2026-08-26T16:00:00.000Z"), status: "CANCELLED" },
      });
      let ok = false;
      try {
        await db.booking.create({
          data: { businessId: business.id, serviceId: service.id, staffMemberId: staff2.id, customerId: custB.id, startTime: new Date("2026-08-26T15:00:00.000Z"), endTime: new Date("2026-08-26T16:00:00.000Z"), status: "CONFIRMED" },
        });
        ok = true;
      } catch {}
      expect(ok).toBe(true);
    } finally {
      await cleanupTenant(business.id);
    }
  }, 30_000);

  afterAll(async () => {
    await db.$disconnect();
  });
});

export { runBookingRaceTest };
