import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/audit-logs?businessId=&action=&page=&limit=
 * ADMIN: can query any businessId, or all logs paginated
 * OWNER/STAFF: can query only their own business logs
 * Always paginated, never unbounded.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as unknown as { role: string }).role;
  const sessionBusinessId = (session.user as unknown as { businessId: string | null }).businessId;

  if (!["OWNER", "STAFF", "ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const requestedBusinessId = searchParams.get("businessId");
  const action = searchParams.get("action");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const skip = (page - 1) * limit;

  let businessId: string | null = null;
  if (role === "ADMIN") {
    businessId = requestedBusinessId;
  } else {
    if (!sessionBusinessId) return NextResponse.json({ error: "No business linked" }, { status: 400 });
    if (requestedBusinessId && requestedBusinessId !== sessionBusinessId) {
      return NextResponse.json({ error: "Forbidden: cannot view another business's logs" }, { status: 403 });
    }
    businessId = sessionBusinessId;
  }

  const where: Record<string, unknown> = {};
  if (businessId) (where as Record<string, unknown>).businessId = businessId;
  if (action) (where as Record<string, unknown>).action = action;

  const [data, total] = await Promise.all([
    db.auditLog.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.auditLog.count({ where: where as never }),
  ]);

  return NextResponse.json({ data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}
