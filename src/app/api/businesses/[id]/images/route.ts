import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp, { type Metadata } from "sharp";
import { z } from "zod";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog, getAuditIp } from "@/lib/audit";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_GALLERY_PHOTOS,
  MAX_IMAGE_SIZE_MB,
  MIN_IMAGE_WIDTH,
  businessImageKindSchema,
} from "@/schemas/businessImage";

export const runtime = "nodejs";

const UPLOAD_LIMIT = 30;
const UPLOAD_WINDOW_MS = 15 * 60 * 1000;

// Local-disk storage (single Hostinger VPS — no object storage configured).
// Files live under public/uploads and are served as /uploads/... URLs.
function uploadsDir(businessId: string): string {
  return path.join(process.cwd(), "public", "uploads", "businesses", businessId);
}

function publicUrl(businessId: string, filename: string): string {
  return `/uploads/businesses/${businessId}/${filename}`;
}

// Best-effort cleanup of a previous local file. Only touches paths we created
// under public/uploads — never an arbitrary URL (no path traversal).
async function removeLocalFile(url: string | null): Promise<void> {
  if (!url || !url.startsWith("/uploads/businesses/")) return;
  try {
    const abs = path.join(process.cwd(), "public", decodeURIComponent(url));
    const root = path.join(process.cwd(), "public", "uploads");
    if (!path.resolve(abs).startsWith(path.resolve(root))) return;
    await unlink(abs);
  } catch {
    // Missing file or FS error — the DB row is the source of truth, not the file.
  }
}

type SessionUser = { id: string; role: string; businessId: string | null };

async function authorize(businessId: string): Promise<
  | { ok: true; session: Session; user: SessionUser }
  | { ok: false; response: NextResponse }
> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = session.user as unknown as SessionUser;
  // Same ownership check as src/app/api/businesses/[id]/route.ts:
  // the owning business acts on itself, ADMIN acts on any businessId.
  if (user.role !== "ADMIN" && businessId !== user.businessId) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, session, user };
}

// ── GET — list logo + cover + gallery for a business ────────────────
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await authorize(id);
  if (!gate.ok) return gate.response;

  const [business, images] = await Promise.all([
    db.business.findUnique({ where: { id }, select: { id: true, logoUrl: true } }),
    db.businessImage.findMany({
      where: { businessId: id },
      orderBy: [{ kind: "asc" }, { position: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });
  return NextResponse.json({ data: { logoUrl: business.logoUrl, images } });
}

// ── POST — upload logo | cover | gallery photo ──────────────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await authorize(id);
  if (!gate.ok) return gate.response;
  // Mirror PATCH /api/businesses/[id]: only OWNER/ADMIN mutate business assets.
  if (!["OWNER", "ADMIN"].includes(gate.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = getAuditIp(req.headers) ?? "unknown";
  const rl = await rateLimit(`image-upload:${ip}:${id}`, { limit: UPLOAD_LIMIT, windowMs: UPLOAD_WINDOW_MS });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again later." },
      { status: 429, headers: rateLimitHeaders(rl, UPLOAD_LIMIT) },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data with file + kind" }, { status: 400 });
  }

  const kindParsed = businessImageKindSchema.safeParse(form.get("kind"));
  if (!kindParsed.success) {
    return NextResponse.json(
      { error: "Invalid kind. Use logo, cover, or gallery.", details: kindParsed.error.flatten() },
      { status: 400 },
    );
  }
  const kind = kindParsed.data;

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `File too large. Maximum is ${MAX_IMAGE_SIZE_MB}MB.` }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return NextResponse.json({ error: "Unsupported file type. Use JPEG, PNG, or WebP." }, { status: 400 });
  }

  const business = await db.business.findUnique({ where: { id }, select: { id: true, logoUrl: true } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  if (kind === "gallery") {
    // Plan-enforced limit first — reads the salon's live BusinessSubscription
    // row, so an admin changing galleryLimit on /admin/subscription-plans
    // takes effect immediately without a deploy.
    const sub = await db.businessSubscription.findUnique({
      where: { businessId: id },
      include: { plan: true },
    });
    if (sub?.plan.galleryLimit != null) {
      const count = await db.businessImage.count({ where: { businessId: id, kind: "gallery" } });
      if (count >= sub.plan.galleryLimit) {
        return NextResponse.json(
          { error: `Your plan allows up to ${sub.plan.galleryLimit} gallery photos.` },
          { status: 403 },
        );
      }
    } else {
      const count = await db.businessImage.count({ where: { businessId: id, kind: "gallery" } });
      if (count >= MAX_GALLERY_PHOTOS) {
        return NextResponse.json(
          { error: `Gallery is full (maximum ${MAX_GALLERY_PHOTOS} photos). Delete one first.` },
          { status: 409 },
        );
      }
    }
  }

  const buf = Buffer.from(await file.arrayBuffer());

  let meta: Metadata;
  try {
    meta = await sharp(buf).metadata();
  } catch {
    return NextResponse.json({ error: "Could not read this image. Try a different file." }, { status: 422 });
  }
  if (!meta.width || meta.width < MIN_IMAGE_WIDTH) {
    return NextResponse.json(
      { error: `Image must be at least ${MIN_IMAGE_WIDTH}px wide (got ${meta.width ?? 0}px).` },
      { status: 422 },
    );
  }

  let processed: Buffer;
  try {
    processed = await sharp(buf)
      .rotate()
      .resize({ width: kind === "logo" ? 512 : 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "Could not process this image. Try a different file." }, { status: 422 });
  }

  const filename = `${kind}-${Date.now()}-${randomUUID().slice(0, 8)}.webp`;
  const dir = uploadsDir(id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), processed);
  const url = publicUrl(id, filename);

  let imageRow: { id: string; url: string; kind: string; position: number } | null = null;
  if (kind === "logo") {
    const previous = business.logoUrl;
    await db.business.update({ where: { id }, data: { logoUrl: url } });
    await removeLocalFile(previous);
  } else if (kind === "cover") {
    const previous = await db.businessImage.findMany({ where: { businessId: id, kind: "cover" } });
    imageRow = await db.businessImage.create({
      data: { businessId: id, url, kind: "cover", position: 0 },
      select: { id: true, url: true, kind: true, position: true },
    });
    // Cover is singular — drop the replaced row(s) after the new one exists.
    for (const row of previous) {
      await db.businessImage.delete({ where: { id: row.id } }).catch(() => {});
      await removeLocalFile(row.url);
    }
  } else {
    const count = await db.businessImage.count({ where: { businessId: id, kind: "gallery" } });
    imageRow = await db.businessImage.create({
      data: { businessId: id, url, kind: "gallery", position: count },
      select: { id: true, url: true, kind: true, position: true },
    });
  }

  await auditLog({
    action: "business.image_upload",
    userId: gate.user.id,
    userEmail: gate.session?.user?.email ?? null,
    role: gate.user.role,
    targetType: "Business",
    targetId: id,
    businessId: id,
    // Metadata only — width/bytes/kind. Never file contents.
    metadata: { kind, width: meta.width, bytes: file.size },
    ip,
  });

  return NextResponse.json(
    { data: { url, kind, image: imageRow } },
    { status: 201, headers: rateLimitHeaders(rl, UPLOAD_LIMIT) },
  );
}

const deleteQuerySchema = z.object({ imageId: z.string().min(1) });

// ── DELETE — remove one cover/gallery photo (?imageId=) ─────────────
// Logo removal stays on PATCH /api/businesses/[id] (logoUrl: null) so the
// logo has a single write path; this endpoint only deletes BusinessImage rows.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await authorize(id);
  if (!gate.ok) return gate.response;
  if (!["OWNER", "ADMIN"].includes(gate.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = deleteQuerySchema.safeParse({ imageId: req.nextUrl.searchParams.get("imageId") });
  if (!parsed.success) {
    return NextResponse.json({ error: "imageId query parameter is required" }, { status: 400 });
  }

  // businessId in the where clause: an ADMIN can only delete this business's
  // own rows, never another tenant's (AGENTS.md: every query filters by it).
  const row = await db.businessImage.findFirst({
    where: { id: parsed.data.imageId, businessId: id },
  });
  if (!row) return NextResponse.json({ error: "Image not found" }, { status: 404 });

  await db.businessImage.delete({ where: { id: row.id } });
  await removeLocalFile(row.url);

  await auditLog({
    action: "business.image_delete",
    userId: gate.user.id,
    userEmail: gate.session?.user?.email ?? null,
    role: gate.user.role,
    targetType: "BusinessImage",
    targetId: row.id,
    businessId: id,
    metadata: { kind: row.kind },
    ip: getAuditIp(req.headers),
  });

  return NextResponse.json({ data: { deleted: row.id } });
}
