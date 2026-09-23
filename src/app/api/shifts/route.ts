import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { createShiftSchema, updateShiftSchema } from "@/schemas/shift";
import {
  checkRateLimit,
  forbiddenBusinessResponse,
  guardMutation,
  lockedResponse,
  pageParams,
  resolveBusinessId,
} from "@/lib/api-guard";
import { requirePlanFeature } from "@/lib/require-plan";

const includeRel = { staffMember: { select: { id: true, name: true } } };

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }
  const session = await auth().catch(() => null);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as unknown as { role: string }).role;
  const sessionBusinessId = (session.user as unknown as { businessId: string | null }).businessId;
  if (role !== "ADMIN" && sessionBusinessId !== businessId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await requirePlanFeature(businessId, "staffScheduling");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }
  const { page, limit, skip } = pageParams(searchParams);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const staffMemberId = searchParams.get("staffMemberId");
  const where = {
    businessId,
    ...(staffMemberId ? { staffMemberId } : {}),
    ...(from || to
      ? { start: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
      : {}),
  };
  const [data, total] = await Promise.all([
    db.shift.findMany({ where, include: includeRel, orderBy: { start: "asc" }, skip, take: limit }),
    db.shift.count({ where }),
  ]);
  return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function POST(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const rate = await checkRateLimit(`shift:${ctx.ip}`, 60);
  if ("error" in rate) return rate.error;

  const body = await request.json().catch(() => null);
  const parsed = createShiftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { businessId: requestedBusinessId, ...rest } = parsed.data;
  const effective = resolveBusinessId(ctx.role, ctx.sessionBusinessId, requestedBusinessId);
  if (!effective) return forbiddenBusinessResponse(!!ctx.sessionBusinessId);

  try {
    await requirePlanFeature(effective, "staffScheduling");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }

  const staff = await db.staffMember.findFirst({
    where: { id: parsed.data.staffMemberId, businessId: effective },
    select: { id: true },
  });
  if (!staff) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

  // Overlap guard: one staffer, one shift at a time.
  const overlap = await db.shift.findFirst({
    where: {
      staffMemberId: parsed.data.staffMemberId,
      start: { lt: parsed.data.end },
      end: { gt: parsed.data.start },
    },
    select: { id: true },
  });
  if (overlap) {
    return NextResponse.json({ error: "Shift overlaps an existing shift for this staff member" }, { status: 409 });
  }

  const shift = await db.shift.create({ data: { ...rest, businessId: effective }, include: includeRel });

  await auditLog({
    action: "shift.create",
    userId: ctx.userId,
    userEmail: ctx.userEmail,
    role: ctx.role,
    targetType: "Shift",
    targetId: shift.id,
    businessId: effective,
    metadata: { staffMemberId: shift.staffMemberId },
    ip: ctx.ip,
  });

  return NextResponse.json({ data: shift }, { status: 201, headers: rate.headers });
}

export async function PATCH(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const existing = await db.shift.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ctx.role !== "ADMIN" && existing.businessId !== ctx.sessionBusinessId) {
    return forbiddenBusinessResponse(!!ctx.sessionBusinessId);
  }
  try {
    await requirePlanFeature(existing.businessId, "staffScheduling");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }

  const body = await request.json().catch(() => null);
  const parsed = updateShiftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.staffMemberId) {
    const staff = await db.staffMember.findFirst({
      where: { id: parsed.data.staffMemberId, businessId: existing.businessId },
      select: { id: true },
    });
    if (!staff) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  }
  const updated = await db.shift.update({ where: { id }, data: parsed.data, include: includeRel });
  if (updated.end <= updated.start) {
    return NextResponse.json({ error: "Shift end must be after start" }, { status: 400 });
  }
  return NextResponse.json({ data: updated });
}

export async function DELETE(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const existing = await db.shift.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ctx.role !== "ADMIN" && existing.businessId !== ctx.sessionBusinessId) {
    return forbiddenBusinessResponse(!!ctx.sessionBusinessId);
  }
  try {
    await requirePlanFeature(existing.businessId, "staffScheduling");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }
  await db.shift.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
