import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { signupSchema } from "@/schemas/user";
import { auditLog } from "@/lib/audit";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

export async function POST(request: NextRequest) {
  // Rate limit: max 3 signups per IP per hour
  const ip = getClientIp(request);
  const rl = await rateLimit(`signup:${ip}`, { limit: 3, windowMs: 60 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please try again later." },
      {
        status: 429,
        headers: rateLimitHeaders(rl, 3),
      },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { email, password, name, role, businessName, businessSlug, phone } = parsed.data;

  // Check email uniqueness. It is safe to reveal existence for signup (login is the generic one)
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  // Optional business slug uniqueness
  if (businessSlug) {
    const slugExists = await db.business.findUnique({ where: { slug: businessSlug } });
    if (slugExists) {
      return NextResponse.json({ error: "Business URL is already taken." }, { status: 409 });
    }
  }

  const hashed = await hashPassword(password);

  try {
    // Transaction ensures user + business created atomically
    const result = await db.$transaction(async (tx) => {
      let businessId: string | null = null;

      if (businessName && businessSlug && role === "OWNER") {
        const business = await tx.business.create({
          data: {
            name: businessName,
            slug: businessSlug,
          },
        });
        businessId = business.id;
        // Create starter subscription
        await tx.subscription.create({
          data: {
            businessId: business.id,
            plan: "STARTER",
            status: "ACTIVE",
          },
        });
      }

      const user = await tx.user.create({
        data: {
          email,
          password: hashed,
          name,
          role,
          businessId,
          phone: phone ?? null,
        },
        select: { id: true, email: true, name: true, role: true, businessId: true },
      });

      return user;
    });

    await auditLog({
      action: "auth.signup",
      userId: result.id,
      userEmail: result.email,
      role: result.role,
      targetType: "User",
      targetId: result.id,
      businessId: result.businessId,
      ip,
    });

    return NextResponse.json(
      { message: "Account created", user: result },
      { status: 201, headers: rateLimitHeaders(rl, 3) },
    );
  } catch (err) {
    // Never leak internal error details + never log password
    console.error("[signup] failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Unable to create account. Please try again." }, { status: 500 });
  }
}
