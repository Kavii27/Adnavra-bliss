import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { auditLog, getAuditIp } from "@/lib/audit";
import { assignBusinessSubscriptionSchema } from "@/schemas/businessSubscription";

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
 * GET /api/admin/businesses/[id]/business-subscription
 * ADMIN only. Returns this salon's current plan + status + dates — the
 * "view subscription status" requirement. Returns { data: null } if the
 * salon has never been assigned a plan in the new system (not an error).
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: businessId } = await params;
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const subscription = await db.businessSubscription.findUnique({
    where: { businessId },
    include: { plan: true },
  });
  return NextResponse.json({ data: subscription });
}

/**
 * PATCH /api/admin/businesses/[id]/business-subscription
 * ADMIN only. Assigns/changes a salon's plan, enables/disables it (status),
 * and sets start/end dates — Task-2's "Salon Subscription Assignment".
 * Upserts: a salon may not have a row in the new system yet.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: businessId } = await params;
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { session, role } = gate;

  const ip = getClientIp(request);
  const rl = await rateLimit(`admin-business-subscription-update:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 30) });
  }

  const body = await request.json().catch(() => null);
  const parsed = assignBusinessSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const [business, plan] = await Promise.all([
    db.business.findUnique({ where: { id: businessId }, select: { id: true } }),
    db.subscriptionPlan.findUnique({ where: { key: parsed.data.planKey } }),
  ]);
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }
  if (!plan) {
    return NextResponse.json({ error: "Unknown plan key" }, { status: 400 });
  }

  const { status, startDate, endDate } = parsed.data;

  const updated = await db.businessSubscription.upsert({
    where: { businessId },
    create: {
      businessId,
      planId: plan.id,
      status: status ?? "ACTIVE",
      startDate: startDate ?? new Date(),
      endDate: endDate ?? null,
    },
    update: {
      planId: plan.id,
      ...(status ? { status } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate !== undefined ? { endDate } : {}),
    },
    include: { plan: true },
  });

  const actorId = (session!.user as unknown as { id: string }).id;
  await auditLog({
    action: "admin.business_subscription_update",
    userId: actorId,
    userEmail: session!.user.email ?? null,
    role,
    targetType: "BusinessSubscription",
    targetId: updated.id,
    businessId,
    metadata: { planKey: plan.key, status: updated.status },
    ip: getAuditIp(request.headers) ?? ip,
  });

  return NextResponse.json({ data: updated }, { headers: rateLimitHeaders(rl, 30) });
}
