import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { auditLog, getAuditIp } from "@/lib/audit";

const schema = z.object({ newPassword: z.string().min(8).max(200) });

const LIMIT = 10;
const WINDOW_MS = 15 * 60 * 1000;

/**
 * PATCH /api/auth/force-change-password
 * Any authenticated user may call this on their own account to clear
 * mustChangePassword. Does not require the current password — the whole
 * point is the current one is a temporary value only the admin who created
 * the account has seen; the session cookie itself is the identity proof
 * here, same trust boundary every other self-service route in this app
 * already relies on.
 */
export async function PATCH(request: NextRequest) {
  const session = await auth().catch(() => null);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as unknown as { id: string }).id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(`force-change-password:${userId}`, { limit: LIMIT, windowMs: WINDOW_MS });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: rateLimitHeaders(rl, LIMIT) },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const hashed = await hashPassword(parsed.data.newPassword);
  await db.user.update({ where: { id: userId }, data: { password: hashed, mustChangePassword: false } });

  await auditLog({
    action: "auth.force_change_password",
    userId,
    userEmail: session.user.email ?? null,
    targetType: "User",
    targetId: userId,
    ip: getAuditIp(request.headers),
  }).catch(() => {});

  return NextResponse.json({ data: { updated: true } }, { headers: rateLimitHeaders(rl, LIMIT) });
}
