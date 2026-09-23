import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { auditLog, getAuditIp } from "@/lib/audit";
import { updateSubscriptionPlanSchema } from "@/schemas/subscriptionPlan";

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
 * PATCH /api/admin/subscription-plans/[id]
 * ADMIN only. Edits any plan field, including flipping `isActive` — the
 * "enable/disable a subscription plan" control, and the mechanism for
 * changing boost frequency / limits / search weight without a deploy.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { session, role } = gate;

  const ip = getClientIp(request);
  const rl = await rateLimit(`admin-plan-update:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 30) });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSubscriptionPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const plan = await db.subscriptionPlan.findUnique({ where: { id } });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  if (parsed.data.key && parsed.data.key !== plan.key) {
    const keyTaken = await db.subscriptionPlan.findUnique({ where: { key: parsed.data.key }, select: { id: true } });
    if (keyTaken) {
      return NextResponse.json({ error: "A plan with that key already exists" }, { status: 409 });
    }
  }

  const updated = await db.subscriptionPlan.update({
    where: { id },
    data: { ...parsed.data, features: parsed.data.features as Prisma.InputJsonValue | undefined },
  });

  const actorId = (session!.user as unknown as { id: string }).id;
  await auditLog({
    action: "admin.subscription_plan_update",
    userId: actorId,
    userEmail: session!.user.email ?? null,
    role,
    targetType: "SubscriptionPlan",
    targetId: updated.id,
    metadata: parsed.data,
    ip: getAuditIp(request.headers) ?? ip,
  });

  return NextResponse.json({ data: updated }, { headers: rateLimitHeaders(rl, 30) });
}
