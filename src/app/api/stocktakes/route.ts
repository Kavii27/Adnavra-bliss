import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { createStocktakeSchema, updateStocktakeSchema } from "@/schemas/stocktake";
import {
  checkRateLimit,
  forbiddenBusinessResponse,
  guardMutation,
  lockedResponse,
  pageParams,
  resolveBusinessId,
} from "@/lib/api-guard";
import { requirePlanFeature } from "@/lib/require-plan";

const includeRel = { items: true };

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
    await requirePlanFeature(businessId, "inventoryOps");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }
  const { page, limit, skip } = pageParams(searchParams);
  const where = { businessId };
  const [data, total] = await Promise.all([
    db.stocktake.findMany({ where, include: includeRel, orderBy: { createdAt: "desc" }, skip, take: limit }),
    db.stocktake.count({ where }),
  ]);
  return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function POST(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const rate = await checkRateLimit(`stocktake:${ctx.ip}`, 30);
  if ("error" in rate) return rate.error;

  const body = await request.json().catch(() => null);
  const parsed = createStocktakeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const effective = resolveBusinessId(ctx.role, ctx.sessionBusinessId, parsed.data.businessId);
  if (!effective) return forbiddenBusinessResponse(!!ctx.sessionBusinessId);

  try {
    await requirePlanFeature(effective, "inventoryOps");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }

  const take = await db.stocktake.create({
    data: {
      businessId: effective,
      title: parsed.data.title ?? null,
      notes: parsed.data.notes ?? null,
      items: {
        create: parsed.data.items.map((i) => ({
          productId: i.productId ?? null,
          productName: i.productName,
          expectedQty: i.expectedQty,
          countedQty: i.countedQty,
        })),
      },
    },
    include: includeRel,
  });

  await auditLog({
    action: "stocktake.create",
    userId: ctx.userId,
    userEmail: ctx.userEmail,
    role: ctx.role,
    targetType: "Stocktake",
    targetId: take.id,
    businessId: effective,
    metadata: { lines: take.items.length },
    ip: ctx.ip,
  });

  return NextResponse.json({ data: take }, { status: 201, headers: rate.headers });
}

export async function PATCH(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const existing = await db.stocktake.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ctx.role !== "ADMIN" && existing.businessId !== ctx.sessionBusinessId) {
    return forbiddenBusinessResponse(!!ctx.sessionBusinessId);
  }
  try {
    await requirePlanFeature(existing.businessId, "inventoryOps");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }

  const body = await request.json().catch(() => null);
  const parsed = updateStocktakeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { items, status, ...rest } = parsed.data;
  const updated = await db.stocktake.update({
    where: { id },
    data: {
      ...rest,
      ...(status ? { status, ...(status === "COMPLETED" ? { completedAt: new Date() } : {}) } : {}),
      ...(items
        ? { items: { deleteMany: {}, create: items.map((i) => ({ productId: i.productId ?? null, productName: i.productName, expectedQty: i.expectedQty, countedQty: i.countedQty })) } }
        : {}),
    },
    include: includeRel,
  });

  // Completing a stocktake reconciles linked products to counted quantities.
  if (status === "COMPLETED" && existing.status !== "COMPLETED") {
    const lines = await db.stocktakeItem.findMany({ where: { stocktakeId: id } });
    for (const line of lines) {
      if (!line.productId) continue;
      await db.product.update({ where: { id: line.productId }, data: { stockQty: line.countedQty } }).catch(() => null);
    }
  }

  return NextResponse.json({ data: updated });
}
