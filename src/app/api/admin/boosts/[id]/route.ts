import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { auditLog, getAuditIp } from "@/lib/audit";
import { cancelBoost } from "@/lib/boosting-service";

function getClientIp(request: NextRequest): string {
  const f = request.headers.get("x-forwarded-for");
  if (f) return f.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

async function requireAdmin() {
  const session = await auth().catch(() => null);
  const role = (session?.user as unknown as { role?: string } | undefined)?.role ?? null;
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session, role };
}

/**
 * DELETE /api/admin/boosts/[id]
 * ADMIN only. Cancels a boost — the "allow admins to remove/cancel a boost"
 * requirement. This is a soft cancel (sets cancelledAt), never a row
 * delete, so it stays in the boost history log.
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { session, role } = gate;

  const ip = getClientIp(request);
  const rl = await rateLimit(`admin-boost-cancel:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 30) });
  }

  const existing = await db.salonBoost.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Boost not found" }, { status: 404 });
  }
  if (existing.cancelledAt) {
    return NextResponse.json({ error: "Boost is already cancelled" }, { status: 409 });
  }

  const cancelled = await cancelBoost(id);

  const actorId = (session!.user as unknown as { id: string }).id;
  await auditLog({
    action: "admin.boost_cancel",
    userId: actorId,
    userEmail: session!.user.email ?? null,
    role,
    targetType: "SalonBoost",
    targetId: id,
    businessId: existing.businessId,
    ip: getAuditIp(request.headers),
  });

  return NextResponse.json({ data: cancelled }, { headers: rateLimitHeaders(rl, 30) });
}
