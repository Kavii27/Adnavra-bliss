import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateQrDataUrl, publicBusinessUrl } from "@/lib/qr";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

function getClientIp(req: NextRequest): string {
  const f = req.headers.get("x-forwarded-for");
  if (f) return f.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * GET /api/qr/by-slug/:slug: public, rate-limited, generates QR for business public URL.
 * Used by public profile and dashboard QR preview.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ip = getClientIp(request);
  const rl = await rateLimit(`qr:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });
  if (!rl.success) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 30) });

  const business = await db.business.findUnique({ where: { slug }, select: { slug: true, name: true } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404, headers: rateLimitHeaders(rl, 30) });

  const url = publicBusinessUrl(business.slug, request.nextUrl.origin);
  const dataUrl = await generateQrDataUrl(url);

  return NextResponse.json({ data: { url, qrDataUrl: dataUrl } }, { headers: rateLimitHeaders(rl, 30) });
}
