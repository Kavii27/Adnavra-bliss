import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateSubscriptionSchema } from "@/schemas/subscription";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { auditLog, getAuditIp } from "@/lib/audit";

function getClientIp(request: NextRequest): string {
  const f = request.headers.get("x-forwarded-for");
  if (f) return f.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * PATCH /api/admin/businesses/[id]/subscription
 * Step 9 — manual plan assignment (no payment gateway yet: salon pays
 * outside the platform, an admin flips the plan here).
 *
 * - ADMIN only. Middleware is the first gate; this handler re-checks.
 * - Validates with Zod before touching the DB.
 * - Rate-limited like other mutating routes.
 * - Upserts: onboarding creates STARTER, but older rows may lack a
 *   Subscription — update alone would 500 with P2025 on those.
 * - Keeps Business.marketplacePriority in sync with PREMIUM (Step 6.4)
 *   so the "Featured" badge follows the plan with no extra step.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: businessId } = await params;

  const session = await auth().catch(() => null);
  const role = (session?.user as unknown as { role?: string } | undefined)?.role ?? null;
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rl = await rateLimit(`admin-subscription-update:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 30) });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const business = await db.business.findUnique({ where: { id: businessId }, select: { id: true } });
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const { plan, status } = parsed.data;

  const updated = await db.subscription.upsert({
    where: { businessId },
    create: {
      businessId,
      plan,
      status: status ?? "ACTIVE",
      currentPeriodStart: new Date(),
    },
    update: {
      plan,
      ...(status ? { status } : {}),
      currentPeriodStart: new Date(),
    },
  });

  // Keep marketplacePriority in sync with Premium (Step 6.4)
  await db.business.update({
    where: { id: businessId },
    data: { marketplacePriority: plan === "PREMIUM" },
  });

  const actorId = (session.user as unknown as { id: string }).id;
  await auditLog({
    action: "subscription.update",
    userId: actorId,
    userEmail: session.user.email ?? null,
    role,
    targetType: "Subscription",
    targetId: updated.id,
    businessId,
    metadata: { plan, ...(status ? { status } : {}) },
    ip: getAuditIp(request.headers) ?? ip,
  });

  return NextResponse.json({ data: updated }, { headers: rateLimitHeaders(rl, 30) });
}
