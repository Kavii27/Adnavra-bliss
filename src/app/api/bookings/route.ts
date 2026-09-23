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
 * POST /api/bookings: authenticated booking creation (Step 4)
 * - Requires a session. Unauthenticated requests get 401 { error: "auth_required" }.
 * - CUSTOMER: self-booking. Identity is derived from the session (name backfilled,
 *   phone optional). This is the only public booking path — guest checkout is removed.
 * - OWNER/STAFF/ADMIN: manual entry (walk-in / phone booking from the dashboard,
 *   e.g. Step 2's "Add booking" modal). Customer details come from the request
 *   payload (name + phone required); the staff session is NEVER reused as the
 *   customer identity, and OWNER/STAFF are scoped to their own businessId.
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

  // Step 4: require an account before a booking is confirmed.
  // Auth is checked before input validation so unauthenticated callers always
  // get 401 (not a 400/409 that leaks whether a slot is taken).
  const session = await auth().catch(() => null);
  const sessionRole = (session?.user as unknown as { role: string } | undefined)?.role ?? null;
  const sessionUserId = (session?.user as unknown as { id: string } | undefined)?.id ?? null;
  const sessionBusinessId = (session?.user as unknown as { businessId: string | null } | undefined)?.businessId ?? null;
  if (!session?.user || !sessionRole) {
    return NextResponse.json({ error: "auth_required" }, { status: 401, headers: rateLimitHeaders(rl, 10) });
  }
  const allowedRoles = ["CUSTOMER", "OWNER", "STAFF", "ADMIN"];
  if (!allowedRoles.includes(sessionRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: rateLimitHeaders(rl, 10) });
  }
  const isCustomerSession = sessionRole === "CUSTOMER" && !!sessionUserId;
  const isStaffSession = sessionRole === "OWNER" || sessionRole === "STAFF" || sessionRole === "ADMIN";

  const body = await request.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400, headers: rateLimitHeaders(rl, 10) });
  }

  const { businessId, serviceId, staffMemberId, startAt, notes } = parsed.data;
  let customerName: string | undefined | null = parsed.data.customerName;
  let customerEmail: string | null | undefined = parsed.data.customerEmail;
  let customerPhone: string | null | undefined = parsed.data.customerPhone;

  // Session-aware backfill for authenticated CUSTOMER bookings (Task 7.6)
  // Guest checkout is removed (Step 4): unauthenticated requests were already
  // rejected with 401 above, so this block only backfills CUSTOMER sessions.
  // Staff sessions must NEVER backfill — walk-in details come from the payload.
  const sessionUserEmail = session?.user?.email ?? null;
  const sessionUserName = session?.user?.name ?? null;
  if (isCustomerSession) {
    if (!customerName || customerName.trim() === "") {
      customerName = sessionUserName ?? undefined;
    }
    if (!customerEmail || customerEmail.trim() === "") {
      customerEmail = sessionUserEmail ?? null;
    }
    // If phone still missing, try to load from User.phone if that column exists (Task 8.1 additive)
    if (!customerPhone) {
      try {
        const u = await db.user.findUnique({ where: { id: sessionUserId as string }, select: { id: true } as unknown as never });
        const phoneFromDb = (u as unknown as { phone?: string | null })?.phone ?? null;
        if (phoneFromDb) customerPhone = phoneFromDb;
      } catch {
        // column may not exist yet during migration gap — ignore
      }
    }
  }

  // Validation (Step 4):
  // - CUSTOMER self-booking: name required (backfilled from session), phone optional.
  // - OWNER/STAFF/ADMIN manual entry: name + phone required from the payload
  //   (walk-in / phone booking — staff identity is never reused as customer).
  if (isStaffSession && !isCustomerSession) {
    // Business scoping: OWNER/STAFF can only create bookings for their own business.
    // (ADMIN is platform-wide and bypasses this check.)
    if (sessionRole === "OWNER" || sessionRole === "STAFF") {
      if (!sessionBusinessId) {
        return NextResponse.json({ error: "No business linked to account" }, { status: 400, headers: rateLimitHeaders(rl, 10) });
      }
      if (businessId !== sessionBusinessId) {
        return NextResponse.json({ error: "Forbidden: cannot create bookings for another business" }, { status: 403, headers: rateLimitHeaders(rl, 10) });
      }
    }
    if (!customerName || customerName.trim() === "") {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400, headers: rateLimitHeaders(rl, 10) });
    }
    if (!customerPhone || customerPhone.trim() === "") {
      return NextResponse.json({ error: "Customer phone is required" }, { status: 400, headers: rateLimitHeaders(rl, 10) });
    }
  } else {
    if (!customerName || customerName.trim() === "") {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400, headers: rateLimitHeaders(rl, 10) });
    }
    // phone may be null for authenticated customers — Customer.phone is optional
  }

  // Verify business exists
  const business = await db.business.findUnique({ where: { id: businessId }, select: { id: true, openingHours: true } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404, headers: rateLimitHeaders(rl, 10) });

  const service = await db.service.findFirst({ where: { id: serviceId, businessId, isActive: true } });
  if (!service) return NextResponse.json({ error: "Service not found or unavailable" }, { status: 404, headers: rateLimitHeaders(rl, 10) });

  if (staffMemberId) {
    const staff = await db.staffMember.findFirst({ where: { id: staffMemberId, businessId } });
    if (!staff) return NextResponse.json({ error: "Staff not found for this business" }, { status: 400, headers: rateLimitHeaders(rl, 10) });
  }

  const startTime = new Date(startAt);
  if (Number.isNaN(startTime.getTime())) return NextResponse.json({ error: "Invalid start time" }, { status: 400, headers: rateLimitHeaders(rl, 10) });
  const endTime = new Date(startTime.getTime() + service.duration * 60 * 1000);

  // Opening hours check (UTC date derived from startTime)
  const dateStr = toDateOnlyUtc(startTime);
  const map = normalizeOpeningHours(business.openingHours as never);
  const opening = openingForDate(map, dateStr);
  // If business has no openingHours config, we enforce default 09:00 to 18:00 closed Sunday. But allow booking if not configured? For MVP, allow any time except Sunday closed.
  // If opening is null -> treat as open (no restriction) for backward compat.
  if (opening) {
    if (opening.closed) {
      return NextResponse.json({ error: "Business is closed on this day" }, { status: 409, headers: rateLimitHeaders(rl, 10) });
    }
    const openParts = opening.open.split(":").map(Number);
    const closeParts = opening.close.split(":").map(Number);
    const ymd = dateStr.split("-").map(Number);
    const openDate = new Date(Date.UTC(ymd[0], ymd[1] - 1, ymd[2], openParts[0], openParts[1]));
    const closeDate = new Date(Date.UTC(ymd[0], ymd[1] - 1, ymd[2], closeParts[0], closeParts[1]));
    if (startTime.getTime() < openDate.getTime() || endTime.getTime() > closeDate.getTime()) {
      return NextResponse.json(
        { error: `Slot must be within opening hours ${opening.open}–${opening.close}` },
        { status: 409, headers: rateLimitHeaders(rl, 10) },
      );
    }
  }

  // Overlap check (app-level, before DB EXCLUDE catches race)
  const overlapWhere: Record<string, unknown> = {
    businessId,
    status: { not: "CANCELLED" },
    startTime: { lt: endTime },
    endTime: { gt: startTime },
  };
  // If staff assigned, only that staff blocks; if unassigned we check business-level overlaps for single-chair model if you want strict.
  // For correctness with EXCLUDE (which only blocks per staff), when staff is null we allow business overlap, so skip overlap check when no staff is assigned.
  // But to avoid obvious double-booking without staff, we do check business-level overlaps when staff is null (conservative single resource).
  if (staffMemberId) {
    (overlapWhere as Record<string, unknown>).staffMemberId = staffMemberId;
  }
  // When staff is null we still check: any overlapping booking without staff? For MVP we check all bookings when null to give a sane UX.
  // Comment out next line if you want multi-chair unassigned overlapping allowed.
  // Keeping it: overlap check always runs (staff or business level). But for staff=null we intentionally query without staff filter, so all bookings block.
  const overlapping = await db.booking.findFirst({ where: overlapWhere as never, select: { id: true } });
  if (overlapping) {
    return NextResponse.json({ error: "That slot is already booked. Please pick another time." }, { status: 409, headers: rateLimitHeaders(rl, 10) });
  }

  // Transaction: find-or-create customer + create booking. Race on reference handled via try/catch (cuid fallback unique).
  try {
    const result = await db.$transaction(async (tx) => {
      // For authenticated customers, prefer matching by userId first so bookings link to account for /customer/account/activity
      let customer = null;
      if (isCustomerSession && sessionUserId) {
        customer = await tx.customer.findFirst({ where: { businessId, userId: sessionUserId } });
      }
      if (!customer && customerEmail) {
        customer = await tx.customer.findFirst({ where: { businessId, email: customerEmail } });
      }
      if (!customer && customerPhone) {
        customer = await tx.customer.findFirst({ where: { businessId, phone: customerPhone } });
      }
      if (!customer) {
        customer = await tx.customer.create({
          data: {
            businessId,
            name: customerName as string,
            email: (customerEmail as string | null) || null,
            phone: (customerPhone as string | null) || null,
            ...(isCustomerSession && sessionUserId ? { userId: sessionUserId } : {}),
          } as never,
        });
      } else {
        // Keep name updated and ensure userId is linked for authenticated customers
        const updates: Record<string, unknown> = {};
        if (customer.name !== customerName) updates.name = customerName as string;
        if (isCustomerSession && sessionUserId && (customer as unknown as { userId: string | null }).userId !== sessionUserId) {
          updates.userId = sessionUserId;
        }
        if (Object.keys(updates).length > 0) {
          customer = await tx.customer.update({ where: { id: customer.id }, data: updates as never });
        }
      }

      const booking = await tx.booking.create({
        data: {
          businessId,
          serviceId,
          staffMemberId: staffMemberId ?? null,
          customerId: customer.id,
          startTime,
          endTime,
          status: "CONFIRMED",
          reference: genReference(),
          notes: notes ?? null,
        },
      });

      return { booking, customer };
    });

    // Audit: booking creation (log IP + business, attribute to whoever created it —
    // CUSTOMER self-booking or OWNER/STAFF/ADMIN manual entry)
    await auditLog({
      action: "booking.create",
      userId: sessionUserId ?? null,
      businessId,
      targetType: "Booking",
      targetId: result.booking.id,
      metadata: { serviceId, reference: result.booking.reference, staffMemberId: staffMemberId ?? null, createdByRole: sessionRole },
      ip,
    });

    return NextResponse.json(
      { data: result.booking, customer: result.customer, message: "Booking confirmed", reference: result.booking.reference },
      { status: 201, headers: rateLimitHeaders(rl, 10) },
    );
  } catch (e: unknown) {
    const msg = (e as Error).message ?? "";
    // PG exclusion violation 23P01 or unique reference conflict
    // Covers both per-staff and unassigned (business-level) EXCLUDE constraints
    if (
      msg.includes("23P01") ||
      msg.includes("exclusion") ||
      msg.includes("bookings_no_overlap_per_staff") ||
      msg.includes("bookings_no_overlap_unassigned")
    ) {
      return NextResponse.json({ error: "That slot was just booked by someone else. Please pick another time." }, { status: 409, headers: rateLimitHeaders(rl, 10) });
    }
    if (msg.includes("Unique constraint") || msg.includes("reference")) {
      return NextResponse.json({ error: "Booking reference collision. Please try again." }, { status: 409, headers: rateLimitHeaders(rl, 10) });
    }
    console.error("[bookings POST] error:", msg);
    return NextResponse.json({ error: "Unable to create booking. Please try again." }, { status: 500, headers: rateLimitHeaders(rl, 10) });
  }
}
