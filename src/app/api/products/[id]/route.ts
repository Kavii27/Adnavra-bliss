import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/audit";
import { updateProductSchema } from "@/schemas/product";
import {
  forbiddenBusinessResponse,
  guardMutation,
  lockedResponse,
} from "@/lib/api-guard";
import { requirePlanFeature } from "@/lib/require-plan";

/** PATCH /api/products/:id — OWNER/ADMIN of the owning business. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await guardMutation(request, ["OWNER", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ctx.role !== "ADMIN" && existing.businessId !== ctx.sessionBusinessId) {
    return forbiddenBusinessResponse(!!ctx.sessionBusinessId);
  }
  try {
    await requirePlanFeature(existing.businessId, "retailProducts");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }

  const body = await request.json().catch(() => null);
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { price, ...rest } = parsed.data;
  const updated = await db.product.update({
    where: { id },
    data: { ...rest, ...(price !== undefined ? { price: Math.round(price * 100) } : {}) },
  });

  await auditLog({
    action: "product.update",
    userId: ctx.userId,
    userEmail: ctx.userEmail,
    role: ctx.role,
    targetType: "Product",
    targetId: id,
    businessId: existing.businessId,
    metadata: { name: updated.name },
    ip: ctx.ip,
  });

  return NextResponse.json({ data: updated });
}

/** DELETE /api/products/:id — OWNER/ADMIN of the owning business. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await guardMutation(request, ["OWNER", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ctx.role !== "ADMIN" && existing.businessId !== ctx.sessionBusinessId) {
    return forbiddenBusinessResponse(!!ctx.sessionBusinessId);
  }
  try {
    await requirePlanFeature(existing.businessId, "retailProducts");
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }

  await db.product.delete({ where: { id } });

  await auditLog({
    action: "product.delete",
    userId: ctx.userId,
    userEmail: ctx.userEmail,
    role: ctx.role,
    targetType: "Product",
    targetId: id,
    businessId: existing.businessId,
    metadata: { name: existing.name },
    ip: ctx.ip,
  });

  return NextResponse.json({ ok: true });
}
