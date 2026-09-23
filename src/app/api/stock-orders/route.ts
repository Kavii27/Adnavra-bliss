import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { createStockOrderSchema, updateStockOrderSchema } from "@/schemas/stockOrder";
import {
  checkRateLimit,
  forbiddenBusinessResponse,
  guardMutation,
  lockedResponse,
  pageParams,
  resolveBusinessId,
} from "@/lib/api-guard";
import { requirePlanFeature } from "@/lib/require-plan";

const includeRel = {
  supplier: { select: { id: true, name: true } },
  items: true,
};

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
    db.stockOrder.findMany({ where, include: includeRel, orderBy: { createdAt: "desc" }, skip, take: limit }),
    db.stockOrder.count({ where }),
  ]);
  return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function POST(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const rate = await checkRateLimit(`stock-order:${ctx.ip}`, 30);
  if ("error" in rate) return rate.error;

  const body = await request.json().catch(() => null);
  const parsed = createStockOrderSchema.safeParse(body);
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

  // Supplier must belong to the same business. Product links are optional and
  // validated the same way when provided.
  const supplier = await db.supplier.findFirst({
    where: { id: parsed.data.supplierId, businessId: effective },
    select: { id: true },
  });
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  const productIds = parsed.data.items.map((i) => i.productId).filter((v): v is string => !!v);
  if (productIds.length > 0) {
    const products = await db.product.findMany({
      where: { id: { in: productIds }, businessId: effective },
      select: { id: true },
    });
    if (products.length !== new Set(productIds).size) {
      return NextResponse.json({ error: "All linked products must belong to your business" }, { status: 400 });
    }
  }

  const order = await db.stockOrder.create({
    data: {
      businessId: effective,
      supplierId: parsed.data.supplierId,
      notes: parsed.data.notes ?? null,
      items: {
        create: parsed.data.items.map((i) => ({
          productId: i.productId ?? null,
          productName: i.productName,
          quantity: i.quantity,
          unitCost: Math.round(i.unitCost * 100),
        })),
      },
    },
    include: includeRel,
  });

  await auditLog({
    action: "stock-order.create",
    userId: ctx.userId,
    userEmail: ctx.userEmail,
    role: ctx.role,
    targetType: "StockOrder",
    targetId: order.id,
    businessId: effective,
    metadata: { supplierId: order.supplierId, lines: order.items.length },
    ip: ctx.ip,
  });

  return NextResponse.json({ data: order }, { status: 201, headers: rate.headers });
}

export async function PATCH(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const existing = await db.stockOrder.findUnique({ where: { id } });
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
  const parsed = updateStockOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const data: { status?: "PENDING" | "ORDERED" | "RECEIVED" | "CANCELLED"; notes?: string | null; orderedAt?: Date | null; receivedAt?: Date | null } = {};
  if (parsed.data.status) {
    data.status = parsed.data.status;
    if (parsed.data.status === "ORDERED" && !existing.orderedAt) data.orderedAt = new Date();
    if (parsed.data.status === "RECEIVED" && !existing.receivedAt) data.receivedAt = new Date();
  }
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;

  const updated = await db.stockOrder.update({ where: { id }, data, include: includeRel });

  // Receiving stock adds quantities to linked products — the only automatic
  // inventory movement in v1. Everything else is an explicit stocktake.
  if (parsed.data.status === "RECEIVED" && existing.status !== "RECEIVED") {
    const items = await db.stockOrderItem.findMany({ where: { stockOrderId: id } });
    for (const item of items) {
      if (!item.productId) continue;
      await db.product.update({
        where: { id: item.productId },
        data: { stockQty: { increment: item.quantity } },
      }).catch(() => null);
    }
  }

  return NextResponse.json({ data: updated });
}
