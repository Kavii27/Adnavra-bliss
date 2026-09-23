import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateStaffSchema } from "@/schemas/staff";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { FeatureLockedError, requirePlanFeature } from "@/lib/require-plan";

function getClientIp(req: NextRequest): string {
  const f = req.headers.get("x-forwarded-for");
  if (f) return f.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

async function checkOwnership(staffId: string, sessionBusinessId: string | null, role: string) {
  const staff = await db.staffMember.findUnique({ where: { id: staffId } });
  if (!staff) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }), staff: null };
  if (role !== "ADMIN" && staff.businessId !== sessionBusinessId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), staff: null };
  }
  return { error: null, staff };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await db.staffMember.findUnique({ where: { id } });
  if (!staff) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: staff });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as unknown as { role: string }).role;
  const sessionBusinessId = (session.user as unknown as { businessId: string | null }).businessId;
  if (!["OWNER", "ADMIN"].includes(role)) return NextResponse.json({ error: "Forbidden: only owners can manage staff" }, { status: 403 });

  const { error, staff } = await checkOwnership(id, sessionBusinessId, role);
  if (error) return error;
  void staff;

  // Plan gate: staff management mutations are PROFESSIONAL and up.
  try {
    await requirePlanFeature(staff?.businessId ?? sessionBusinessId ?? "", "staffManagement");
  } catch (e) {
    if (e instanceof FeatureLockedError) {
      return NextResponse.json({ error: "upgrade_required", feature: e.feature }, { status: 403 });
    }
    throw e;
  }

  const ip = getClientIp(request);
  const rl = await rateLimit(`staff-update:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 30) });

  const body = await request.json().catch(() => null);
  const parsed = updateStaffSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
  if (parsed.data.email !== undefined) {
    const v = parsed.data.email;
    data.email = v && v.trim() !== "" ? v.trim().toLowerCase() : null;
  }
  if (parsed.data.phone !== undefined) {
    const v = parsed.data.phone;
    data.phone = v && v.trim() !== "" ? v.trim() : null;
  }
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const updated = await db.staffMember.update({ where: { id }, data });
  await auditLog({
    action: "staff.update",
    userId: (session.user as unknown as { id: string }).id,
    userEmail: session.user.email ?? null,
    role,
    targetType: "StaffMember",
    targetId: id,
    businessId: staff?.businessId ?? null,
    metadata: { fields: Object.keys(data) },
    ip,
  });
  return NextResponse.json({ data: updated }, { headers: rateLimitHeaders(rl, 30) });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as unknown as { role: string }).role;
  const sessionBusinessId = (session.user as unknown as { businessId: string | null }).businessId;
  if (!["OWNER", "ADMIN"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error, staff } = await checkOwnership(id, sessionBusinessId, role);
  if (error) return error;

  // Plan gate: staff management mutations are PROFESSIONAL and up.
  try {
    await requirePlanFeature(staff?.businessId ?? sessionBusinessId ?? "", "staffManagement");
  } catch (e) {
    if (e instanceof FeatureLockedError) {
      return NextResponse.json({ error: "upgrade_required", feature: e.feature }, { status: 403 });
    }
    throw e;
  }

  const count = await db.booking.count({ where: { staffMemberId: id } });
  const actorId = (session.user as unknown as { id: string }).id;
  const ip = getClientIp(request);

  if (count > 0) {
    const updated = await db.staffMember.update({ where: { id }, data: { isActive: false } });
    await auditLog({
      action: "staff.delete",
      userId: actorId,
      userEmail: session.user.email ?? null,
      role,
      targetType: "StaffMember",
      targetId: id,
      businessId: staff?.businessId ?? null,
      metadata: { soft: true, bookings: count },
      ip,
    });
    return NextResponse.json({ data: updated, message: "Staff deactivated (has bookings)" });
  }

  await db.staffMember.delete({ where: { id } });
  await auditLog({
    action: "staff.delete",
    userId: actorId,
    userEmail: session.user.email ?? null,
    role,
    targetType: "StaffMember",
    targetId: id,
    businessId: staff?.businessId ?? null,
    metadata: { hard: true },
    ip,
  });
  return NextResponse.json({ message: "Deleted" });
}
