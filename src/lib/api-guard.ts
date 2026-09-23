import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { FeatureLockedError, requirePlanFeature } from "@/lib/require-plan";
import type { Feature } from "@/lib/plan-features";

export function getClientIp(request: NextRequest): string {
  const f = request.headers.get("x-forwarded-for");
  if (f) return f.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export type GuardContext = {
  userId: string;
  userEmail: string | null;
  role: string;
  sessionBusinessId: string | null;
  ip: string;
};

/**
 * Auth + role check shared by every Priority-2 mutating route.
 * Returns the context, or a ready-to-return error response.
 */
export async function guardMutation(
  request: NextRequest,
  allowedRoles: string[] = ["OWNER", "ADMIN"],
): Promise<{ ctx: GuardContext } | { error: NextResponse }> {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const role = (session.user as unknown as { role: string }).role;
  if (!allowedRoles.includes(role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return {
    ctx: {
      userId: (session.user as unknown as { id: string }).id,
      userEmail: session.user.email ?? null,
      role,
      sessionBusinessId: (session.user as unknown as { businessId: string | null }).businessId,
      ip: getClientIp(request),
    },
  };
}

/**
 * Ownership resolution: non-ADMIN callers can only act on their own business.
 * Returns the effective businessId, or null when forbidden / no business linked.
 */
export function resolveBusinessId(
  role: string,
  sessionBusinessId: string | null,
  requestedBusinessId: string,
): string | null {
  if (role === "ADMIN") return requestedBusinessId;
  if (!sessionBusinessId) return null;
  if (requestedBusinessId !== sessionBusinessId) return null;
  return sessionBusinessId;
}

export function forbiddenBusinessResponse(hasBusiness: boolean): NextResponse {
  if (!hasBusiness) {
    return NextResponse.json({ error: "No business linked to account" }, { status: 400 });
  }
  return NextResponse.json(
    { error: "Forbidden: cannot act for another business" },
    { status: 403 },
  );
}

/** Map FeatureLockedError → 403 { error: "upgrade_required", feature }. Returns null otherwise. */
export function lockedResponse(e: unknown): NextResponse | null {
  if (e instanceof FeatureLockedError) {
    return NextResponse.json({ error: "upgrade_required", feature: e.feature }, { status: 403 });
  }
  return null;
}

/** Rate-limit a mutating endpoint. Returns an error response when over limit, else null + headers. */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs = 15 * 60 * 1000,
): Promise<{ error: NextResponse } | { headers: Record<string, string> }> {
  const rl = await rateLimit(key, { limit, windowMs });
  if (!rl.success) {
    return {
      error: NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rateLimitHeaders(rl, limit) },
      ),
    };
  }
  return { headers: rateLimitHeaders(rl, limit) };
}

/** Parse ?page=&limit= with the same bounds used by /api/services. */
export function pageParams(searchParams: URLSearchParams): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

/**
 * One-call plan gate for mutating routes: throws Response-ready 403 on lock.
 * Usage: `await gatePlan(businessId, "retailProducts");` inside try/catch that
 * maps FeatureLockedError via lockedResponse — or use requirePlanFeature directly.
 */
export async function gatePlan(businessId: string, feature: Feature): Promise<void> {
  await requirePlanFeature(businessId, feature);
}
