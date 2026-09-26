import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { auditLog, getAuditIp } from "@/lib/audit";

function getClientIp(request: NextRequest): string {
  const f = request.headers.get("x-forwarded-for");
  if (f) return f.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * DELETE /api/admin/businesses/[id]
 * ADMIN only. Permanently removes a salon and everything tied to it
 * (services, bookings, staff, images, subscriptions, boosts, sales
 * history, etc.) via the ON DELETE CASCADE relations already defined on
 * every model in prisma/schema.prisma that has a businessId. This does
 * not delete the salon owner's User row's other data (there is none — a
 * User only ever belongs to one business), it deletes the User row too
 * (Business -> users has onDelete: Cascade).
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth().catch(() => null);
  const role = (session?.user as unknown as { role?: string } | undefined)?.role ?? null;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ip = getClientIp(request);
  const rl = await rateLimit(`admin-business-delete:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 10) });
  }

  const business = await db.business.findUnique({ where: { id }, select: { id: true, name: true, slug: true } });
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  await db.business.delete({ where: { id } });

  const actorId = (session.user as unknown as { id: string }).id;
  await auditLog({
    action: "admin.business_delete",
    userId: actorId,
    userEmail: session.user.email ?? null,
    role,
    targetType: "Business",
    targetId: id,
    metadata: { name: business.name, slug: business.slug },
    ip: getAuditIp(request.headers) ?? ip,
  });

  return NextResponse.json({ data: { deleted: true } }, { headers: rateLimitHeaders(rl, 10) });
}
