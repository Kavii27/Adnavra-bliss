import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { auditLog, getAuditIp } from "@/lib/audit";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { SERVICE_IMAGE_RULES, SERVICE_IMAGE_ROOT, SERVICE_IMAGE_EXT } from "@/lib/service-images";
import {
  ALLOWED_SERVICE_IMAGE_MIME_TYPES,
  MAX_SERVICE_IMAGE_SIZE_MB,
  deleteServiceImageSchema,
  serviceImageCategorySchema,
  uploadServiceImageSchema,
} from "@/schemas/serviceImage";

export const runtime = "nodejs";

const CATEGORIES = serviceImageCategorySchema.options;

const UPLOAD_LIMIT = 60;
const UPLOAD_WINDOW_MS = 15 * 60 * 1000;

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

function diskRoot(): string {
  return path.join(process.cwd(), "public", "service-images");
}

function specificFile(category: string, slug: string): string {
  return path.join(diskRoot(), category, `${slug}.${SERVICE_IMAGE_EXT}`);
}

function categoryFile(category: string): string {
  return path.join(diskRoot(), "_category", `${category}.${SERVICE_IMAGE_EXT}`);
}

function defaultFile(): string {
  return path.join(diskRoot(), "_category", `default.${SERVICE_IMAGE_EXT}`);
}

/**
 * GET /api/admin/service-images
 * ADMIN only. Full, live inventory read from the real filesystem at request
 * time — never a stale build-time manifest. Every catalog rule grouped by
 * category, plus the 8 category fallbacks and the one global default, each
 * flagged with whether a file currently exists on disk.
 */
export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const byCategory = CATEGORIES.map((category) => ({
    category,
    hasDefault: existsSync(categoryFile(category)),
    defaultUrl: `${SERVICE_IMAGE_ROOT}/_category/${category}.${SERVICE_IMAGE_EXT}`,
    rules: SERVICE_IMAGE_RULES.filter((r) => r.category === category).map((r) => ({
      slug: r.slug,
      keywords: r.keywords,
      hasImage: existsSync(specificFile(category, r.slug)),
      imageUrl: `${SERVICE_IMAGE_ROOT}/${category}/${r.slug}.${SERVICE_IMAGE_EXT}`,
    })),
  }));

  return NextResponse.json({
    data: {
      categories: byCategory,
      globalDefault: {
        hasImage: existsSync(defaultFile()),
        imageUrl: `${SERVICE_IMAGE_ROOT}/_category/default.${SERVICE_IMAGE_EXT}`,
      },
    },
  });
}

/**
 * POST /api/admin/service-images (multipart/form-data)
 * ADMIN only. Upload or replace one image.
 * Fields: file (required), target ("slug" | "category" | "default"),
 * category (required for "slug"/"category"), slug (required for "slug").
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { session, role } = guard;

  const ip = getClientIp(request);
  const limited = await rateLimit(`service-images:${ip}`, { limit: UPLOAD_LIMIT, windowMs: UPLOAD_WINDOW_MS });
  if (!limited.success) {
    return NextResponse.json(
      { error: "Too many uploads, try again shortly" },
      { status: 429, headers: rateLimitHeaders(limited, UPLOAD_LIMIT) },
    );
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = form.get("file");
  const parsed = uploadServiceImageSchema.safeParse({
    target: String(form.get("target") ?? ""),
    category: String(form.get("category") ?? ""),
    slug: String(form.get("slug") ?? ""),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400, headers: rateLimitHeaders(limited, UPLOAD_LIMIT) },
    );
  }
  const { target, category, slug } = parsed.data;

  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_SERVICE_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_SERVICE_IMAGE_MIME_TYPES)[number])) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed" }, { status: 400 });
  }
  if (file.size > MAX_SERVICE_IMAGE_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Image must be under ${MAX_SERVICE_IMAGE_SIZE_MB}MB` }, { status: 400 });
  }

  let outFile: string;
  let publicUrl: string;
  let targetId: string;
  if (target === "slug") {
    const rule = SERVICE_IMAGE_RULES.find((r) => r.category === category && r.slug === slug);
    if (!rule) return NextResponse.json({ error: "Unknown category/slug combination" }, { status: 400 });
    outFile = specificFile(category, slug);
    publicUrl = `${SERVICE_IMAGE_ROOT}/${category}/${slug}.${SERVICE_IMAGE_EXT}`;
    targetId = `${category}/${slug}`;
  } else if (target === "category") {
    outFile = categoryFile(category);
    publicUrl = `${SERVICE_IMAGE_ROOT}/_category/${category}.${SERVICE_IMAGE_EXT}`;
    targetId = category;
  } else {
    outFile = defaultFile();
    publicUrl = `${SERVICE_IMAGE_ROOT}/_category/default.${SERVICE_IMAGE_EXT}`;
    targetId = "default";
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    // Same crop/quality as scripts/optimize-service-images.mjs, so
    // admin-uploaded photos look consistent with any bulk-imported ones.
    const processed = await sharp(buffer)
      .rotate()
      .resize(800, 600, { fit: "cover", position: "attention" })
      .webp({ quality: 80 })
      .toBuffer();

    await mkdir(path.dirname(outFile), { recursive: true });
    await writeFile(outFile, processed);

    await auditLog({
      action: "service_image.upload",
      userId: (session.user as unknown as { id: string }).id,
      userEmail: session.user.email ?? null,
      role,
      targetType: "service_image",
      targetId,
      ip: getAuditIp(request.headers) ?? ip,
    });

    return NextResponse.json(
      { data: { url: `${publicUrl}?v=${Date.now()}` } },
      { headers: rateLimitHeaders(limited, UPLOAD_LIMIT) },
    );
  } catch (err) {
    console.error("service-image upload failed", err);
    return NextResponse.json({ error: "Could not process image" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/service-images?target=slug&category=X&slug=Y
 * ADMIN only. Removes a specific slug's photo so it reverts to showing its
 * category's fallback image. Category and global-default images cannot be
 * deleted, only replaced (POST over them), since every service always needs
 * at least one image to fall back to.
 */
export async function DELETE(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { session, role } = guard;

  const { searchParams } = new URL(request.url);
  const parsed = deleteServiceImageSchema.safeParse({
    target: searchParams.get("target"),
    category: searchParams.get("category"),
    slug: searchParams.get("slug"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Only a specific slug's image can be removed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { category, slug } = parsed.data;

  const file = specificFile(category, slug);
  try {
    if (existsSync(file)) await unlink(file);
    await auditLog({
      action: "service_image.delete",
      userId: (session.user as unknown as { id: string }).id,
      userEmail: session.user.email ?? null,
      role,
      targetType: "service_image",
      targetId: `${category}/${slug}`,
      ip: getAuditIp(request.headers),
    });
    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    console.error("service-image delete failed", err);
    return NextResponse.json({ error: "Could not remove image" }, { status: 500 });
  }
}
