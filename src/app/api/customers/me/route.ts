import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLog, getAuditIp } from "@/lib/audit";

const profileSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  phone: z.string().min(7).max(20).trim().nullable().optional(),
  image: z.string().url().nullable().optional().or(z.literal("").transform(() => null)),
});

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as unknown as { role: string }).role;
  if (role !== "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const resolvedId = (session.user as unknown as { id?: string }).id;
  if (!resolvedId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { name, phone, image } = parsed.data;
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (phone !== undefined) data.phone = phone;
  if (image !== undefined) data.image = image;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const updated = await db.user.update({
      where: { id: resolvedId },
      data,
      select: { id: true, name: true, email: true, phone: true, image: true },
    });

    await auditLog({
      action: "customer.profile_update",
      userId: resolvedId,
      userEmail: session.user.email ?? null,
      role,
      targetType: "User",
      targetId: resolvedId,
      metadata: { fields: Object.keys(data) },
      ip: getAuditIp(request.headers),
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("[customers/me PATCH] failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Unable to update profile" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as unknown as { role: string }).role;
  if (role !== "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const resolvedId = (session.user as unknown as { id?: string }).id;
  if (!resolvedId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await db.user.update({
      where: { id: resolvedId },
      data: { deactivatedAt: new Date() },
    });

    await auditLog({
      action: "customer.deactivate",
      userId: resolvedId,
      userEmail: session.user.email ?? null,
      role,
      targetType: "User",
      targetId: resolvedId,
      ip: getAuditIp(request.headers),
    });

    // Clear the auth cookie server-side. The client will also call signOut() after receiving ok.
    try {
      await signOut({ redirect: false });
    } catch {
      // Ignore signOut errors in API context — client will handle redirect.
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[customers/me DELETE] failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Unable to deactivate account" }, { status: 500 });
  }
}
