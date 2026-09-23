import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import {
  createMembershipSchema,
  updateMembershipSchema,
  createMembershipSaleSchema,
  updateMembershipSaleSchema,
} from "@/schemas/membership";
import {
  checkRateLimit,
  forbiddenBusinessResponse,
  guardMutation,
  lockedResponse,
  pageParams,
  resolveBusinessId,
} from "@/lib/api-guard";
import { requirePlanFeature } from "@/lib/require-plan";

/**
 * Membership catalog + membership sales share one route file, split by
 * ?view=catalog (default) or ?view=sales.
 */

async function authedBusiness(request: NextRequest, businessId: string): Promise<NextResponse | { role: string }> {
  const session = await auth().catch(() => null);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as unknown as { role: string }).role;
  const sessionBusinessId = (session.user as unknown as { businessId: string | null }).businessId;
  if (role !== "ADMIN" && sessionBusinessId !== businessId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { role };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }
  const check = await authedBusiness(request, businessId);
  if (check instanceof NextResponse) return check;

  try {
    await requirePlanFeature(businessId, "membershipsSold");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }
  const view = searchParams.get("view") ?? "sales";
  const { page, limit, skip } = pageParams(searchParams);
  if (view === "catalog") {
    const where = { businessId };
    const [data, total] = await Promise.all([
      db.membership.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      db.membership.count({ where }),
    ]);
    return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  }
  const where = { businessId };
  const [data, total] = await Promise.all([
    db.membershipSale.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        membership: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.membershipSale.count({ where }),
  ]);
  return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function POST(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") ?? "sales";

  const rate = await checkRateLimit(`membership:${ctx.ip}`, 30);
  if ("error" in rate) return rate.error;

  const body = await request.json().catch(() => null);

  if (view === "catalog") {
    const parsed = createMembershipSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }
    const { businessId: requestedBusinessId, price, ...rest } = parsed.data;
    const effective = resolveBusinessId(ctx.role, ctx.sessionBusinessId, requestedBusinessId);
    if (!effective) return forbiddenBusinessResponse(!!ctx.sessionBusinessId);
    try {
      await requirePlanFeature(effective, "membershipsSold");
    } catch (e) {
      const r = lockedResponse(e);
      if (r) return r;
      throw e;
    }
    const membership = await db.membership.create({
      data: { ...rest, businessId: effective, price: Math.round(price * 100) },
    });
    await auditLog({
      action: "membership.create",
      userId: ctx.userId,
      userEmail: ctx.userEmail,
      role: ctx.role,
      targetType: "Membership",
      targetId: membership.id,
      businessId: effective,
      metadata: { name: membership.name },
      ip: ctx.ip,
    });
    return NextResponse.json({ data: membership }, { status: 201, headers: rate.headers });
  }

  // view=sales — record a membership sold to a customer.
  const parsed = createMembershipSaleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const effective = resolveBusinessId(ctx.role, ctx.sessionBusinessId, parsed.data.businessId);
  if (!effective) return forbiddenBusinessResponse(!!ctx.sessionBusinessId);
  try {
    await requirePlanFeature(effective, "membershipsSold");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }

  let membershipName = parsed.data.membershipName?.trim() ?? "";
  if (parsed.data.membershipId) {
    const m = await db.membership.findFirst({
      where: { id: parsed.data.membershipId, businessId: effective },
      select: { id: true, name: true, durationDays: true },
    });
    if (!m) return NextResponse.json({ error: "Membership not found" }, { status: 404 });
    membershipName = m.name;
  }
  if (!membershipName) {
    return NextResponse.json({ error: "membershipId or membershipName is required" }, { status: 400 });
  }
  if (parsed.data.customerId) {
    const cust = await db.customer.findFirst({
      where: { id: parsed.data.customerId, businessId: effective },
      select: { id: true },
    });
    if (!cust) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const sale = await db.membershipSale.create({
    data: {
      businessId: effective,
      membershipId: parsed.data.membershipId ?? null,
      membershipName,
      customerId: parsed.data.customerId ?? null,
      pricePaid: Math.round(parsed.data.pricePaid * 100),
      startsAt: parsed.data.startsAt ?? new Date(),
      endsAt: parsed.data.endsAt ?? null,
    },
  });

  await db.saleRecord.create({
    data: {
      businessId: effective,
      category: "MEMBERSHIP",
      label: `Membership: ${membershipName}`,
      amount: sale.pricePaid,
      status: "COMPLETED",
      customerId: sale.customerId,
    },
  });

  return NextResponse.json({ data: sale }, { status: 201, headers: rate.headers });
}

export async function PATCH(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const view = searchParams.get("view") ?? "sales";
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  if (view === "catalog") {
    const existing = await db.membership.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (ctx.role !== "ADMIN" && existing.businessId !== ctx.sessionBusinessId) {
      return forbiddenBusinessResponse(!!ctx.sessionBusinessId);
    }
    try {
      await requirePlanFeature(existing.businessId, "membershipsSold");
    } catch (e) {
      const r = lockedResponse(e);
      if (r) return r;
      throw e;
    }
    const body = await request.json().catch(() => null);
    const parsed = updateMembershipSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }
    const { price, ...rest } = parsed.data;
    const updated = await db.membership.update({
      where: { id },
      data: { ...rest, ...(price !== undefined ? { price: Math.round(price * 100) } : {}) },
    });
    return NextResponse.json({ data: updated });
  }

  const existing = await db.membershipSale.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ctx.role !== "ADMIN" && existing.businessId !== ctx.sessionBusinessId) {
    return forbiddenBusinessResponse(!!ctx.sessionBusinessId);
  }
  try {
    await requirePlanFeature(existing.businessId, "membershipsSold");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }
  const body = await request.json().catch(() => null);
  const parsed = updateMembershipSaleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const updated = await db.membershipSale.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ data: updated });
}

export async function DELETE(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  // Catalog entries with sales are deactivated, never deleted (history intact).
  const existing = await db.membership.findUnique({
    where: { id },
    include: { sales: { select: { id: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ctx.role !== "ADMIN" && existing.businessId !== ctx.sessionBusinessId) {
    return forbiddenBusinessResponse(!!ctx.sessionBusinessId);
  }
  try {
    await requirePlanFeature(existing.businessId, "membershipsSold");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }
  if (existing.sales.length > 0) {
    const updated = await db.membership.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ data: updated, deactivated: true });
  }
  await db.membership.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
