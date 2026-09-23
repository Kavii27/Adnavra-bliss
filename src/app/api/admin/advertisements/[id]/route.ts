import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { auditLog, getAuditIp } from "@/lib/audit";
import { updateAdvertisementSchema } from "@/schemas/advertisement";

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

async function removeLocalFile(url: string): Promise<void> {
  if (!url.startsWith("/uploads/advertisements/")) return;
  try {
    const abs = path.join(process.cwd(), "public", decodeURIComponent(url));
    const root = path.join(process.cwd(), "public", "uploads", "advertisements");
    if (!path.resolve(abs).startsWith(path.resolve(root))) return;
    await unlink(abs);
  } catch {
    // Missing file or FS error — the DB row is the source of truth, not the file.
  }
}

/**
 * PATCH /api/admin/advertisements/[id]
 * ADMIN only. Edits title/description/link/dates/priority, moves it to a
 * different placement, and flips `isActive` (the enable/disable control).
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { session, role } = gate;

  const ip = getClientIp(request);
  const rl = await rateLimit(`admin-advertisement-update:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 30) });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateAdvertisementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.advertisement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Advertisement not found" }, { status: 404 });
  }

  const { placementKey, ...rest } = parsed.data;
  let placementId: string | undefined;
  if (placementKey) {
    const placement = await db.advertisementPlacement.findUnique({ where: { key: placementKey } });
    if (!placement) return NextResponse.json({ error: "Unknown placement key" }, { status: 400 });
    placementId = placement.id;
  }

  const updated = await db.advertisement.update({
    where: { id },
    data: { ...rest, ...(placementId ? { placementId } : {}) },
    include: { placement: true },
  });

  const actorId = (session!.user as unknown as { id: string }).id;
  await auditLog({
    action: "admin.advertisement_update",
    userId: actorId,
    userEmail: session!.user.email ?? null,
    role,
    targetType: "Advertisement",
    targetId: updated.id,
    metadata: parsed.data,
    ip: getAuditIp(request.headers) ?? ip,
  });

  return NextResponse.json({ data: updated }, { headers: rateLimitHeaders(rl, 30) });
}

/**
 * DELETE /api/admin/advertisements/[id]
 * ADMIN only. Removes an ad (and its uploaded banner image) entirely.
 * Disabling via PATCH { isActive: false } is preferred for a campaign
 * that might run again — this is for permanently retiring one.
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { session, role } = gate;

  const existing = await db.advertisement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Advertisement not found" }, { status: 404 });
  }

  await db.advertisement.delete({ where: { id } });
  await removeLocalFile(existing.imageUrl);

  const actorId = (session!.user as unknown as { id: string }).id;
  await auditLog({
    action: "admin.advertisement_delete",
    userId: actorId,
    userEmail: session!.user.email ?? null,
    role,
    targetType: "Advertisement",
    targetId: id,
    ip: getAuditIp(_request.headers),
  });

  return NextResponse.json({ data: { deleted: id } });
}
