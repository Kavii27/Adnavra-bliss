import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { auditLog, getAuditIp } from "@/lib/audit";
import { createBoost, isBoostActive } from "@/lib/boosting-service";
import { createBoostSchema } from "@/schemas/boost";

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
 * GET /api/admin/boosts
 * ADMIN only. Lists every boost (active + history — nothing is deleted,
 * only cancelled), newest first, with the salon's name for display.
 * PDF: "Active boosts" + "Boost history" dashboard sections read from here.
 */
export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const now = new Date();
  const boosts = await db.salonBoost.findMany({
    include: { business: { select: { name: true, slug: true } } },
    orderBy: { startAt: "desc" },
    take: 200,
  });

  const data = boosts.map((b) => ({ ...b, isActive: isBoostActive(b, now) }));
  return NextResponse.json({ data });
}

/**
 * POST /api/admin/boosts
 * ADMIN only. Manually boosts a business right now — the "allow admins to
 * manually boost a salon" requirement. Manual boosts bypass the plan's
 * weekly-limit check (see lib/boosting-service.ts), matching how the
 * existing engine already distinguishes AUTO vs MANUAL.
 */
export async function POST(request: NextRequest) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { session, role } = gate;

  const ip = getClientIp(request);
  const rl = await rateLimit(`admin-boost-create:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 30) });
  }

  const body = await request.json().catch(() => null);
  const parsed = createBoostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const actorId = (session!.user as unknown as { id: string }).id;

  let boost;
  try {
    boost = await createBoost({ businessId: parsed.data.businessId, source: "MANUAL", createdByUserId: actorId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create boost";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  await auditLog({
    action: "admin.boost_create",
    userId: actorId,
    userEmail: session!.user.email ?? null,
    role,
    targetType: "SalonBoost",
    targetId: boost.id,
    businessId: parsed.data.businessId,
    metadata: { source: "MANUAL" },
    ip: getAuditIp(request.headers) ?? ip,
  });

  return NextResponse.json({ data: boost }, { status: 201, headers: rateLimitHeaders(rl, 30) });
}
