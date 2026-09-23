import { NextRequest, NextResponse } from "next/server";
import { getAdsForPlacement } from "@/lib/ads-service";
import { getAdsQuerySchema } from "@/schemas/advertisement";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

function getClientIp(request: NextRequest): string {
  const f = request.headers.get("x-forwarded-for");
  if (f) return f.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * GET /api/marketplace/ads?placement=homepage_top
 * Public endpoint. Returns the ad(s) currently chosen for this placement
 * (rotated per lib/ads.ts) and records one impression per ad shown.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`marketplace-ads:${ip}`, { limit: 120, windowMs: 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 120) });
  }

  const { searchParams } = new URL(request.url);
  const parsed = getAdsQuerySchema.safeParse({ placement: searchParams.get("placement") });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const ads = await getAdsForPlacement(parsed.data.placement);
  return NextResponse.json({ data: ads }, { headers: rateLimitHeaders(rl, 120) });
}
