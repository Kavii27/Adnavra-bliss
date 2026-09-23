import { NextRequest, NextResponse } from "next/server";
import { recordAdClick } from "@/lib/ads-service";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

function getClientIp(request: NextRequest): string {
  const f = request.headers.get("x-forwarded-for");
  if (f) return f.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * POST /api/marketplace/ads/[id]/click
 * Public endpoint. Records a click on an ad, only if it's still live —
 * an expired/disabled ad's link can't be farmed for click counts.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const ip = getClientIp(request);
  const rl = await rateLimit(`marketplace-ads-click:${ip}`, { limit: 60, windowMs: 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 60) });
  }

  const recorded = await recordAdClick(id);
  if (!recorded) {
    return NextResponse.json({ error: "Advertisement not found or not currently active" }, { status: 404 });
  }

  return NextResponse.json({ data: { recorded: true } }, { headers: rateLimitHeaders(rl, 60) });
}
