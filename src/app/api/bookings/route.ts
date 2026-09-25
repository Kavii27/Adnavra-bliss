import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createBookingSchema } from "@/schemas/booking";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { openingForDate, normalizeOpeningHours } from "@/lib/availability";
import { auditLog } from "@/lib/audit";
import { randomInt } from "crypto";

function getClientIp(request: NextRequest): string {
  const f = request.headers.get("x-forwarded-for");
  if (f) return f.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function genReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[randomInt(chars.length)];
  return `ADN-${s}`;
}

function toDateOnlyUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * GET /api/bookings?businessId=...&page=1&limit=20&status=...
 * - Requires auth (OWNER/STAFF/ADMIN)
 * - Staff cannot fetch other business's bookings (businessId from session wins)
 * - Paginated, never unbounded
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as unknown as { role: string }).role;
  const sessionBusinessId = (session.user as unknown as { businessId: string | null }).businessId;

  const allowed = ["OWNER", "STAFF", "ADMIN"];
  if (!allowed.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const requestedBusinessId = searchParams.get("businessId");
  const status = searchParams.get("status");
  const date = searchParams.get("date"); // optional YYYY-MM-DD filter for calendar
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const skip = (page - 1) * limit;

  // Ownership check: non-ADMIN must only query their own business
  let businessId: string | null = null;
  if (role === "ADMIN") {
    if (!requestedBusinessId) {
      return NextResponse.json({ error: "businessId query is required for admin" }, { status: 400 });
    }
    businessId = requestedBusinessId;
  } else {
    // OWNER/STAFF: ignore client's businessId and use the session value to prevent Salon A from reading Salon B
    if (!sessionBusinessId) {
      return NextResponse.json({ error: "No business linked to account" }, { status: 400 });
    }
    if (requestedBusinessId && requestedBusinessId !== sessionBusinessId) {
      return NextResponse.json({ error: "Forbidden: cannot access another business's bookings" }, { status: 403 });
    }
    businessId = sessionBusinessId;
  }

  const where: Record<string, unknown> = { businessId: businessId! };
  if (status) (where as Record<string, unknown>).status = status;
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const parts = date.split("-").map(Number);
    const start = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0));
    const end = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + 1, 0, 0, 0));
    (where as Record<string, unknown>).startTime = { gte: start, lt: end };
  }

  const [data, total] = await Promise.all([
    db.booking.findMany({
      where: where as never,
      orderBy: { startTime: "desc" },
      skip,
      take: limit,
      include: { service: true, customer: true, staffMember: true },
    }),
    db.booking.count({ where: where as never }),
  ]);

  return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

/**
 * POST /api/bookings: public, guest-friendly booking creation (Phase 4)
 * - NO auth requirement — name + contact are required, email is optional, no account needed.
 * - Staff/owner manual entry (walk-ins) goes through this same route but is
 *   detected via an authenticated OWNER/STAFF/ADMIN session when present
 *   (used for audit attribution + business scoping).
 * - Accepts multiple services (serviceIds) — creates one Booking row per
 *   service with sequential back-to-back windows sharing one groupId +
 *   reference, starting as PENDING for salon approval.
 * - Validates with Zod before DB, rate-limited
 * - Fully checks opening hours, slot boundaries, and overlapping bookings
 * - Uses business-level DB EXCLUDE constraint as a race-condition safety net
 * - Customer is find-or-created scoped to businessId
 */
export async function POST(request: NextRequest) {
  // Public rate limit: 10 bookings per IP per 15 min
  const ip = getClientIp(request);
  const rl = await rateLimit(`booking-create:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many booking attempts. Please try again later." },
      { status: 429, headers: rateLimitHeaders(rl, 10) },
    );
  }

  // No auth requirement — this is now a public, guest-friendly endpoint.
  // Staff/owner manual entry (walk-ins) still goes through this same route but is
  // detected via an authenticated OWNER/STAFF/ADMIN session when present.
  const session = await auth().catch(() => null);
  const sessionRole = (session?.user as unknown as { role: string } | undefined)?.role ?? null;
  const sessionUserId = (session?.user as unknown as { id: string } | undefined)?.id ?? null;
  const sessionBusinessId = (session?.user as unknown as { businessId: string | null } | undefined)?.businessId ?? null;
  const isStaffSession = sessionRole === "OWNER" || sessionRole === "STAFF" || sessionRole === "ADMIN";

  const body = await request.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400, headers: rateLimitHeaders(rl, 10) });
  }

  // Normalize: accept either serviceIds[] (new) or legacy single serviceId
  const rawIds = parsed.data.serviceIds ?? (parsed.data.serviceId ? [parsed.data.serviceId] : []);
  // De-dupe while preserving the customer's chosen order
  const serviceIds = [...new Set(rawIds)];
  if (serviceIds.length === 0 || serviceIds.length > 10) {
    return NextResponse.json({ error: "Select at least one treatment" }, { status: 400, headers: rateLimitHeaders(rl, 10) });
  }

  const { businessId, staffMemberId, startAt, notes, customerName, customerPhone } = parsed.data;
  const customerEmail = parsed.data.customerEmail || null;

  if (isStaffSession && (sessionRole === "OWNER" || sessionRole === "STAFF")) {
    if (!sessionBusinessId) return NextResponse.json({ error: "No business linked to account" }, { status: 400, headers: rateLimitHeaders(rl, 10) });
    if (businessId !== sessionBusinessId) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: rateLimitHeaders(rl, 10) });
  }

  const business = await db.business.findUnique({ where: { id: businessId }, select: { id: true, openingHours: true } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404, headers: rateLimitHeaders(rl, 10) });

  const services = await db.service.findMany({ where: { id: { in: serviceIds }, businessId, isActive: true } });
  if (services.length !== serviceIds.length) {
    return NextResponse.json({ error: "One or more selected services are unavailable" }, { status: 404, headers: rateLimitHeaders(rl, 10) });
  }
  // Preserve the customer's chosen order (service picking order matters for sequencing)
  const orderedServices = serviceIds.map((id) => services.find((s) => s.id === id)!);

  if (staffMemberId) {
    const staff = await db.staffMember.findFirst({ where: { id: staffMemberId, businessId } });
    if (!staff) return NextResponse.json({ error: "Staff not found for this business" }, { status: 400, headers: rateLimitHeaders(rl, 10) });
  }

  const firstStart = new Date(startAt);
  if (Number.isNaN(firstStart.getTime())) return NextResponse.json({ error: "Invalid start time" }, { status: 400, headers: rateLimitHeaders(rl, 10) });

  // Build sequential [start,end) windows, one per service, back-to-back.
  const windows: { service: (typeof orderedServices)[number]; startTime: Date; endTime: Date }[] = [];
  let cursor = firstStart;
  for (const svc of orderedServices) {
    const end = new Date(cursor.getTime() + svc.duration * 60 * 1000);
    windows.push({ service: svc, startTime: cursor, endTime: end });
    cursor = end;
  }
  const groupStart = windows[0].startTime;
  const groupEnd = windows[windows.length - 1].endTime;

  // Opening-hours check against the FULL group span (not just the first service)
  const dateStr = toDateOnlyUtc(groupStart);
  const map = normalizeOpeningHours(business.openingHours as never);
  const opening = openingForDate(map, dateStr);
  if (opening) {
    if (opening.closed) return NextResponse.json({ error: "Business is closed on this day" }, { status: 409, headers: rateLimitHeaders(rl, 10) });
    const openParts = opening.open.split(":").map(Number);
    const closeParts = opening.close.split(":").map(Number);
    const ymd = dateStr.split("-").map(Number);
    const openDate = new Date(Date.UTC(ymd[0], ymd[1] - 1, ymd[2], openParts[0], openParts[1]));
    const closeDate = new Date(Date.UTC(ymd[0], ymd[1] - 1, ymd[2], closeParts[0], closeParts[1]));
    if (groupStart.getTime() < openDate.getTime() || groupEnd.getTime() > closeDate.getTime()) {
      return NextResponse.json({ error: `Slot must be within opening hours ${opening.open}–${opening.close}` }, { status: 409, headers: rateLimitHeaders(rl, 10) });
    }
  }

  // Overlap check across the WHOLE group span — no double booking.
  // Each individual row is additionally protected by the DB EXCLUDE constraint.
  const overlapWhere: Record<string, unknown> = {
    businessId, status: { not: "CANCELLED" },
    startTime: { lt: groupEnd }, endTime: { gt: groupStart },
  };
  if (staffMemberId) (overlapWhere as Record<string, unknown>).staffMemberId = staffMemberId;
  const overlapping = await db.booking.findFirst({ where: overlapWhere as never, select: { id: true } });
  if (overlapping) {
    return NextResponse.json({ error: "That time is already booked. Please pick another time." }, { status: 409, headers: rateLimitHeaders(rl, 10) });
  }

  const { randomUUID } = await import("crypto");
  const groupId = serviceIds.length > 1 ? randomUUID() : randomUUID();
  const groupTotal = orderedServices.reduce((sum, s) => sum + s.price, 0);
  const reference = genReference(); // one reference shared by the whole group

  try {
    const result = await db.$transaction(async (tx) => {
      let customer = sessionUserId
        ? await tx.customer.findFirst({ where: { businessId, userId: sessionUserId } })
        : null;
      if (!customer && customerPhone) customer = await tx.customer.findFirst({ where: { businessId, phone: customerPhone } });
      if (!customer && customerEmail) customer = await tx.customer.findFirst({ where: { businessId, email: customerEmail } });
      if (!customer) {
        customer = await tx.customer.create({
          data: { businessId, name: customerName, email: customerEmail, phone: customerPhone, ...(sessionUserId ? { userId: sessionUserId } : {}) } as never,
        });
      }

      const bookings = [];
      for (const w of windows) {
        bookings.push(
          await tx.booking.create({
            data: {
              businessId, serviceId: w.service.id, staffMemberId: staffMemberId ?? null,
              customerId: customer.id, startTime: w.startTime, endTime: w.endTime,
              status: "PENDING", reference, groupId, groupTotal, notes: notes ?? null,
            },
          }),
        );
      }
      return { bookings, customer };
    });

    await auditLog({
      action: "booking.create", userId: sessionUserId ?? null, businessId, targetType: "Booking",
      targetId: result.bookings[0].id,
      metadata: { serviceIds, reference, groupId, staffMemberId: staffMemberId ?? null, createdByRole: sessionRole ?? "GUEST" },
      ip,
    });

    // Phase 4.5: notify the salon owner a booking is awaiting approval (best-effort, never blocks)
    try {
      const { notifyOwnerOfNewBooking } = await import("@/lib/notify");
      await notifyOwnerOfNewBooking({ businessId, reference, groupId });
    } catch (e) {
      console.error("[booking notify]", e instanceof Error ? e.message : e);
    }

    return NextResponse.json(
      { data: result.bookings, customer: result.customer, message: "Booking request sent — the salon will confirm shortly.", reference, groupId },
      { status: 201, headers: rateLimitHeaders(rl, 10) },
    );
  } catch (e: unknown) {
    const msg = (e as Error).message ?? "";
    if (msg.includes("23P01") || msg.includes("exclusion") || msg.includes("bookings_no_overlap")) {
      return NextResponse.json({ error: "That time was just booked by someone else. Please pick another time." }, { status: 409, headers: rateLimitHeaders(rl, 10) });
    }
    console.error("[bookings POST] error:", msg);
    return NextResponse.json({ error: "Unable to create booking. Please try again." }, { status: 500, headers: rateLimitHeaders(rl, 10) });
  }
}
