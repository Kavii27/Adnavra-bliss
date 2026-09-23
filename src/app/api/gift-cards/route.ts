import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { createGiftCardSchema, updateGiftCardSchema } from "@/schemas/giftCard";
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
    await requirePlanFeature(businessId, "giftCardsSold");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }
  const { page, limit, skip } = pageParams(searchParams);
  const where = { businessId };
  const [data, total] = await Promise.all([
    db.giftCard.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    db.giftCard.count({ where }),
  ]);
  return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function POST(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "STAFF", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const rate = await checkRateLimit(`gift-card:${ctx.ip}`, 60);
  if ("error" in rate) return rate.error;

  const body = await request.json().catch(() => null);
  const parsed = createGiftCardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const effective = resolveBusinessId(ctx.role, ctx.sessionBusinessId, parsed.data.businessId);
  if (!effective) return forbiddenBusinessResponse(!!ctx.sessionBusinessId);

  try {
    await requirePlanFeature(effective, "giftCardsSold");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }

  const amountMinor = Math.round(parsed.data.amount * 100);
  try {
    const card = await db.giftCard.create({
      data: {
        businessId: effective,
        code: parsed.data.code,
        amount: amountMinor,
        balance: amountMinor,
        recipientName: parsed.data.recipientName ?? null,
        recipientEmail: parsed.data.recipientEmail ?? null,
        expiresAt: parsed.data.expiresAt ?? null,
      },
    });

    await db.saleRecord.create({
      data: {
        businessId: effective,
        category: "GIFT_CARD",
        label: `Gift card ${card.code}`,
        amount: card.amount,
        status: "COMPLETED",
      },
    });

    await auditLog({
      action: "gift-card.create",
      userId: ctx.userId,
      userEmail: ctx.userEmail,
      role: ctx.role,
      targetType: "GiftCard",
      targetId: card.id,
      businessId: effective,
      metadata: { code: card.code },
      ip: ctx.ip,
    });

    return NextResponse.json({ data: card }, { status: 201, headers: rate.headers });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Code already exists for this business" }, { status: 409 });
    }
    throw e;
  }
}

export async function PATCH(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "STAFF", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const existing = await db.giftCard.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ctx.role !== "ADMIN" && existing.businessId !== ctx.sessionBusinessId) {
    return forbiddenBusinessResponse(!!ctx.sessionBusinessId);
  }
  try {
    await requirePlanFeature(existing.businessId, "giftCardsSold");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }

  const body = await request.json().catch(() => null);
  const parsed = updateGiftCardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const updated = await db.giftCard.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ data: updated });
}
