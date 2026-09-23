import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { auditLog, getAuditIp } from "@/lib/audit";
import { adminCreateBusinessSchema } from "@/schemas/business";

function getClientIp(request: NextRequest): string {
  const f = request.headers.get("x-forwarded-for");
  if (f) return f.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * POST /api/admin/businesses
 * Admin-run onboarding (Task 3.2): creates the Business row (plus its
 * STARTER Subscription) AND the salon owner's OWNER login in one
 * transaction, then returns a one-time temporary password.
 *
 * - ADMIN only. Middleware/layout is the first gate; this handler re-checks.
 * - Zod-validated before touching the DB (AGENTS.md).
 * - Rate-limited like other mutating routes.
 * - The plaintext temp password is returned ONCE in the response — never
 *   stored, never logged (audit metadata only records the emails/slug).
 *   The admin must copy it now and hand it to the salon owner, who should
 *   change it after first login (reset-password flow).
 */
export async function POST(request: NextRequest) {
  const session = await auth().catch(() => null);
  const role = (session?.user as unknown as { role?: string } | undefined)?.role ?? null;
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rl = await rateLimit(`admin-business-create:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 20) });
  }

  const body = await request.json().catch(() => null);
  const parsed = adminCreateBusinessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { ownerName, ownerEmail, ownerPhone, ...businessFields } = parsed.data;

  const [slugTaken, emailTaken] = await Promise.all([
    db.business.findUnique({ where: { slug: businessFields.slug }, select: { id: true } }),
    db.user.findUnique({ where: { email: ownerEmail }, select: { id: true } }),
  ]);
  if (slugTaken) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }
  if (emailTaken) {
    return NextResponse.json(
      { error: "An account with that owner email already exists." },
      { status: 409 },
    );
  }

  // 12 random bytes → 16 URL-safe chars. Enough entropy for a single-use
  // temp password the owner replaces on first login.
  const temporaryPassword = randomBytes(12).toString("base64url");
  const hashed = await hashPassword(temporaryPassword);

  const result = await db.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name: businessFields.name,
        slug: businessFields.slug,
        description: businessFields.description ?? null,
        phone: businessFields.phone ?? null,
        email: businessFields.email ?? null,
        address: businessFields.address ?? null,
        city: businessFields.city ?? null,
        district: businessFields.district ?? null,
        categories: businessFields.categories ?? [],
        salonTypes: businessFields.salonTypes ?? [],
      },
    });
    await tx.subscription.create({
      data: { businessId: business.id, plan: "STARTER", status: "ACTIVE" },
    });
    const owner = await tx.user.create({
      data: {
        email: ownerEmail,
        password: hashed,
        name: ownerName,
        role: "OWNER",
        businessId: business.id,
        phone: ownerPhone ?? null,
      },
      select: { id: true, email: true, name: true, role: true, businessId: true },
    });
    return { business, owner };
  });

  const actorId = (session.user as unknown as { id: string }).id;
  await auditLog({
    action: "admin.business_create",
    userId: actorId,
    userEmail: session.user.email ?? null,
    role,
    targetType: "Business",
    targetId: result.business.id,
    businessId: result.business.id,
    // Never include the temp password here — auditLog redacts
    // password/token keys anyway, but don't pass it at all.
    metadata: { slug: result.business.slug, ownerEmail: result.owner.email },
    ip: getAuditIp(request.headers) ?? ip,
  });

  return NextResponse.json(
    {
      data: { business: result.business, owner: result.owner },
      // Shown once — the admin UI displays it in a "copy now" box.
      temporaryPassword,
    },
    { status: 201, headers: rateLimitHeaders(rl, 20) },
  );
}
