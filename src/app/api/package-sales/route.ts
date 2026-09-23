import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { createPackageSaleSchema, updatePackageSaleSchema } from "@/schemas/sale";
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
  customer: { select: { id: true, name: true } },
  pkg: { select: { id: true, name: true } },
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
    await requirePlanFeature(businessId, "packagesSold");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }
  const { page, limit, skip } = pageParams(searchParams);
  const where = { businessId };
  const [data, total] = await Promise.all([
    db.packageSale.findMany({ where, include: includeRel, orderBy: { soldAt: "desc" }, skip, take: limit }),
    db.packageSale.count({ where }),
  ]);
  return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function POST(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "STAFF", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const rate = await checkRateLimit(`package-sale:${ctx.ip}`, 60);
  if ("error" in rate) return rate.error;

  const body = await request.json().catch(() => null);
  const parsed = createPackageSaleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const effective = resolveBusinessId(ctx.role, ctx.sessionBusinessId, parsed.data.businessId);
  if (!effective) return forbiddenBusinessResponse(!!ctx.sessionBusinessId);

  try {
    await requirePlanFeature(effective, "packagesSold");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }

  let packageName = parsed.data.packageName?.trim() ?? "";
  if (parsed.data.packageId) {
    const pkg = await db.package.findFirst({
      where: { id: parsed.data.packageId, businessId: effective },
      select: { id: true, name: true },
    });
    if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });
    packageName = pkg.name;
  }
  if (!packageName) {
    return NextResponse.json({ error: "packageId or packageName is required" }, { status: 400 });
  }
  if (parsed.data.customerId) {
    const cust = await db.customer.findFirst({
      where: { id: parsed.data.customerId, businessId: effective },
      select: { id: true },
    });
    if (!cust) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const sale = await db.packageSale.create({
    data: {
      businessId: effective,
      packageId: parsed.data.packageId ?? null,
      packageName,
      customerId: parsed.data.customerId ?? null,
      pricePaid: Math.round(parsed.data.pricePaid * 100),
      status: parsed.data.status ?? "ACTIVE",
    },
    include: includeRel,
  });

  // Mirror into the detailed sales ledger so Sales + Daily summary stay consistent.
  await db.saleRecord.create({
    data: {
      businessId: effective,
      category: "PACKAGE",
      label: `Package: ${packageName}`,
      amount: sale.pricePaid,
      status: "COMPLETED",
      customerId: sale.customerId,
    },
  });

  await auditLog({
    action: "package-sale.create",
    userId: ctx.userId,
    userEmail: ctx.userEmail,
    role: ctx.role,
    targetType: "PackageSale",
    targetId: sale.id,
    businessId: effective,
    metadata: { packageName },
    ip: ctx.ip,
  });

  return NextResponse.json({ data: sale }, { status: 201, headers: rate.headers });
}

export async function PATCH(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "STAFF", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const existing = await db.packageSale.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ctx.role !== "ADMIN" && existing.businessId !== ctx.sessionBusinessId) {
    return forbiddenBusinessResponse(!!ctx.sessionBusinessId);
  }
  try {
    await requirePlanFeature(existing.businessId, "packagesSold");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }

  const body = await request.json().catch(() => null);
  const parsed = updatePackageSaleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const updated = await db.packageSale.update({ where: { id }, data: parsed.data, include: includeRel });
  return NextResponse.json({ data: updated });
}
