import { db } from "@/lib/db";

/**
 * Append-only audit log. Section 6.
 * Never log passwords, raw tokens, or card numbers.
 * Fire-and-forget friendly: caller should `await` but we swallow errors so logging never breaks the main flow.
 */

export type AuditAction =
  | "auth.signup"
  | "auth.login"
  | "auth.login_failed"
  | "auth.logout"
  | "auth.forgot_password"
  | "auth.reset_password"
  | "booking.create"
  | "booking.cancel"
  | "booking.update"
  | "business.create"
  | "business.update"
  | "service.create"
  | "service.update"
  | "service.delete"
  | "subscription.update"
  | "admin.business_suspend"
  | string;

export type AuditInput = {
  action: AuditAction;
  userId?: string | null;
  userEmail?: string | null;
  role?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  businessId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
};

function sanitizeMetadata(input: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!input) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    const low = k.toLowerCase();
    if (low.includes("password") || low.includes("secret") || low.includes("token") || low.includes("card") || low.includes("hash")) {
      out[k] = "[REDACTED]";
    } else if (typeof v === "string" && v.length > 1000) {
      out[k] = v.slice(0, 1000);
    } else {
      out[k] = v as unknown;
    }
  }
  return out;
}

export async function auditLog(input: AuditInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: input.action,
        userId: input.userId ?? null,
        userEmail: input.userEmail ?? null,
        role: input.role ?? null,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        businessId: input.businessId ?? null,
        // Prisma Json type accepts InputJsonValue. Cast via unknown
        metadata: (sanitizeMetadata(input.metadata) as unknown as import("@prisma/client").Prisma.InputJsonValue) ?? undefined,
        ip: input.ip ?? null,
      },
    });
  } catch (e) {
    // Never throw. Audit failure must not break business logic
    console.error("[audit] failed to write", input.action, (e as Error).message);
  }
}

// Helper to extract IP from NextRequest headers
export function getAuditIp(headers: Headers): string | null {
  const f = headers.get("x-forwarded-for");
  if (f) return f.split(",")[0].trim().slice(0, 45);
  const r = headers.get("x-real-ip");
  if (r) return r.trim().slice(0, 45);
  return null;
}
