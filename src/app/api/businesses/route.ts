import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createBusinessSchema } from "@/schemas/business";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

function getClientIp(req: NextRequest): string {
  const f = req.headers.get("x-forwarded-for");
  if (f) return f.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * GET /api/businesses
 * - OWNER/STAFF: returns own business only (businessId from session)
 * - ADMIN: paginated list of all businesses
 * - unauthenticated: 401
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as unknown as { role: string }).role;
  const sessionBusinessId = (session.user as unknown as { businessId: string | null }).businessId;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const skip = (page - 1) * limit;

  if (role === "ADMIN") {
    const [data, total] = await Promise.all([
      db.business.findMany({ orderBy: { createdAt: "desc" }, skip, take: limit }),
      db.business.count(),
    ]);
    return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  }

  if (!sessionBusinessId) {
    return NextResponse.json({ data: [], pagination: { page, limit, total: 0, pages: 0 } });
  }
  const business = await db.business.findUnique({ where: { id: sessionBusinessId } });
  return NextResponse.json({ data: business ? [business] : [], pagination: { page: 1, limit: 1, total: business ? 1 : 0, pages: business ? 1 : 0 } });
}

/**
 * POST /api/businesses: OWNER creates their business profile (once)
 * Rate-limited, Zod validated, businessId scoping enforced.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as unknown as { role: string }).role;
  const sessionBusinessId = (session.user as unknown as { businessId: string | null }).businessId;
  const userId = (session.user as unknown as { id: string }).id;

  if (!["OWNER", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (role === "OWNER" && sessionBusinessId) {
    return NextResponse.json({ error: "Business already exists for this account" }, { status: 409 });
  }

  const ip = getClientIp(request);
  const rl = await rateLimit(`business-create:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 10) });

  const body = await request.json().catch(() => null);
  const parsed = createBusinessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  // slug unique
  const exists = await db.business.findUnique({ where: { slug: parsed.data.slug } });
  if (exists) return NextResponse.json({ error: "Slug already taken" }, { status: 409 });

  const business = await db.$transaction(async (tx) => {
    const b = await tx.business.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description ?? null,
        phone: parsed.data.phone ?? null,
        email: parsed.data.email ?? null,
        address: parsed.data.address ?? null,
        logoUrl: parsed.data.logoUrl || null,
        openingHours: parsed.data.openingHours ?? undefined,
        website: parsed.data.website || null,
        categories: parsed.data.categories ?? [],
        salonTypes: parsed.data.salonTypes ?? [],
        teamSize: parsed.data.teamSize ?? null,
        locationType: parsed.data.locationType ?? null,
        district: parsed.data.district ?? null,
        city: parsed.data.city ?? null,
        county: parsed.data.county ?? null,
        state: parsed.data.state ?? null,
        postcode: parsed.data.postcode ?? null,
        directions: parsed.data.directions ?? null,
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
      },
    });
    await tx.subscription.create({ data: { businessId: b.id, plan: "STARTER", status: "ACTIVE" } });
    // link user to business if OWNER without business
    if (role === "OWNER") {
      await tx.user.update({ where: { id: userId }, data: { businessId: b.id } });
    }
    return b;
  });

  await auditLog({
    action: "business.create",
    userId,
    userEmail: session.user.email ?? null,
    role,
    targetType: "Business",
    targetId: business.id,
    businessId: business.id,
    metadata: { slug: business.slug, name: business.name },
    ip,
  });

  return NextResponse.json({ data: business }, { status: 201, headers: rateLimitHeaders(rl, 10) });
}
