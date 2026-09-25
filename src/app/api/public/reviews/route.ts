import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const publicReviewSchema = z.object({
  businessId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().nullable(),
  name: z.string().min(1).max(100).optional().nullable(),
});

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`review-create:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many reviews submitted. Try again later." },
      { status: 429, headers: rateLimitHeaders(rl, 5) },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = publicReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400, headers: rateLimitHeaders(rl, 5) });
  }

  const business = await db.business.findUnique({
    where: { id: parsed.data.businessId },
    select: { id: true },
  });
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404, headers: rateLimitHeaders(rl, 5) });
  }

  const reviewerName = parsed.data.name?.trim() || null;
  const review = await db.review.create({
    data: {
      businessId: parsed.data.businessId,
      rating: parsed.data.rating,
      comment: parsed.data.comment?.trim() || null,
      source: "marketplace",
      reviewerName,
    },
  });

  return NextResponse.json({ data: review }, { status: 201, headers: rateLimitHeaders(rl, 5) });
}
