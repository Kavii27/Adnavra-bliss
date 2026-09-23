import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/schemas/user";
import { auditLog } from "@/lib/audit";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const GENERIC_SUCCESS = "If that email exists, we sent a reset link. Check your inbox.";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  // Rate limit per IP (5 per 15 min)
  const rlIp = await rateLimit(`forgot-ip:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rlIp.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: rateLimitHeaders(rlIp, 5) },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    // Still return generic success to avoid email enumeration? For validation errors, return 400 directly.
    return NextResponse.json({ error: "Invalid email", details: parsed.error.flatten() }, { status: 400 });
  }

  const email = parsed.data.email;

  // Per-email rate limit (3 per hour)
  const rlEmail = await rateLimit(`forgot-email:${email}`, { limit: 3, windowMs: 60 * 60 * 1000 });
  if (!rlEmail.success) {
    // Return generic success even when rate-limited per email to avoid enumeration timing leak,
    // but still set 429 if IP limit already exceeded above. Here we can silently succeed.
    return NextResponse.json({ message: GENERIC_SUCCESS }, { headers: rateLimitHeaders(rlEmail, 3) });
  }

  const user = await db.user.findUnique({ where: { email } });

  // Always return generic success. Never reveal if email exists
  if (!user) {
    return NextResponse.json(
      { message: GENERIC_SUCCESS },
      { headers: rateLimitHeaders(rlEmail, 3) },
    );
  }

  // Generate single-use, time-limited token (1 hour)
  const rawToken = crypto.randomBytes(32).toString("hex"); // 64 chars
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // Invalidate old unused tokens for this user
  await db.passwordResetToken.deleteMany({
    where: { userId: user.id, used: false },
  });

  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
      used: false,
    },
  });

  // In development, log the reset URL. In production, send via email provider.
  // Never log raw token in production. Only log it in development.
  if (process.env.NODE_ENV !== "production") {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;
    console.log(`[ADNAVRA] Password reset for ${email}: ${resetUrl}, expiresAt=${expiresAt.toISOString()}`);
  }
  // TODO: integrate email provider (e.g. Resend) in production.

  await auditLog({
    action: "auth.forgot_password",
    userId: user.id,
    userEmail: email,
    targetType: "User",
    targetId: user.id,
    ip,
  });

  return NextResponse.json(
    { message: GENERIC_SUCCESS },
    { headers: rateLimitHeaders(rlEmail, 3) },
  );
}
