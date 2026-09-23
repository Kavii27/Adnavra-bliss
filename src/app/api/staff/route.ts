import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createStaffSchema } from "@/schemas/staff";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import { FeatureLockedError, requirePlanFeature } from "@/lib/require-plan";

function getClientIp(request: NextRequest): string {
  const f = request.headers.get("x-forwarded-for");
  if (f) return f.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * GET /api/staff?businessId=...&page=1&limit=20&includeInactive=1
 * - Requires auth (OWNER/STAFF/ADMIN)
 * - Paginated, businessId-scoped. OWNER/STAFF see only their business.
 * - Public booking flow can fetch staff via this endpoint when authenticated? We allow public via businessId
 *   but filter isActive for unauthenticated. For dashboard we return all when session matches business.
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

  const session = await auth().catch(() => null);
  const sessionBusinessId = (session?.user as unknown as { businessId: string | null } | undefined)?.businessId ?? null;
  const role = (session?.user as unknown as { role: string } | undefined)?.role ?? null;

  // If caller is owner/staff of this business, show all staff (including inactive) for dashboard management
  const isOwnerView = !!sessionBusinessId && sessionBusinessId === businessId && !!role && ["OWNER", "STAFF", "ADMIN"].includes(role);
  const where = isOwnerView ? { businessId } : { businessId, isActive: true };

  // Public booking flow: when not owner view, only return minimal safe fields (id, name).
  // This supports `?public=true` per Phase 7 spec while also being safe by default.
  if (!isOwnerView) {
    const [data, total] = await Promise.all([
      db.staffMember.findMany({
        where,
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
        select: { id: true, name: true },
      }),
      db.staffMember.count({ where }),
    ]);
    return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  }

  const [data, total] = await Promise.all([
    db.staffMember.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    }),
    db.staffMember.count({ where }),
  ]);

  return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

/**
 * POST /api/staff: OWNER/ADMIN only, businessId ownership re-checked
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as unknown as { role: string }).role;
  const sessionBusinessId = (session.user as unknown as { businessId: string | null }).businessId;

  if (!["OWNER", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden: only owners can manage staff" }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rl = await rateLimit(`staff-create:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 30) });
  }

  const body = await request.json().catch(() => null);
  const parsed = createStaffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { businessId, name, email, phone, isActive } = parsed.data;

  let effectiveBusinessId = businessId;
  if (role !== "ADMIN") {
    if (!sessionBusinessId) {
      return NextResponse.json({ error: "No business linked to account" }, { status: 400 });
    }
    if (businessId !== sessionBusinessId) {
      return NextResponse.json({ error: "Forbidden: cannot create staff for another business" }, { status: 403 });
    }
    effectiveBusinessId = sessionBusinessId;
  } else {
    // ADMIN: ensure business exists
    const biz = await db.business.findUnique({ where: { id: businessId }, select: { id: true } });
    if (!biz) return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Plan gate: staff management is PROFESSIONAL and up. GET stays open because
  // the public booking flow needs the staff list; mutations are the gated part.
  try {
    await requirePlanFeature(effectiveBusinessId, "staffManagement");
  } catch (e) {
    if (e instanceof FeatureLockedError) {
      return NextResponse.json({ error: "upgrade_required", feature: e.feature }, { status: 403 });
    }
    throw e;
  }

  const staff = await db.staffMember.create({
    data: {
      businessId: effectiveBusinessId,
      name: name.trim(),
      email: email && email.trim() !== "" ? email.trim().toLowerCase() : null,
      phone: phone && phone.trim() !== "" ? phone.trim() : null,
      isActive: isActive ?? true,
    },
  });

  await auditLog({
    action: "staff.create",
    userId: (session.user as unknown as { id: string }).id,
    userEmail: session.user.email ?? null,
    role,
    targetType: "StaffMember",
    targetId: staff.id,
    businessId: effectiveBusinessId,
    metadata: { name },
    ip,
  });

  return NextResponse.json({ data: staff }, { status: 201, headers: rateLimitHeaders(rl, 30) });
}
