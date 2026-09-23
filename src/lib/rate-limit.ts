/**
 * In-memory rate limiter for development.
 * Swappable for Redis (Upstash) in production. Keep the same interface so
 * switching is a one-file change (replace the Map with a Redis client).
 *
 * Usage:
 *   const { success, remaining } = await rateLimit(`login:${email}`, { limit: 5, windowMs: 15*60*1000 });
 *   if (!success) return 429;
 */

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
};

type Entry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Entry>();

function now() {
  return Date.now();
}

// Periodic cleanup to prevent unbounded growth (every 5 min)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const t = now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= t) store.delete(key);
    }
  }, 5 * 60 * 1000).unref?.();
}

export async function rateLimit(key: string, opts: RateLimitOptions): Promise<RateLimitResult> {
  const t = now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= t) {
    store.set(key, { count: 1, resetAt: t + opts.windowMs });
    return { success: true, remaining: opts.limit - 1, resetAt: t + opts.windowMs };
  }

  if (entry.count >= opts.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { success: true, remaining: opts.limit - entry.count, resetAt: entry.resetAt };
}

/** Helper to build a rate-limit response for API routes */
export function rateLimitHeaders(result: RateLimitResult, limit: number) {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

// For testing, clear all entries
export function _resetRateLimitStore() {
  store.clear();
}
