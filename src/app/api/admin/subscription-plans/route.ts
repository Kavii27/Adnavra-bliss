import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { auditLog, getAuditIp } from "@/lib/audit";
import { createSubscriptionPlanSchema } from "@/schemas/subscriptionPlan";

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
 * GET /api/admin/subscription-plans
 * ADMIN only. Lists every plan (active and disabled) so the admin UI can
 * show the full plan builder/editor list, not just what's currently live.
 */
export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const plans = await db.subscriptionPlan.findMany({ orderBy: { rank: "asc" } });
  return NextResponse.json({ data: plans });
}

/**
 * POST /api/admin/subscription-plans
 * ADMIN only. Creates a new plan (e.g. a 4th tier later) without any code
 * change — this is the "configurable from the Admin Dashboard" requirement.
 */
export async function POST(request: NextRequest) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { session, role } = gate;

  const ip = getClientIp(request);
  const rl = await rateLimit(`admin-plan-create:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 20) });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSubscriptionPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.subscriptionPlan.findUnique({ where: { key: parsed.data.key }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: "A plan with that key already exists" }, { status: 409 });
  }

  const plan = await db.subscriptionPlan.create({
    data: { ...parsed.data, features: parsed.data.features as Prisma.InputJsonValue | undefined },
  });

  const actorId = (session!.user as unknown as { id: string }).id;
  await auditLog({
    action: "admin.subscription_plan_create",
    userId: actorId,
    userEmail: session!.user.email ?? null,
    role,
    targetType: "SubscriptionPlan",
    targetId: plan.id,
    metadata: { key: plan.key, name: plan.name },
    ip: getAuditIp(request.headers) ?? ip,
  });

  return NextResponse.json({ data: plan }, { status: 201, headers: rateLimitHeaders(rl, 20) });
}
