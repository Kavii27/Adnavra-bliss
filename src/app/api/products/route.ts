import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { createProductSchema } from "@/schemas/product";
import {
  checkRateLimit,
  forbiddenBusinessResponse,
  guardMutation,
  lockedResponse,
  pageParams,
  resolveBusinessId,
} from "@/lib/api-guard";
import { requirePlanFeature } from "@/lib/require-plan";

/** GET /api/products?businessId=... — OWNER/STAFF/ADMIN of that business only. */
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
    await requirePlanFeature(businessId, "retailProducts");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }
  const { page, limit, skip } = pageParams(searchParams);
  const where = { businessId };
  const [data, total] = await Promise.all([
    db.product.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
    db.product.count({ where }),
  ]);
  return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

/** POST /api/products — OWNER/ADMIN, PROFESSIONAL retailProducts. */
export async function POST(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const rate = await checkRateLimit(`product-create:${ctx.ip}`, 30);
  if ("error" in rate) return rate.error;

  const body = await request.json().catch(() => null);
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { businessId: requestedBusinessId, price, ...rest } = parsed.data;
  const effective = resolveBusinessId(ctx.role, ctx.sessionBusinessId, requestedBusinessId);
  if (!effective) return forbiddenBusinessResponse(!!ctx.sessionBusinessId);

  try {
    await requirePlanFeature(effective, "retailProducts");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }

  const product = await db.product.create({
    data: { ...rest, businessId: effective, price: Math.round(price * 100) },
  });

  await auditLog({
    action: "product.create",
    userId: ctx.userId,
    userEmail: ctx.userEmail,
    role: ctx.role,
    targetType: "Product",
    targetId: product.id,
    businessId: effective,
    metadata: { name: product.name },
    ip: ctx.ip,
  });

  return NextResponse.json({ data: product }, { status: 201, headers: rate.headers });
}
