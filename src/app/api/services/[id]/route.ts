import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateServiceSchema } from "@/schemas/service";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

function getClientIp(req: NextRequest): string {
  const f = req.headers.get("x-forwarded-for");
  if (f) return f.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

async function checkOwnership(serviceId: string, sessionBusinessId: string | null, role: string) {
  const svc = await db.service.findUnique({ where: { id: serviceId } });
  if (!svc) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }), svc: null };
  if (role !== "ADMIN" && svc.businessId !== sessionBusinessId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), svc: null };
  }
  return { error: null, svc };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const svc = await db.service.findUnique({ where: { id } });
  if (!svc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: svc });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as unknown as { role: string }).role;
  const sessionBusinessId = (session.user as unknown as { businessId: string | null }).businessId;
  if (!["OWNER", "STAFF", "ADMIN"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error, svc } = await checkOwnership(id, sessionBusinessId, role);
  if (error) return error;
  void svc;

  const ip = getClientIp(request);
  const rl = await rateLimit(`service-update:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 30) });

  const body = await request.json().catch(() => null);
  const parsed = updateServiceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.durationMin !== undefined) data.duration = parsed.data.durationMin;
  if (parsed.data.price !== undefined) data.price = Math.round(parsed.data.price * 100);
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
  if (parsed.data.category !== undefined) data.category = parsed.data.category ?? null;
  if (parsed.data.imageUrl !== undefined) data.imageUrl = parsed.data.imageUrl || null;

  const updated = await db.service.update({ where: { id }, data });
  await auditLog({
    action: "service.update",
    userId: (session.user as unknown as { id: string }).id,
    userEmail: session.user.email ?? null,
    role,
    targetType: "Service",
    targetId: id,
    businessId: svc?.businessId ?? null,
    metadata: { fields: Object.keys(data) },
    ip,
  });
  return NextResponse.json({ data: updated }, { headers: rateLimitHeaders(rl, 30) });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as unknown as { role: string }).role;
  const sessionBusinessId = (session.user as unknown as { businessId: string | null }).businessId;
  if (!["OWNER", "ADMIN"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await checkOwnership(id, sessionBusinessId, role);
  if (error) return error;

  // Soft delete: mark inactive to preserve booking history, but hard delete if no bookings
  const count = await db.booking.count({ where: { serviceId: id } });
  const actorId = (session.user as unknown as { id: string }).id;
  if (count > 0) {
    const updated = await db.service.update({ where: { id }, data: { isActive: false } });
    await auditLog({
      action: "service.delete",
      userId: actorId,
      userEmail: session.user.email ?? null,
      role,
      targetType: "Service",
      targetId: id,
      metadata: { soft: true },
      ip: _request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? _request.headers.get("x-real-ip") ?? null,
    });
    return NextResponse.json({ data: updated, message: "Service deactivated (has bookings)" });
  }
  await db.service.delete({ where: { id } });
  await auditLog({
    action: "service.delete",
    userId: actorId,
    userEmail: session.user.email ?? null,
    role,
    targetType: "Service",
    targetId: id,
    metadata: { hard: true },
    ip: _request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? _request.headers.get("x-real-ip") ?? null,
  });
  return NextResponse.json({ message: "Deleted" });
}
