import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { createSaleRecordSchema, updateSaleRecordSchema } from "@/schemas/sale";
import {
  checkRateLimit,
  forbiddenBusinessResponse,
  guardMutation,
  lockedResponse,
  pageParams,
  resolveBusinessId,
} from "@/lib/api-guard";
import { requirePlanFeature } from "@/lib/require-plan";

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
    await requirePlanFeature(businessId, "detailedSales");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }
  const { page, limit, skip } = pageParams(searchParams);
  const where = { businessId };
  const [data, total] = await Promise.all([
    db.saleRecord.findMany({
      where,
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { occurredAt: "desc" },
      skip,
      take: limit,
    }),
    db.saleRecord.count({ where }),
  ]);
  return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function POST(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "STAFF", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const rate = await checkRateLimit(`sale-record:${ctx.ip}`, 60);
  if ("error" in rate) return rate.error;

  const body = await request.json().catch(() => null);
  const parsed = createSaleRecordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { businessId: requestedBusinessId, amount, occurredAt, ...rest } = parsed.data;
  const effective = resolveBusinessId(ctx.role, ctx.sessionBusinessId, requestedBusinessId);
  if (!effective) return forbiddenBusinessResponse(!!ctx.sessionBusinessId);

  try {
    await requirePlanFeature(effective, "detailedSales");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }
  if (parsed.data.customerId) {
    const cust = await db.customer.findFirst({
      where: { id: parsed.data.customerId, businessId: effective },
      select: { id: true },
    });
    if (!cust) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const record = await db.saleRecord.create({
    data: {
      ...rest,
      businessId: effective,
      amount: Math.round(amount * 100),
      ...(occurredAt ? { occurredAt } : {}),
    },
  });

  await auditLog({
    action: "sale-record.create",
    userId: ctx.userId,
    userEmail: ctx.userEmail,
    role: ctx.role,
    targetType: "SaleRecord",
    targetId: record.id,
    businessId: effective,
    metadata: { category: record.category, label: record.label },
    ip: ctx.ip,
  });

  return NextResponse.json({ data: record }, { status: 201, headers: rate.headers });
}

export async function PATCH(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "STAFF", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const existing = await db.saleRecord.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ctx.role !== "ADMIN" && existing.businessId !== ctx.sessionBusinessId) {
    return forbiddenBusinessResponse(!!ctx.sessionBusinessId);
  }
  try {
    await requirePlanFeature(existing.businessId, "detailedSales");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSaleRecordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  // Ledger rows are never deleted or re-valued — only status/label corrections.
  const updated = await db.saleRecord.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ data: updated });
}
