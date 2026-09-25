import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { NextRequest, NextResponse } from "next/server";
import { auditLog, getAuditIp } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { getClientIp } from "@/lib/api-guard";
import { db } from "@/lib/db";
import { getHomepageBannerSetting, normalizeHomepageBannerValue } from "@/lib/platform-settings";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import {
  ALLOWED_HOMEPAGE_BANNER_MIME_TYPES,
  HOMEPAGE_BANNER_SETTING_KEY,
  MAX_HOMEPAGE_BANNER_IMAGE_SIZE_MB,
  updateHomepageBannerSchema,
} from "@/schemas/platformSettings";

export const runtime = "nodejs";

const SAVE_LIMIT = 20;
const SAVE_WINDOW_MS = 15 * 60 * 1000;
const UPLOAD_FILENAME_PATTERN = /^homepage-banner-\d+-[a-f0-9]{8}\.webp$/;

type AdminUser = { id: string; role: string };

async function requireAdmin() {
  const session = await auth().catch(() => null);
  const user = session?.user as unknown as AdminUser | undefined;
  if (!session?.user || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session, user };
}

function uploadsDir(): string {
  return path.join(process.cwd(), "public", "uploads", "platform");
}

function generatedUploadUrl(filename: string): string {
  return `/uploads/platform/${filename}`;
}

function safeGeneratedUploadPath(imageUrl: string): string | null {
  if (!imageUrl.startsWith("/uploads/platform/")) return null;
  const filename = imageUrl.slice("/uploads/platform/".length);
  if (!UPLOAD_FILENAME_PATTERN.test(filename)) return null;
  return path.join(uploadsDir(), filename);
}

async function removeGeneratedUpload(imageUrl: string): Promise<void> {
  const filePath = safeGeneratedUploadPath(imageUrl);
  if (!filePath) return;
  try {
    await unlink(filePath);
  } catch {}
}

export async function GET() {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const current = await getHomepageBannerSetting();
  return NextResponse.json({ data: current });
}

export async function POST(request: NextRequest) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { session, user } = gate;

  const ip = getAuditIp(request.headers) ?? getClientIp(request) ?? "unknown";
  const rl = await rateLimit(`admin-homepage-banner:${user.id}:${ip}`, {
    limit: SAVE_LIMIT,
    windowMs: SAVE_WINDOW_MS,
  });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many homepage banner updates. Please try again later." },
      { status: 429, headers: rateLimitHeaders(rl, SAVE_LIMIT) },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const parsed = updateHomepageBannerSchema.safeParse({ destinationUrl: form.get("destinationUrl") });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400, headers: rateLimitHeaders(rl, SAVE_LIMIT) },
    );
  }

  const file = form.get("file");
  const imageFile = file instanceof File && file.size > 0 ? file : null;
  if (imageFile) {
    if (imageFile.size > MAX_HOMEPAGE_BANNER_IMAGE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File too large. Maximum is ${MAX_HOMEPAGE_BANNER_IMAGE_SIZE_MB}MB.` },
        { status: 400, headers: rateLimitHeaders(rl, SAVE_LIMIT) },
      );
    }
    if (!ALLOWED_HOMEPAGE_BANNER_MIME_TYPES.includes(imageFile.type as (typeof ALLOWED_HOMEPAGE_BANNER_MIME_TYPES)[number])) {
      return NextResponse.json(
        { error: "Unsupported file type. Use JPEG, PNG, or WebP." },
        { status: 400, headers: rateLimitHeaders(rl, SAVE_LIMIT) },
      );
    }
  }

  const existing = await db.platformSetting.findUnique({
    where: { key: HOMEPAGE_BANNER_SETTING_KEY },
    select: { id: true, value: true },
  });
  const existingBanner = normalizeHomepageBannerValue(existing?.value);

  let newImageUrl: string | null = null;
  let newUploadPath: string | null = null;
  let originalWidth: number | null = null;
  let originalBytes: number | null = null;

  if (imageFile) {
    const input = Buffer.from(await imageFile.arrayBuffer());
    let image;
    try {
      image = sharp(input);
      const metadata = await image.metadata();
      if (!metadata.width || !["jpeg", "png", "webp"].includes(metadata.format ?? "")) {
        return NextResponse.json(
          { error: "The uploaded file is not a valid JPEG, PNG, or WebP image." },
          { status: 422, headers: rateLimitHeaders(rl, SAVE_LIMIT) },
        );
      }
      originalWidth = metadata.width;
      originalBytes = imageFile.size;
      const processed = await image
        .rotate()
        .resize({ width: 2000, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      const filename = `homepage-banner-${Date.now()}-${randomUUID().slice(0, 8)}.webp`;
      newUploadPath = path.join(uploadsDir(), filename);
      await mkdir(uploadsDir(), { recursive: true });
      await writeFile(newUploadPath, processed);
      newImageUrl = generatedUploadUrl(filename);
    } catch {
      if (newUploadPath) await removeGeneratedUpload(generatedUploadUrl(path.basename(newUploadPath)));
      return NextResponse.json(
        { error: "Could not read or process this image. Try a different file." },
        { status: 422, headers: rateLimitHeaders(rl, SAVE_LIMIT) },
      );
    }
  }

  const nextSetting = {
    imageUrl: newImageUrl ?? existingBanner.imageUrl,
    destinationUrl: parsed.data.destinationUrl,
  };

  try {
    const setting = await db.platformSetting.upsert({
      where: { key: HOMEPAGE_BANNER_SETTING_KEY },
      create: { key: HOMEPAGE_BANNER_SETTING_KEY, value: nextSetting },
      update: { value: nextSetting },
      select: { id: true, value: true, updatedAt: true },
    });
    const stored = normalizeHomepageBannerValue(setting.value);

    if (newImageUrl && existingBanner.imageUrl !== newImageUrl) {
      await removeGeneratedUpload(existingBanner.imageUrl);
    }

    await auditLog({
      action: "admin.platform_setting_update",
      userId: user.id,
      userEmail: session.user.email ?? null,
      role: user.role,
      targetType: "PlatformSetting",
      targetId: setting.id,
      metadata: {
        key: HOMEPAGE_BANNER_SETTING_KEY,
        previousImageUrl: existingBanner.imageUrl,
        imageUrl: stored.imageUrl,
        previousDestinationUrl: existingBanner.destinationUrl,
        destinationUrl: stored.destinationUrl,
        imageChanged: Boolean(newImageUrl),
        originalWidth,
        originalBytes,
      },
      ip,
    });

    return NextResponse.json(
      {
        data: {
          setting: stored,
          settingId: setting.id,
          updatedAt: setting.updatedAt,
        },
      },
      { headers: rateLimitHeaders(rl, SAVE_LIMIT) },
    );
  } catch {
    if (newImageUrl) await removeGeneratedUpload(newImageUrl);
    return NextResponse.json(
      { error: "Could not save the homepage banner. Please try again." },
      { status: 500, headers: rateLimitHeaders(rl, SAVE_LIMIT) },
    );
  }
}
