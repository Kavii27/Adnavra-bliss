import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { enrollLoyaltySchema, adjustLoyaltySchema } from "@/schemas/loyalty";
import {
  checkRateLimit,
  forbiddenBusinessResponse,
  guardMutation,
  lockedResponse,
  pageParams,
  resolveBusinessId,
} from "@/lib/api-guard";
import { requirePlanFeature } from "@/lib/require-plan";

const includeRel = { customer: { select: { id: true, name: true, email: true, phone: true } } };

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
    await requirePlanFeature(businessId, "loyaltyProgram");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }
  const { page, limit, skip } = pageParams(searchParams);
  const where = { businessId };
  const [data, total] = await Promise.all([
    db.loyaltyAccount.findMany({ where, include: includeRel, orderBy: { points: "desc" }, skip, take: limit }),
    db.loyaltyAccount.count({ where }),
  ]);
  return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

/** Enroll a customer in the loyalty program (creates their account row). */
export async function POST(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "STAFF", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const rate = await checkRateLimit(`loyalty:${ctx.ip}`, 60);
  if ("error" in rate) return rate.error;

  const body = await request.json().catch(() => null);
  const parsed = enrollLoyaltySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const effective = resolveBusinessId(ctx.role, ctx.sessionBusinessId, parsed.data.businessId);
  if (!effective) return forbiddenBusinessResponse(!!ctx.sessionBusinessId);

  try {
    await requirePlanFeature(effective, "loyaltyProgram");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }

  const cust = await db.customer.findFirst({
    where: { id: parsed.data.customerId, businessId: effective },
    select: { id: true },
  });
  if (!cust) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  try {
    const account = await db.loyaltyAccount.create({
      data: { businessId: effective, customerId: parsed.data.customerId },
      include: includeRel,
    });
    return NextResponse.json({ data: account }, { status: 201, headers: rate.headers });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Customer is already enrolled" }, { status: 409 });
    }
    throw e;
  }
}

/** Adjust points / visits / redemptions (?id=accountId). Floors at zero. */
export async function PATCH(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "STAFF", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const existing = await db.loyaltyAccount.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ctx.role !== "ADMIN" && existing.businessId !== ctx.sessionBusinessId) {
    return forbiddenBusinessResponse(!!ctx.sessionBusinessId);
  }
  try {
    await requirePlanFeature(existing.businessId, "loyaltyProgram");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }

  const body = await request.json().catch(() => null);
  const parsed = adjustLoyaltySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const updated = await db.loyaltyAccount.update({
    where: { id },
    data: {
      points: { increment: parsed.data.pointsDelta },
      visits: { increment: parsed.data.visitsDelta },
      rewardsRedeemed: { increment: parsed.data.rewardsRedeemedDelta },
    },
    include: includeRel,
  });
  // Never persist negative balances from over-redeeming.
  const clamped = {
    points: Math.max(0, updated.points),
    visits: Math.max(0, updated.visits),
    rewardsRedeemed: Math.max(0, updated.rewardsRedeemed),
  };
  const final = await db.loyaltyAccount.update({ where: { id }, data: clamped, include: includeRel });

  await auditLog({
    action: "loyalty.adjust",
    userId: ctx.userId,
    userEmail: ctx.userEmail,
    role: ctx.role,
    targetType: "LoyaltyAccount",
    targetId: id,
    businessId: existing.businessId,
    metadata: parsed.data,
    ip: ctx.ip,
  });

  return NextResponse.json({ data: final });
}
