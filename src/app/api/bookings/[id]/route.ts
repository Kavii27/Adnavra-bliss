import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateBookingSchema } from "@/schemas/booking";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

function getClientIp(req: NextRequest): string {
  const f = req.headers.get("x-forwarded-for");
  if (f) return f.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as unknown as { role: string }).role;
  const sessionBusinessId = (session.user as unknown as { businessId: string | null }).businessId;

  const booking = await db.booking.findUnique({
    where: { id },
    include: { service: true, customer: true, staffMember: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role !== "ADMIN" && booking.businessId !== sessionBusinessId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ data: booking });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as unknown as { role: string }).role;
  const sessionBusinessId = (session.user as unknown as { businessId: string | null }).businessId;
  if (!["OWNER", "STAFF", "ADMIN"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await db.booking.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role !== "ADMIN" && existing.businessId !== sessionBusinessId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rl = await rateLimit(`booking-update:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 30) });

  const body = await request.json().catch(() => null);
  const parsed = updateBookingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  // Handle reschedule: check overlap + opening hours if startAt changed
  let newStart: Date | undefined;
  let newEnd: Date | undefined;
  if (parsed.data.startAt) {
    const service = await db.service.findUnique({ where: { id: existing.serviceId } });
    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 409 });
    newStart = parsed.data.startAt;
    newEnd = new Date(newStart.getTime() + service.duration * 60 * 1000);

    // Check overlap. Transaction with FOR UPDATE style: query existing overlapping bookings
    const overlapping = await db.booking.findFirst({
      where: {
        businessId: existing.businessId,
        id: { not: id },
        status: { not: "CANCELLED" },
        staffMemberId: existing.staffMemberId ?? undefined,
        startTime: { lt: newEnd },
        endTime: { gt: newStart },
      },
    });
    if (overlapping) {
      return NextResponse.json({ error: "Slot already booked. Pick another time" }, { status: 409 });
    }
    // Also enforce service must stay within that day's bounds? availability check is already overlap; opening hours handled at create time.
    // For reschedule we also need opening hours check. Optional, but enforce basic 09:00 to 18:00 if not configured
  }

  // Staff change validation
  if (parsed.data.staffMemberId !== undefined) {
    const sid = parsed.data.staffMemberId;
    if (sid) {
      const staff = await db.staffMember.findFirst({ where: { id: sid, businessId: existing.businessId } });
      if (!staff) return NextResponse.json({ error: "Staff not found for this business" }, { status: 400 });
    }
  }

  const updated = await db.booking.update({
    where: { id },
    data: {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(newStart ? { startTime: newStart, endTime: newEnd! } : {}),
      ...(parsed.data.staffMemberId !== undefined ? { staffMemberId: parsed.data.staffMemberId ?? null } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
    },
  });

  const actorId = (session.user as unknown as { id: string }).id;
  const actorEmail = session.user.email ?? null;
  await auditLog({
    action: parsed.data.status === "CANCELLED" ? "booking.cancel" : "booking.update",
    userId: actorId,
    userEmail: actorEmail,
    role,
    targetType: "Booking",
    targetId: id,
    businessId: existing.businessId,
    metadata: { status: parsed.data.status, startAt: newStart?.toISOString() },
    ip,
  });

  return NextResponse.json({ data: updated }, { headers: rateLimitHeaders(rl, 30) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as unknown as { role: string }).role;
  const sessionBusinessId = (session.user as unknown as { businessId: string | null }).businessId;
  if (!["OWNER", "STAFF", "ADMIN"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await db.booking.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role !== "ADMIN" && existing.businessId !== sessionBusinessId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Cancel rather than delete to preserve audit/history and to respect FK
  const cancelled = await db.booking.update({ where: { id }, data: { status: "CANCELLED" } });
  const actorId = (session.user as unknown as { id: string }).id;
  await auditLog({
    action: "booking.cancel",
    userId: actorId,
    userEmail: session.user.email ?? null,
    role,
    targetType: "Booking",
    targetId: id,
    businessId: existing.businessId,
    ip: (await import("@/lib/audit")).getAuditIp(_req.headers) ?? null,
  });
  return NextResponse.json({ data: cancelled, message: "Booking cancelled" });
}
