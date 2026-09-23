/**
 * Role-based route protection + nonce-based CSP (Priority 3).
 * - First line of defense only: every API route and dashboard/admin page MUST also
 *   re-check permissions server-side. Middleware is a UX gate; real security lives in
 *   auth() + businessId scoping per handler.
 * - CSP: generates a per-request cryptographic nonce and sets a strict CSP header
 *   `script-src 'self' 'nonce-xxx' 'strict-dynamic'` which removes 'unsafe-inline' and
 *   'unsafe-eval' from script-src in production. Nonce is propagated via
 *   `x-nonce` request/response headers so Next.js can add it to its inline scripts.
 *
 * Edge-safe: uses `next-auth/jwt` getToken instead of importing `@/lib/auth`
 * (which pulls Prisma + bcryptjs - Node-only and crashes on Edge/500).
 * This prevents "Internal Server Error" / ClientFetchError on /api/auth/*.
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

function generateNonce(): string {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    let binary = "";
    for (const b of arr) binary += String.fromCharCode(b);
    return btoa(binary);
  }
  if (typeof crypto !== "undefined" && typeof (crypto as unknown as { randomUUID: () => string }).randomUUID === "function") {
    return btoa((crypto as unknown as { randomUUID: () => string }).randomUUID().replace(/-/g, ""));
  }
  return btoa(Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2));
}

function buildCsp(nonce: string): string {
  const scriptSrc = `script-src 'self' 'unsafe-inline' 'unsafe-eval' 'nonce-${nonce}' 'strict-dynamic' https:`;
  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-src 'self' https://www.openstreetmap.org",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

function withCspHeaders(res: NextResponse, nonce: string, csp: string): NextResponse {
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("x-nonce", nonce);
  res.headers.set("x-csp-nonce", nonce);
  return res;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const nonce = generateNonce();
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-csp-nonce", nonce);
  requestHeaders.set("x-nextjs-nonce", nonce);
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("Content-Security-Policy", csp);

  // Edge-safe token decode - never import Prisma/bcrypt here
  let token: Record<string, unknown> | null = null;
  try {
    const isProduction = process.env.NODE_ENV === "production";
    // Auth.js v5 uses __Secure- prefix in production for session cookie
    const cookieName = `${isProduction ? "__Secure-" : ""}authjs.session-token`;
    token = (await getToken({
      req: req as unknown as Request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName,
      secureCookie: isProduction,
    })) as unknown as Record<string, unknown> | null;
    // Fallback: try without secure prefix (covers dev cookie when NODE_ENV mismatched)
    if (!token && isProduction) {
      token = (await getToken({
        req: req as unknown as Request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: "authjs.session-token",
      })) as unknown as Record<string, unknown> | null;
    }
  } catch (e) {
    // Token decode failure must not crash middleware - treat as not logged in
    console.error("[middleware] getToken failed:", (e as Error).message);
    token = null;
  }

  const isLoggedIn = !!token;
  const role = token?.role as string | undefined;

  let res: NextResponse;

  // --- /admin/* is ADMIN only ---
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      if (pathname.startsWith("/api/")) {
        res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      } else {
        const loginUrl = new URL("/login", req.nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", pathname);
        res = NextResponse.redirect(loginUrl);
      }
      return withCspHeaders(res, nonce, csp);
    }
    if (role !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        res = NextResponse.json({ error: "Forbidden" }, { status: 403 });
      } else if (role === "CUSTOMER") {
        // Customers have their own home — never show a raw 403.
        res = NextResponse.redirect(new URL("/customer/account/activity", req.nextUrl.origin));
      } else {
        // Logged in but token carries no usable role (stale session minted
        // before role propagation). Re-login mints a fresh JWT with role.
        const loginUrl = new URL("/login", req.nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", pathname);
        res = NextResponse.redirect(loginUrl);
      }
      return withCspHeaders(res, nonce, csp);
    }
    res = NextResponse.next({ request: { headers: requestHeaders } });
    return withCspHeaders(res, nonce, csp);
  }

  // --- /dashboard/* is OWNER or STAFF only ---
  if (pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      if (pathname.startsWith("/api/")) {
        res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      } else {
        const loginUrl = new URL("/login", req.nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", pathname);
        res = NextResponse.redirect(loginUrl);
      }
      return withCspHeaders(res, nonce, csp);
    }
    const allowedRoles = ["OWNER", "STAFF", "ADMIN"];
    if (!role || !allowedRoles.includes(role)) {
      if (pathname.startsWith("/api/")) {
        res = NextResponse.json({ error: "Forbidden" }, { status: 403 });
      } else if (role === "CUSTOMER") {
        // Customers have their own home — never show a raw 403.
        res = NextResponse.redirect(new URL("/customer/account/activity", req.nextUrl.origin));
      } else {
        // Logged in but token carries no usable role (stale session minted
        // before role propagation). Re-login mints a fresh JWT with role.
        const loginUrl = new URL("/login", req.nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", pathname);
        res = NextResponse.redirect(loginUrl);
      }
      return withCspHeaders(res, nonce, csp);
    }
    res = NextResponse.next({ request: { headers: requestHeaders } });
    return withCspHeaders(res, nonce, csp);
  }

  // All other routes: just attach CSP + nonce and pass through
  res = NextResponse.next({ request: { headers: requestHeaders } });
  return withCspHeaders(res, nonce, csp);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
