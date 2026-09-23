import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { upsertSettingSchema, type SettingKey } from "@/schemas/businessSetting";
import {
  checkRateLimit,
  forbiddenBusinessResponse,
  guardMutation,
  lockedResponse,
  resolveBusinessId,
} from "@/lib/api-guard";
import { requirePlanFeature } from "@/lib/require-plan";
import type { Feature } from "@/lib/plan-features";

/** Which plan feature guards each settings section (Priority 1 matrix). */
const KEY_FEATURE: Record<SettingKey, Feature> = {
  clients: "clientSettings",
  payments: "paymentSettings",
  sales: "salesSettings",
  forms: "intakeForms",
  marketing: "promotions",
  scheduling: "advancedScheduling",
  loyalty: "loyaltyProgram",
  branches: "multiBranch",
};

/** GET /api/business-settings?businessId=...&key=clients */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("businessId");
  const key = searchParams.get("key");
  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }
  const session = await auth().catch(() => null);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as unknown as { role: string }).role;
  const sessionBusinessId = (session.user as unknown as { businessId: string | null }).businessId;
  if (role !== "ADMIN" && sessionBusinessId !== businessId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const where = { businessId, ...(key ? { key } : {}) };
  const rows = await db.businessSetting.findMany({ where, orderBy: { key: "asc" } });
  return NextResponse.json({ data: rows });
}

/** PUT /api/business-settings — upsert one section. Gated by that section's feature. */
export async function PUT(request: NextRequest) {
  const g = await guardMutation(request, ["OWNER", "ADMIN"]);
  if ("error" in g) return g.error;
  const { ctx } = g;

  const rate = await checkRateLimit(`settings:${ctx.ip}`, 60);
  if ("error" in rate) return rate.error;

  const body = await request.json().catch(() => null);
  const parsed = upsertSettingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const effective = resolveBusinessId(ctx.role, ctx.sessionBusinessId, parsed.data.businessId);
  if (!effective) return forbiddenBusinessResponse(!!ctx.sessionBusinessId);

  try {
    await requirePlanFeature(effective, KEY_FEATURE[parsed.data.key]);
  } catch (e) {
    const r = lockedResponse(e);
    if (r) return r;
    throw e;
  }

  // The marketing section's priority toggle also flips the indexed Business
  // column so marketplace search can weight it without a join.
  if (parsed.data.key === "marketing") {
    const priority = (parsed.data.value as Record<string, unknown>).priorityPlacement === true;
    try {
      await requirePlanFeature(effective, "campaigns");
      await db.business.update({ where: { id: effective }, data: { marketplacePriority: priority } });
    } catch {
      // Starter/Professional salons keep whatever priority they had (default
      // false) — the rest of the marketing settings still save.
      if (priority) {
        return NextResponse.json(
          { error: "upgrade_required", feature: "campaigns" },
          { status: 403 },
        );
      }
    }
  }

  const row = await db.businessSetting.upsert({
    where: { businessId_key: { businessId: effective, key: parsed.data.key } },
    create: { businessId: effective, key: parsed.data.key, value: parsed.data.value as Prisma.InputJsonValue },
    update: { value: parsed.data.value as Prisma.InputJsonValue },
  });
  return NextResponse.json({ data: row }, { headers: rate.headers });
}
