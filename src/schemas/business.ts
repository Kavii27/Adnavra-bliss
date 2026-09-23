import { z } from "zod";

export const createBusinessSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .trim()
    .toLowerCase(),
  description: z.string().max(2000).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  logoUrl: z.string().url().optional().nullable().or(z.literal("")),
  openingHours: z
    .record(
      z.string(),
      z.object({
        open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM"),
        close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM"),
        closed: z.boolean().optional().default(false),
      })
    )
    .optional()
    .nullable(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  categories: z.array(z.string()).max(4).optional(),
  salonTypes: z.array(z.string()).max(4).optional(),
  teamSize: z.enum(["INDEPENDENT", "2-5", "6-10", "11-20", "20+"]).optional().nullable(),
  locationType: z.enum(["PHYSICAL", "MOBILE", "VIRTUAL"]).optional().nullable(),
  district: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  county: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  postcode: z.string().max(20).optional().nullable(),
  directions: z.string().max(200).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

export const updateBusinessSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .trim()
    .toLowerCase()
    .optional(),
  description: z.string().max(2000).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  logoUrl: z.string().url().optional().nullable().or(z.literal("")),
  openingHours: z
    .record(
      z.string(),
      z.object({
        open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM"),
        close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM"),
        closed: z.boolean().optional().default(false),
      })
    )
    .optional()
    .nullable(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  categories: z.array(z.string()).max(4).optional(),
  salonTypes: z.array(z.string()).max(4).optional(),
  teamSize: z.enum(["INDEPENDENT", "2-5", "6-10", "11-20", "20+"]).optional().nullable(),
  locationType: z.enum(["PHYSICAL", "MOBILE", "VIRTUAL"]).optional().nullable(),
  district: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  county: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  postcode: z.string().max(20).optional().nullable(),
  directions: z.string().max(200).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;

// ── Admin-run onboarding (Task 3.2) ────────────────────────────────
// Admin creates the Business row AND the salon owner's login in one call.
// Business fields mirror createBusinessSchema; owner fields mirror the
// signup constraints (email shape, min lengths) without a password —
// the server generates a one-time temporary password instead.
export const adminCreateBusinessSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .trim()
    .toLowerCase(),
  description: z.string().max(2000).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  district: z.string().max(100).optional().nullable(),
  categories: z.array(z.string()).max(4).optional(),
  salonTypes: z.array(z.string()).max(4).optional(),
  ownerName: z.string().min(1).max(100).trim(),
  ownerEmail: z.string().email().trim().toLowerCase(),
  ownerPhone: z.string().min(7).max(20).trim().optional(),
});

export type AdminCreateBusinessInput = z.infer<typeof adminCreateBusinessSchema>;
