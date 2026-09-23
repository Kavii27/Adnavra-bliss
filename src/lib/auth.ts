/**
 * Auth.js v5 (Credentials provider, Task 4.1)
 * - bcrypt cost 12 via lib/password.ts
 * - generic errors ("Invalid email or password"). Never reveal if email exists
 * - rate limiting on login: 5 attempts per email per 15 minutes (in-memory, swappable)
 * - httpOnly, secure (prod), sameSite=lax cookies
 * - JWT strategy, role and businessId propagated to token/session
 */
import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import { AccessDenied } from "@auth/core/errors";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/schemas/user";
import { auditLog } from "@/lib/audit";

// Extend Auth.js types to carry role/businessId
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      businessId: string | null;
    } & DefaultSession["user"];
  }
  interface User {
    role: string;
    businessId: string | null;
  }
}

const DUMMY_HASH =
  "$2a$12$MlsYfmLVk7euylqrFdyuwO9jFr/mS9VivI4UM4jCU/2UtCaJm5CQe"; // valid cost 12 dummy for timing safety (hash of DummyPassword123!)

const isProduction = process.env.NODE_ENV === "production";

export const authConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          // Generic error. Do not reveal validation details beyond "invalid".
          throw new CredentialsSignin("Invalid email or password");
        }
        const email = parsed.data.email.toLowerCase().trim();
        const password = parsed.data.password;

        // Rate limit: 5 attempts per email per 15 minutes (all attempts count)
        const rl = await rateLimit(`login:${email}`, {
          limit: 5,
          windowMs: 15 * 60 * 1000,
        });
        if (!rl.success) {
          // Use AccessDenied so client can distinguish rate-limit from bad credentials (CredentialsSignin)
          throw new AccessDenied("Too many login attempts. Please try again in 15 minutes.");
        }

        const user = await db.user.findUnique({
          where: { email },
        });

        // Timing-safe: if no user, still run a bcrypt compare against dummy hash
        // so response time does not reveal existence.
        const hashToVerify = user?.password ?? DUMMY_HASH;
        const isValid = user ? await verifyPassword(password, hashToVerify) : false;
        // Run dummy verify even when user null to pad timing (already false path above still
        // did 1 compare via the same branch. For null we skipped the real verify, so do it here
        if (!user) {
          // Waste time with a real bcrypt compare to equalize timing
          await verifyPassword(password, DUMMY_HASH).catch(() => false);
          await auditLog({ action: "auth.login_failed", userEmail: email, metadata: { reason: "no_user" } }).catch(() => {});
          throw new CredentialsSignin("Invalid email or password");
        }

        if (!isValid) {
          await auditLog({ action: "auth.login_failed", userId: user.id, userEmail: email, metadata: { reason: "bad_password" } }).catch(() => {});
          throw new CredentialsSignin("Invalid email or password");
        }

        // Deactivated accounts must not be distinguishable from bad credentials
        if ((user as unknown as { deactivatedAt: Date | null }).deactivatedAt) {
          await auditLog({ action: "auth.login_failed", userId: user.id, userEmail: email, metadata: { reason: "deactivated" } }).catch(() => {});
          throw new CredentialsSignin("Invalid email or password");
        }

        await auditLog({ action: "auth.login", userId: user.id, userEmail: user.email, role: user.role, businessId: user.businessId }).catch(() => {});

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          businessId: user.businessId,
        } as unknown as import("next-auth").User;
      },
    }),
    // Google OAuth (Phase 6, optional). Only registered if env vars are present so local dev
    // without GOOGLE_CLIENT_ID does not break. When the founder provides a Google Cloud OAuth
    // client, set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env and this provider becomes active.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            // Request basic profile and email, allow account linking by email
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
  cookies: {
    sessionToken: {
      name: `${isProduction ? "__Secure-" : ""}authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: isProduction,
      },
    },
    callbackUrl: {
      name: `${isProduction ? "__Secure-" : ""}authjs.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: isProduction,
      },
    },
    csrfToken: {
      name: `${isProduction ? "__Host-" : ""}authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: isProduction,
      },
    },
  },
  callbacks: {
    // OAuth account provisioning: if a Google user signs in for the first time, create a
    // corresponding User row so dashboard / bookings (which rely on businessId scoping) keep working.
    // Uses a random bcrypt hash for password (never used for OAuth logins) to satisfy the
    // required password column without storing a usable credential. Existing email addresses
    // are linked automatically (allowDangerousEmailAccountLinking).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async signIn({ user, account, profile }: any) {
      if (account?.provider === "google") {
        const email = (user?.email ?? (profile as Record<string, unknown>)?.email)?.toString().toLowerCase().trim();
        if (!email) return false;
        try {
          const existing = await db.user.findUnique({ where: { email } });
          if (existing) {
            if ((existing as unknown as { deactivatedAt: Date | null }).deactivatedAt) {
              await auditLog({ action: "auth.login_failed", userId: existing.id, userEmail: email, metadata: { reason: "deactivated_google" } }).catch(() => {});
              return false;
            }
            // Existing account: allow sign in, optionally fill in missing image/name from Google
            const profileImage = (profile as Record<string, unknown>)?.picture ?? (profile as Record<string, unknown>)?.image;
            const profileName = (profile as Record<string, unknown>)?.name ?? user?.name;
            if ((!existing.image && profileImage) || (!existing.name && profileName)) {
              await db.user
                .update({
                  where: { id: existing.id },
                  data: {
                    ...(existing.image ? {} : profileImage ? { image: profileImage as string } : {}),
                    ...(existing.name ? {} : profileName ? { name: profileName as string } : {}),
                    ...(profile && (profile as Record<string, unknown>).email_verified ? { emailVerified: new Date() } : {}),
                  },
                })
                .catch(() => {});
            }
            await auditLog({ action: "auth.google_login", userId: existing.id, userEmail: email, role: existing.role, businessId: existing.businessId }).catch(() => {});
            return true;
          }
          // New Google user: create a User row. Default role is OWNER so professional
          // onboarding can proceed without manual role assignment. Customer flows that use
          // GOOGLE via /customer can still have role adjusted later (CUSTOMER vs OWNER is
          // additive and non-breaking for existing flows).
          const randomPassword = `oauth-${crypto.randomUUID()}-${Date.now()}`;
          const hashed = await hashPassword(randomPassword);
          const created = await db.user.create({
            data: {
              email,
              password: hashed,
              name: (user?.name as string) ?? ((profile as Record<string, unknown>)?.name as string) ?? email.split("@")[0],
              image: ((profile as Record<string, unknown>)?.picture as string) ?? ((profile as Record<string, unknown>)?.image as string) ?? (user?.image as string) ?? null,
              role: "OWNER",
              emailVerified: (profile as Record<string, unknown>)?.email_verified ? new Date() : null,
            },
            select: { id: true, role: true, businessId: true },
          });
          await auditLog({ action: "auth.google_signup", userId: created.id, userEmail: email, role: created.role }).catch(() => {});
          // Attach DB identity to the OAuth user object so the jwt callback can propagate it without an extra DB lookup
          (user as Record<string, unknown>).id = created.id;
          (user as Record<string, unknown>).role = created.role;
          (user as Record<string, unknown>).businessId = created.businessId;
          return true;
        } catch (err) {
          console.error("[auth][google signIn] failed:", err instanceof Error ? err.message : "unknown");
          return false;
        }
      }
      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user, account, profile, trigger, session }: any) {
      // Explicit session update, called right after onboarding creates a business.
      // Only businessId may be pushed this way — role changes must never be client-driven.
      if (trigger === "update" && session?.businessId) {
        (token as Record<string, unknown>).businessId = session.businessId as string;
        return token;
      }

      // Initial sign-in: `user` is present. For Credentials it already carries DB role/businessId.
      // For Google, `user` may have been augmented in signIn above, or we need to load from DB.
      if (user) {
        // If user already has DB-populated role (either Credentials or freshly created Google user)
        if ((user as Record<string, unknown>).role) {
          (token as Record<string, unknown>).id = user.id as string;
          (token as Record<string, unknown>).role = user.role as string;
          (token as Record<string, unknown>).businessId = (user.businessId as string | null) ?? null;
          (token as Record<string, unknown>).email = user.email as string;
          (token as Record<string, unknown>).name = user.name as string | undefined;
          if ((user as Record<string, unknown>).image) {
            (token as Record<string, unknown>).picture = user.image as string;
          }
        } else if (account?.provider === "google" && profile) {
          // Fallback: load DB user by email for existing Google users where signIn didn't augment `user`
          const email = (profile as Record<string, unknown>).email?.toString().toLowerCase() ?? (user.email as string)?.toLowerCase();
          if (email) {
            try {
              const dbUser = await db.user.findUnique({ where: { email }, select: { id: true, role: true, businessId: true, email: true, name: true, image: true } });
              if (dbUser) {
                (token as Record<string, unknown>).id = dbUser.id;
                (token as Record<string, unknown>).role = dbUser.role;
                (token as Record<string, unknown>).businessId = dbUser.businessId;
                (token as Record<string, unknown>).email = dbUser.email;
                (token as Record<string, unknown>).name = dbUser.name ?? (user.name as string);
                (token as Record<string, unknown>).picture = dbUser.image ?? (user.image as string);
                token.sub = dbUser.id;
              }
            } catch {
              // keep token as-is on DB error
            }
          }
        } else {
          (token as Record<string, unknown>).id = user.id as string;
          (token as Record<string, unknown>).role = (user as Record<string, unknown>).role as string;
          (token as Record<string, unknown>).businessId = ((user as Record<string, unknown>).businessId as string | null) ?? null;
          (token as Record<string, unknown>).email = user.email as string;
          (token as Record<string, unknown>).name = user.name as string | undefined;
        }
      }

      // For subsequent requests where token already exists but role is missing (e.g. token issued before Google provisioning)
      if (!(token as Record<string, unknown>).role && (token as Record<string, unknown>).email) {
        try {
          const dbUser = await db.user.findUnique({
            where: { email: (token as Record<string, unknown>).email as string },
            select: { id: true, role: true, businessId: true, name: true },
          });
          if (dbUser) {
            (token as Record<string, unknown>).id = dbUser.id;
            (token as Record<string, unknown>).role = dbUser.role;
            (token as Record<string, unknown>).businessId = dbUser.businessId;
            if (dbUser.name) (token as Record<string, unknown>).name = dbUser.name;
            token.sub = dbUser.id;
          }
        } catch {
          // ignore
        }
      }

      // Onboarding fix: if token has no businessId but DB now has one (e.g. just created salon),
      // refresh from DB so session reflects the new business without requiring re-login.
      // Only queries when businessId is falsy to avoid overhead after onboarding.
      if (!(token as Record<string, unknown>).businessId && token.sub) {
        try {
          const fresh = await db.user.findUnique({
            where: { id: token.sub as string },
            select: { businessId: true },
          });
          if (fresh?.businessId) {
            (token as Record<string, unknown>).businessId = fresh.businessId;
          }
        } catch {
          // ignore DB errors in JWT path and keep the existing token
        }
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (token && session.user) {
        (session.user as unknown as Record<string, unknown>).id =
          (token as unknown as Record<string, string>).id ?? token.sub;
        (session.user as unknown as Record<string, unknown>).role = (token as unknown as Record<string, string>).role;
        (session.user as unknown as Record<string, unknown>).businessId =
          (token as unknown as Record<string, string | null>).businessId ?? null;
        if (!(session.user as unknown as Record<string, unknown>).id && token.sub) {
          (session.user as unknown as Record<string, unknown>).id = token.sub;
        }
      }
      return session;
    },
  },
} as Parameters<typeof NextAuth>[0];

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Helper for API routes: re-check ownership server-side (AGENTS.md: middleware is not the only gate)
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function requireRole(roles: string | string[]) {
  const session = await requireAuth();
  const allowed = Array.isArray(roles) ? roles : [roles];
  const userRole = (session.user as unknown as { role: string }).role;
  if (!allowed.includes(userRole)) {
    const err = new Error("Forbidden");
    (err as unknown as Record<string, unknown>).status = 403;
    throw err;
  }
  return session;
}
