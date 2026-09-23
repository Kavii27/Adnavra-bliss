import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/schemas/user";
import { auditLog } from "@/lib/audit";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // Rate limit per IP: 5 attempts per 15 min to prevent brute force
  const rl = await rateLimit(`reset:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: rateLimitHeaders(rl, 5) },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { token, password } = parsed.data;
  const tokenHash = hashToken(token);

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.used || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired reset token." }, { status: 400 });
  }

  const newHash = await hashPassword(password);

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: record.userId },
      data: { password: newHash },
    });
    await tx.passwordResetToken.update({
      where: { id: record.id },
      data: { used: true },
    });
    // Invalidate any other outstanding tokens for this user
    await tx.passwordResetToken.updateMany({
      where: { userId: record.userId, used: false, id: { not: record.id } },
      data: { used: true },
    });
  });

  await auditLog({
    action: "auth.reset_password",
    userId: record.userId,
    userEmail: record.user.email,
    targetType: "User",
    targetId: record.userId,
    ip,
  });

  return NextResponse.json(
    { message: "Password has been reset. You can now sign in." },
    { headers: rateLimitHeaders(rl, 5) },
  );
}
