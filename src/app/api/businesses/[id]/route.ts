import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateBusinessSchema } from "@/schemas/business";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

function getClientIp(req: NextRequest): string {
  const f = req.headers.get("x-forwarded-for");
  if (f) return f.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as unknown as { role: string }).role;
  const sessionBusinessId = (session.user as unknown as { businessId: string | null }).businessId;

  if (role !== "ADMIN" && id !== sessionBusinessId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const business = await db.business.findUnique({ where: { id } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: business });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as unknown as { role: string }).role;
  const sessionBusinessId = (session.user as unknown as { businessId: string | null }).businessId;

  if (role !== "ADMIN" && id !== sessionBusinessId) {
    return NextResponse.json({ error: "Forbidden: cannot edit another business" }, { status: 403 });
  }
  if (!["OWNER", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rl = await rateLimit(`business-update:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 });
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 20) });

  const body = await request.json().catch(() => null);
  const parsed = updateBusinessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  // if slug is being changed, check uniqueness
  if (parsed.data.slug) {
    const exists = await db.business.findUnique({ where: { slug: parsed.data.slug } });
    if (exists && exists.id !== id) return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }

  const updated = await db.business.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.slug !== undefined ? { slug: parsed.data.slug } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
      ...(parsed.data.email !== undefined ? { email: parsed.data.email } : {}),
      ...(parsed.data.address !== undefined ? { address: parsed.data.address } : {}),
      ...(parsed.data.logoUrl !== undefined ? { logoUrl: parsed.data.logoUrl || null } : {}),
      ...(parsed.data.openingHours !== undefined ? { openingHours: parsed.data.openingHours ?? undefined } : {}),
      ...(parsed.data.website !== undefined ? { website: parsed.data.website || null } : {}),
      ...(parsed.data.categories !== undefined ? { categories: parsed.data.categories } : {}),
      ...(parsed.data.salonTypes !== undefined ? { salonTypes: parsed.data.salonTypes } : {}),
      ...(parsed.data.teamSize !== undefined ? { teamSize: parsed.data.teamSize } : {}),
      ...(parsed.data.locationType !== undefined ? { locationType: parsed.data.locationType } : {}),
      ...(parsed.data.district !== undefined ? { district: parsed.data.district } : {}),
      ...(parsed.data.city !== undefined ? { city: parsed.data.city } : {}),
      ...(parsed.data.county !== undefined ? { county: parsed.data.county } : {}),
      ...(parsed.data.state !== undefined ? { state: parsed.data.state } : {}),
      ...(parsed.data.postcode !== undefined ? { postcode: parsed.data.postcode } : {}),
      ...(parsed.data.directions !== undefined ? { directions: parsed.data.directions } : {}),
      ...(parsed.data.latitude !== undefined ? { latitude: parsed.data.latitude } : {}),
      ...(parsed.data.longitude !== undefined ? { longitude: parsed.data.longitude } : {}),
    },
  });

  await auditLog({
    action: "business.update",
    userId: (session.user as unknown as { id: string }).id,
    userEmail: session.user.email ?? null,
    role,
    targetType: "Business",
    targetId: id,
    businessId: id,
    metadata: { fields: Object.keys(parsed.data) },
    ip,
  });

  return NextResponse.json({ data: updated }, { headers: rateLimitHeaders(rl, 20) });
}
