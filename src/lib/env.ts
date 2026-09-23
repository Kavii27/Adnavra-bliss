import { z } from "zod";

/**
 * Centralized, validated env access.
 * Never read process.env directly elsewhere. Import { env } from "@/lib/env" instead.
 * Validates at startup and throws a clear error if any required variable is missing.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required. Set it in .env"),
  DIRECT_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().min(16, "NEXTAUTH_SECRET must be at least 16 chars"),
  NEXTAUTH_URL: z.string().url().optional(),
  // Optional. Upstash Redis for production rate limiting (falls back to in-memory in dev)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  // Optional. Google OAuth (Phase 6). Only required if Google login is enabled.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    const message = Object.entries(formatted)
      .map(([key, errs]) => `  - ${key}: ${errs?.join(", ")}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${message}\n\nCheck .env.example for required values.`);
  }
  return parsed.data;
}

export const env = loadEnv();

export type Env = z.infer<typeof envSchema>;
