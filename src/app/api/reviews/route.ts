import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { createReviewSchema } from "@/schemas/review";
import {
  checkRateLimit,
  forbiddenBusinessResponse,
  guardMutation,
  lockedResponse,
  pageParams,
  resolveBusinessId,
} from "@/lib/api-guard";
import { requirePlanFeature } from "@/lib/require-plan";

/** Reviews are the single ratings system (reused by the marketplace listing). */
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
    await requirePlanFeature(businessId, "onlineReputation");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }
  const { page, limit, skip } = pageParams(searchParams);
  const where = { businessId };
  const [data, total, agg] = await Promise.all([
    db.review.findMany({
      where,
      include: { customer: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.review.count({ where }),
    db.review.aggregate({ where, _avg: { rating: true } }),
  ]);
  return NextResponse.json({
    data,
    summary: { total, average: agg._avg.rating ?? 0 },
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "STAFF", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const rate = await checkRateLimit(`review:${ctx.ip}`, 60);
  if ("error" in rate) return rate.error;

  const body = await request.json().catch(() => null);
  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { businessId: requestedBusinessId, ...rest } = parsed.data;
  const effective = resolveBusinessId(ctx.role, ctx.sessionBusinessId, requestedBusinessId);
  if (!effective) return forbiddenBusinessResponse(!!ctx.sessionBusinessId);

  try {
    await requirePlanFeature(effective, "onlineReputation");
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

  const review = await db.review.create({ data: { ...rest, businessId: effective } });

  await auditLog({
    action: "review.create",
    userId: ctx.userId,
    userEmail: ctx.userEmail,
    role: ctx.role,
    targetType: "Review",
    targetId: review.id,
    businessId: effective,
    metadata: { rating: review.rating },
    ip: ctx.ip,
  });

  return NextResponse.json({ data: review }, { status: 201, headers: rate.headers });
}

export async function DELETE(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const existing = await db.review.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ctx.role !== "ADMIN" && existing.businessId !== ctx.sessionBusinessId) {
    return forbiddenBusinessResponse(!!ctx.sessionBusinessId);
  }
  try {
    await requirePlanFeature(existing.businessId, "onlineReputation");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }
  await db.review.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
