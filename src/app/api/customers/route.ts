import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { FeatureLockedError, requirePlanFeature } from "@/lib/require-plan";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as unknown as { role: string }).role;
  const sessionBusinessId = (session.user as unknown as { businessId: string | null }).businessId;
  if (!["OWNER", "STAFF", "ADMIN"].includes(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const requestedBusinessId = searchParams.get("businessId");
  const q = searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const skip = (page - 1) * limit;

  let businessId: string | null = null;
  if (role === "ADMIN") {
    if (!requestedBusinessId) return NextResponse.json({ error: "businessId required for admin" }, { status: 400 });
    businessId = requestedBusinessId;
  } else {
    if (!sessionBusinessId) return NextResponse.json({ error: "No business linked" }, { status: 400 });
    if (requestedBusinessId && requestedBusinessId !== sessionBusinessId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    businessId = sessionBusinessId;
  }

  // Plan gate: customer database + booking history is PROFESSIONAL and up.
  try {
    await requirePlanFeature(businessId!, "clientDatabase");
  } catch (e) {
    if (e instanceof FeatureLockedError) {
      return NextResponse.json({ error: "upgrade_required", feature: e.feature }, { status: 403 });
    }
    throw e;
  }

  const where: Record<string, unknown> = { businessId: businessId! };
  if (q) {    (where as Record<string, unknown>).OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    db.customer.findMany({ where: where as never, orderBy: { createdAt: "desc" }, skip, take: limit }),
    db.customer.count({ where: where as never }),
  ]);

  return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}
