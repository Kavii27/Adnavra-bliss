import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAllSlotsWithStatus, dayBoundsUtc, openingForDate, normalizeOpeningHours } from "@/lib/availability";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const querySchema = z.object({
  businessId: z.string().cuid(),
  serviceId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  staffMemberId: z.string().cuid().optional(),
  // Phase 4: multi-service groups run back-to-back — the wizard passes the
  // summed duration so slots fit the WHOLE group, not just the first service.
  totalDurationMin: z.coerce.number().int().min(5).max(1440).optional(),
});

/**
 * GET /api/availability?businessId=&serviceId=&date=YYYY-MM-DD&staffMemberId=
 * Public, but rate-limiting not critical (read-only). Validates inputs, scopes by businessId.
 * Returns { slots: {start,end}[], openingHours, serviceDuration }
 */
export async function GET(request: NextRequest) {
  // Rate limit public slot enumeration to prevent scraping/abuse
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
  const rl = await rateLimit(`availability:${ip}`, { limit: 60, windowMs: 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 60) });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    businessId: searchParams.get("businessId"),
    serviceId: searchParams.get("serviceId"),
    date: searchParams.get("date"),
    staffMemberId: searchParams.get("staffMemberId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { businessId, serviceId, date, staffMemberId, totalDurationMin } = parsed.data;

  const business = await db.business.findUnique({ where: { id: businessId }, select: { openingHours: true } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const service = await db.service.findFirst({ where: { id: serviceId, businessId, isActive: true } });
  if (!service) return NextResponse.json({ error: "Service not found or inactive" }, { status: 404 });

  if (staffMemberId) {
    const staff = await db.staffMember.findFirst({ where: { id: staffMemberId, businessId } });
    if (!staff) return NextResponse.json({ error: "Staff not found for this business" }, { status: 404 });
  }

  const bounds = dayBoundsUtc(date);
  if (!bounds) return NextResponse.json({ error: "Invalid date" }, { status: 400 });

  // Existing bookings for that day (exclude CANCELLED), always scoped by businessId
  const where: Record<string, unknown> = {
    businessId,
    status: { not: "CANCELLED" },
    startTime: { gte: bounds.start, lt: bounds.end },
  };
  if (staffMemberId) {
    (where as Record<string, unknown>).staffMemberId = staffMemberId;
  }

  const bookings = await db.booking.findMany({
    where: where as never,
    select: { startTime: true, endTime: true },
    orderBy: { startTime: "asc" },
  });

  const existingSlots = bookings.map((b) => ({ start: b.startTime, end: b.endTime }));

  const map = normalizeOpeningHours(business.openingHours as never);
  const opening = openingForDate(map, date);

  // If no openingHours configured, assume 09:00-18:00 closed Sunday
  const effectiveOpening = opening ?? ((): ReturnType<typeof openingForDate> => {
    const parts = date.split("-").map(Number);
    const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    const wd = d.getUTCDay();
    if (wd === 0) return { open: "09:00", close: "18:00", closed: true };
    return { open: "09:00", close: "18:00", closed: false };
  })();

  // Includes reserved (already-booked) slots tagged `reserved: true` so the UI can
  // show them as unavailable instead of just silently omitting them.
  // totalDurationMin (multi-service group span) wins over the single service duration.
  const effectiveDuration = totalDurationMin ?? service.duration;
  const slots = getAllSlotsWithStatus({
    date,
    serviceDurationMin: effectiveDuration,
    openingHours: effectiveOpening,
    existingBookings: existingSlots,
  });

  return NextResponse.json({
    data: {
      slots: slots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString(), reserved: s.reserved })),
      openingHours: effectiveOpening,
      service: { id: service.id, name: service.name, duration: effectiveDuration, price: service.price },
    },
  });
}
