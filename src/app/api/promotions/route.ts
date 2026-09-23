import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { createPromotionSchema, updatePromotionSchema } from "@/schemas/promotion";
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
    await requirePlanFeature(businessId, "promotions");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }
  const { page, limit, skip } = pageParams(searchParams);
  const where = { businessId };
  const [data, total] = await Promise.all([
    db.promotion.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    db.promotion.count({ where }),
  ]);
  return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function POST(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const rate = await checkRateLimit(`promotion-create:${ctx.ip}`, 30);
  if ("error" in rate) return rate.error;

  const body = await request.json().catch(() => null);
  const parsed = createPromotionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.percentOff == null && parsed.data.amountOff == null) {
    return NextResponse.json({ error: "percentOff or amountOff is required" }, { status: 400 });
  }
  if (parsed.data.startsAt && parsed.data.endsAt && parsed.data.endsAt <= parsed.data.startsAt) {
    return NextResponse.json({ error: "endsAt must be after startsAt" }, { status: 400 });
  }

  const { businessId: requestedBusinessId, amountOff, ...rest } = parsed.data;
  const effective = resolveBusinessId(ctx.role, ctx.sessionBusinessId, requestedBusinessId);
  if (!effective) return forbiddenBusinessResponse(!!ctx.sessionBusinessId);

  // Baseline offers are PROFESSIONAL; scheduled/recurring campaigns are PREMIUM.
  const feature = parsed.data.isCampaign ? "campaigns" : "promotions";
  try {
    await requirePlanFeature(effective, feature);
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }
  if (parsed.data.isCampaign && !parsed.data.repeatRule) {
    return NextResponse.json({ error: "repeatRule is required for campaigns" }, { status: 400 });
  }

  try {
    const promo = await db.promotion.create({
      data: {
        ...rest,
        businessId: effective,
        amountOff: amountOff != null ? Math.round(amountOff * 100) : null,
      },
    });

    await auditLog({
      action: "promotion.create",
      userId: ctx.userId,
      userEmail: ctx.userEmail,
      role: ctx.role,
      targetType: "Promotion",
      targetId: promo.id,
      businessId: effective,
      metadata: { code: promo.code },
      ip: ctx.ip,
    });

    return NextResponse.json({ data: promo }, { status: 201, headers: rate.headers });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Code already exists for this business" }, { status: 409 });
    }
    throw e;
  }
}

export async function PATCH(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const existing = await db.promotion.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ctx.role !== "ADMIN" && existing.businessId !== ctx.sessionBusinessId) {
    return forbiddenBusinessResponse(!!ctx.sessionBusinessId);
  }

  const body = await request.json().catch(() => null);
  const parsed = updatePromotionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const feature = (parsed.data.isCampaign ?? existing.isCampaign) ? "campaigns" : "promotions";
  try {
    await requirePlanFeature(existing.businessId, feature);
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }

  const { amountOff, ...rest } = parsed.data;
  const updated = await db.promotion.update({
    where: { id },
    data: {
      ...rest,
      ...(amountOff !== undefined
        ? { amountOff: amountOff != null ? Math.round(amountOff * 100) : null }
        : {}),
    },
  });
  return NextResponse.json({ data: updated });
}

export async function DELETE(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const existing = await db.promotion.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ctx.role !== "ADMIN" && existing.businessId !== ctx.sessionBusinessId) {
    return forbiddenBusinessResponse(!!ctx.sessionBusinessId);
  }
  try {
    await requirePlanFeature(existing.businessId, existing.isCampaign ? "campaigns" : "promotions");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }
  await db.promotion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
