import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createServiceSchema } from "@/schemas/service";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

function getClientIp(request: NextRequest): string {
  const f = request.headers.get("x-forwarded-for");
  if (f) return f.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * GET /api/services?businessId=...
 * Public for salon profile pages, but paginated and always filtered by businessId.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const skip = (page - 1) * limit;

  // If authenticated owner/staff of this business, show all services (including inactive) for dashboard management.
  // Public / unauthenticated callers only see active services.
  const session = await auth().catch(() => null);
  const sessionBusinessId = (session?.user as unknown as { businessId: string | null } | undefined)?.businessId ?? null;
  const isOwnerView = !!sessionBusinessId && sessionBusinessId === businessId;
  const where = isOwnerView ? { businessId } : { businessId, isActive: true };

  const [data, total] = await Promise.all([
    db.service.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    }),
    db.service.count({ where }),
  ]);

  return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

/**
 * POST /api/services: OWNER/STAFF only, businessId ownership re-checked server-side
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as unknown as { role: string }).role;
  const sessionBusinessId = (session.user as unknown as { businessId: string | null }).businessId;

  if (!["OWNER", "STAFF", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Mutating endpoints are rate-limited too (prevents abuse)
  const ip = getClientIp(request);
  const rl = await rateLimit(`service-create:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 20) });
  }

  const body = await request.json().catch(() => null);
  const parsed = createServiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { businessId, name, description, durationMin, price, category } = parsed.data;

  // Ownership: non-ADMIN must create only for their own business. Ignore client-supplied businessId if it does not match.
  let effectiveBusinessId = businessId;
  if (role !== "ADMIN") {
    if (!sessionBusinessId) {
      return NextResponse.json({ error: "No business linked to account" }, { status: 400 });
    }
    if (businessId !== sessionBusinessId) {
      return NextResponse.json({ error: "Forbidden: cannot create service for another business" }, { status: 403 });
    }
    effectiveBusinessId = sessionBusinessId;
  }

  const service = await db.service.create({
    data: {
      businessId: effectiveBusinessId,
      name,
      description: description ?? null,
      duration: durationMin,
      price: Math.round(price * 100), // store cents
      category: category ?? null,
    },
  });

  await auditLog({
    action: "service.create",
    userId: (session.user as unknown as { id: string }).id,
    userEmail: session.user.email ?? null,
    role,
    targetType: "Service",
    targetId: service.id,
    businessId: effectiveBusinessId,
    metadata: { name },
    ip,
  });

  return NextResponse.json({ data: service }, { status: 201, headers: rateLimitHeaders(rl, 20) });
}
