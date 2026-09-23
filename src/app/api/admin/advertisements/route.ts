import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp, { type Metadata } from "sharp";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { auditLog, getAuditIp } from "@/lib/audit";
import {
  createAdvertisementFormSchema,
  ALLOWED_AD_IMAGE_MIME_TYPES,
  MAX_AD_IMAGE_SIZE_MB,
} from "@/schemas/advertisement";

export const runtime = "nodejs";

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

// Same local-disk convention as /api/businesses/[id]/images: no object
// storage configured (single VPS), served straight out of public/uploads.
function uploadsDir(): string {
  return path.join(process.cwd(), "public", "uploads", "advertisements");
}
function publicUrl(filename: string): string {
  return `/uploads/advertisements/${filename}`;
}

/**
 * GET /api/admin/advertisements
 * ADMIN only. Lists every ad (active, scheduled, and expired — not just
 * live ones) with its placement and impression/click totals, for the
 * Admin → Advertisements dashboard table.
 */
export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const [ads, eventCounts] = await Promise.all([
    db.advertisement.findMany({ include: { placement: true }, orderBy: { createdAt: "desc" } }),
    db.advertisementEvent.groupBy({ by: ["advertisementId", "type"], _count: { _all: true } }),
  ]);

  const statsByAd = new Map<string, { impressions: number; clicks: number }>();
  for (const row of eventCounts) {
    const entry = statsByAd.get(row.advertisementId) ?? { impressions: 0, clicks: 0 };
    if (row.type === "IMPRESSION") entry.impressions = row._count._all;
    else entry.clicks = row._count._all;
    statsByAd.set(row.advertisementId, entry);
  }

  const data = ads.map((ad) => ({
    ...ad,
    stats: statsByAd.get(ad.id) ?? { impressions: 0, clicks: 0 },
  }));

  return NextResponse.json({ data });
}

/**
 * POST /api/admin/advertisements
 * ADMIN only. multipart/form-data: image file (`file`) + ad fields
 * (placementKey, title, description, destinationUrl, startAt, endAt,
 * priority, isActive). Uploads + creates in one call, same pattern as the
 * business image upload route.
 */
export async function POST(request: NextRequest) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { session, role } = gate;

  const ip = getClientIp(request);
  const rl = await rateLimit(`admin-advertisement-create:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 20) });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const parsed = createAdvertisementFormSchema.safeParse({
    placementKey: form.get("placementKey"),
    title: form.get("title"),
    description: form.get("description") || undefined,
    destinationUrl: form.get("destinationUrl"),
    startAt: form.get("startAt"),
    endAt: form.get("endAt"),
    priority: form.get("priority") ?? undefined,
    isActive: form.get("isActive") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No image file provided" }, { status: 400 });
  }
  if (file.size > MAX_AD_IMAGE_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `File too large. Maximum is ${MAX_AD_IMAGE_SIZE_MB}MB.` }, { status: 400 });
  }
  if (!ALLOWED_AD_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_AD_IMAGE_MIME_TYPES)[number])) {
    return NextResponse.json({ error: "Unsupported file type. Use JPEG, PNG, or WebP." }, { status: 400 });
  }

  const placement = await db.advertisementPlacement.findUnique({ where: { key: parsed.data.placementKey } });
  if (!placement) {
    return NextResponse.json({ error: "Unknown placement key" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  let meta: Metadata;
  try {
    meta = await sharp(buf).metadata();
  } catch {
    return NextResponse.json({ error: "Could not read this image. Try a different file." }, { status: 422 });
  }
  if (!meta.width) {
    return NextResponse.json({ error: "Could not read this image. Try a different file." }, { status: 422 });
  }

  let processed: Buffer;
  try {
    processed = await sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  } catch {
    return NextResponse.json({ error: "Could not process this image. Try a different file." }, { status: 422 });
  }

  const filename = `ad-${Date.now()}-${randomUUID().slice(0, 8)}.webp`;
  await mkdir(uploadsDir(), { recursive: true });
  await writeFile(path.join(uploadsDir(), filename), processed);
  const imageUrl = publicUrl(filename);

  const ad = await db.advertisement.create({
    data: {
      placementId: placement.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      imageUrl,
      destinationUrl: parsed.data.destinationUrl,
      startAt: parsed.data.startAt,
      endAt: parsed.data.endAt,
      priority: parsed.data.priority,
      isActive: parsed.data.isActive,
    },
    include: { placement: true },
  });

  const actorId = (session!.user as unknown as { id: string }).id;
  await auditLog({
    action: "admin.advertisement_create",
    userId: actorId,
    userEmail: session!.user.email ?? null,
    role,
    targetType: "Advertisement",
    targetId: ad.id,
    metadata: { placementKey: placement.key, title: ad.title },
    ip: getAuditIp(request.headers) ?? ip,
  });

  return NextResponse.json({ data: ad }, { status: 201, headers: rateLimitHeaders(rl, 20) });
}
