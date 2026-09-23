import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { createPackageSchema, updatePackageSchema } from "@/schemas/package";
import {
  checkRateLimit,
  forbiddenBusinessResponse,
  guardMutation,
  lockedResponse,
  pageParams,
  resolveBusinessId,
} from "@/lib/api-guard";
import { requirePlanFeature } from "@/lib/require-plan";

const includeItems = {
  items: { include: { service: { select: { id: true, name: true, price: true } } } },
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
    await requirePlanFeature(businessId, "packageCatalog");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }
  const { page, limit, skip } = pageParams(searchParams);
  const where = { businessId };
  const [data, total] = await Promise.all([
    db.package.findMany({ where, include: includeItems, orderBy: { createdAt: "desc" }, skip, take: limit }),
    db.package.count({ where }),
  ]);
  return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function POST(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const rate = await checkRateLimit(`package-create:${ctx.ip}`, 30);
  if ("error" in rate) return rate.error;

  const body = await request.json().catch(() => null);
  const parsed = createPackageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { businessId: requestedBusinessId, price, items } = parsed.data;
  const effective = resolveBusinessId(ctx.role, ctx.sessionBusinessId, requestedBusinessId);
  if (!effective) return forbiddenBusinessResponse(!!ctx.sessionBusinessId);

  try {
    await requirePlanFeature(effective, "packageCatalog");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }

  // Every bundled service must belong to the same business.
  const serviceIds = parsed.data.items.map((i) => i.serviceId);
  const services = await db.service.findMany({
    where: { id: { in: serviceIds }, businessId: effective },
    select: { id: true },
  });
  if (services.length !== new Set(serviceIds).size) {
    return NextResponse.json({ error: "All bundled services must belong to your business" }, { status: 400 });
  }

  const pkg = await db.package.create({
    data: {
      businessId: effective,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      price: Math.round(price * 100),
      isActive: parsed.data.isActive ?? true,
      items: { create: items.map((i) => ({ serviceId: i.serviceId, quantity: i.quantity ?? 1 })) },
    },
    include: includeItems,
  });

  await auditLog({
    action: "package.create",
    userId: ctx.userId,
    userEmail: ctx.userEmail,
    role: ctx.role,
    targetType: "Package",
    targetId: pkg.id,
    businessId: effective,
    metadata: { name: pkg.name },
    ip: ctx.ip,
  });

  return NextResponse.json({ data: pkg }, { status: 201, headers: rate.headers });
}

export async function PATCH(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const existing = await db.package.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ctx.role !== "ADMIN" && existing.businessId !== ctx.sessionBusinessId) {
    return forbiddenBusinessResponse(!!ctx.sessionBusinessId);
  }
  try {
    await requirePlanFeature(existing.businessId, "packageCatalog");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }

  const body = await request.json().catch(() => null);
  const parsed = updatePackageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { price, items, ...rest } = parsed.data;
  const updated = await db.package.update({
    where: { id },
    data: {
      ...rest,
      ...(price !== undefined ? { price: Math.round(price * 100) } : {}),
      ...(items
        ? {
            items: {
              deleteMany: {},
              create: items.map((i) => ({ serviceId: i.serviceId, quantity: i.quantity ?? 1 })),
            },
          }
        : {}),
    },
    include: includeItems,
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

  const existing = await db.package.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ctx.role !== "ADMIN" && existing.businessId !== ctx.sessionBusinessId) {
    return forbiddenBusinessResponse(!!ctx.sessionBusinessId);
  }
  try {
    await requirePlanFeature(existing.businessId, "packageCatalog");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }
  await db.package.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
