import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { auditLog, getAuditIp } from "@/lib/audit";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as unknown as { role: string }).role;
  if (role !== "CUSTOMER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const resolvedId = (session.user as unknown as { id?: string }).id;
  if (!resolvedId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = passwordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;

  try {
    const user = await db.user.findUnique({ where: { id: resolvedId }, select: { password: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const ok = await verifyPassword(currentPassword, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const hashed = await hashPassword(newPassword);
    await db.user.update({ where: { id: resolvedId }, data: { password: hashed } });

    await auditLog({
      action: "customer.password_change",
      userId: resolvedId,
      userEmail: session.user.email ?? null,
      role,
      targetType: "User",
      targetId: resolvedId,
      ip: getAuditIp(request.headers),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[customers/me/password PATCH] failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Unable to change password" }, { status: 500 });
  }
}
