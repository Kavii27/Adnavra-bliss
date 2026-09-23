import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { auditLog, getAuditIp } from "@/lib/audit";
import { createAdvertisementPlacementSchema } from "@/schemas/advertisement";

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
 * GET /api/admin/advertisement-placements
 * ADMIN only. Lists every placement slot (homepage_top, search_results, ...)
 * — feeds the "select placement/location" dropdown on the ad creation form.
 */
export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const placements = await db.advertisementPlacement.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ data: placements });
}

/**
 * POST /api/admin/advertisement-placements
 * ADMIN only. Creates a new placement slot (e.g. a new banner location added
 * later) without a code change — placements are data, not hardcoded strings.
 */
export async function POST(request: NextRequest) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { session, role } = gate;

  const ip = getClientIp(request);
  const rl = await rateLimit(`admin-placement-create:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 20) });
  }

  const body = await request.json().catch(() => null);
  const parsed = createAdvertisementPlacementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.advertisementPlacement.findUnique({
    where: { key: parsed.data.key },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "A placement with that key already exists" }, { status: 409 });
  }

  const placement = await db.advertisementPlacement.create({ data: parsed.data });

  const actorId = (session!.user as unknown as { id: string }).id;
  await auditLog({
    action: "admin.advertisement_placement_create",
    userId: actorId,
    userEmail: session!.user.email ?? null,
    role,
    targetType: "AdvertisementPlacement",
    targetId: placement.id,
    metadata: { key: placement.key },
    ip: getAuditIp(request.headers) ?? ip,
  });

  return NextResponse.json({ data: placement }, { status: 201, headers: rateLimitHeaders(rl, 20) });
}
