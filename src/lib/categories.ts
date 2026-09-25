import { Scissors, Sparkles, HandMetal, Eraser, Eye, Smile, Waves, Flower2, Users, UserRound, Gem, Home, Baby } from "lucide-react";

export const SERVICE_CATEGORIES = [
  { slug: "hair-styling", label: "Hair & styling", icon: Scissors, imageUrl: "/home-images/hairstyle.jpg" },
  { slug: "mens-grooming", label: "Men's grooming", icon: UserRound, imageUrl: "/home-images/mensgroom.jpg" },
  { slug: "nails", label: "Nails", icon: HandMetal, imageUrl: "/home-images/nails.jpg" },
  { slug: "hair-removal", label: "Hair removal", icon: Eraser, imageUrl: "/home-images/hairremove.jpg" },
  { slug: "eyebrows-eyelashes", label: "Eyebrows & eyelashes", icon: Eye, imageUrl: "/home-images/eyebrows.jpg" },
  { slug: "facials-skincare", label: "Facials & skincare", icon: Smile, imageUrl: "/home-images/facial.jpg" },
  { slug: "massage", label: "Massage", icon: Waves, imageUrl: "/home-images/massage.jpg" },
  { slug: "spa-wellness", label: "Spa & wellness", icon: Flower2, imageUrl: "/home-images/spa.jpg" },
] as const;

export type ServiceCategorySlug = (typeof SERVICE_CATEGORIES)[number]["slug"];

export const CATEGORY_SLUGS = SERVICE_CATEGORIES.map((c) => c.slug) as unknown as ServiceCategorySlug[];

// ── Salon type taxonomy (Step 6) ─────────────────────────────────────
// Stored in the dedicated `Business.salonTypes: String[]` column,
// independent of the onboarding `Business.categories` column (max 4 each,
// enforced by Zod in src/schemas/business.ts). Search filtering matches
// `salonTypes` via `has`/`hasSome` alongside the existing `categories` filter.
export const BUSINESS_TYPES = [
  { slug: "unisex", label: "Unisex", icon: Users, imageUrl: "/home-images/unisex.jpg" },
  { slug: "gents", label: "Gents only", icon: UserRound, imageUrl: "/home-images/gents.jpg" },
  { slug: "ladies", label: "Ladies only", icon: Sparkles, imageUrl: "/home-images/ladies.jpg" },
  { slug: "bridal", label: "Bridal & occasion", icon: Gem, imageUrl: "/home-images/bridal.jpg" },
  { slug: "home-visits", label: "Home visits", icon: Home, imageUrl: "/home-images/home.jpg" },
  { slug: "spa-resort", label: "Spa & resort", icon: Flower2, imageUrl: "/home-images/sparesot.jpg" },
  { slug: "kids", label: "Kids friendly", icon: Baby, imageUrl: "/home-images/kids.jpg" },
  { slug: "makeup", label: "Makeup", icon: Sparkles, imageUrl: "/home-images/makeup.jpg" },
] as const;

export type BusinessTypeSlug = (typeof BUSINESS_TYPES)[number]["slug"];

export const BUSINESS_TYPE_SLUGS = BUSINESS_TYPES.map((t) => t.slug) as unknown as BusinessTypeSlug[];

const SERVICE_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  SERVICE_CATEGORIES.map((c) => [c.slug, c.label]),
);

const BUSINESS_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  BUSINESS_TYPES.map((t) => [t.slug, t.label]),
);

const LEGACY_CATEGORY_ALIASES: Record<string, string> = {
  "hair-salon": "hair-styling",
  "hair-saloon": "hair-styling",
  barber: "mens-grooming",
  "beauty-salon": "facials-skincare",
  medspa: "spa-wellness",
  "spa-sauna": "spa-wellness",
  waxing: "hair-removal",
  "eyebrows-lashes": "eyebrows-eyelashes",
};

function canonicalTaxonomySlug(slug: string): string {
  return LEGACY_CATEGORY_ALIASES[slug] ?? slug;
}

/** Human-readable label for any category/type slug stored on a business. */
export function getCategoryLabel(slug: string): string {
  const canonicalSlug = canonicalTaxonomySlug(slug);
  return (
    BUSINESS_TYPE_LABELS[canonicalSlug] ??
    SERVICE_CATEGORY_LABELS[canonicalSlug] ??
    canonicalSlug
      .split("-")
      .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(" ")
  );
}

/** True when the slug belongs to the salon-type taxonomy (vs service categories). */
export function isBusinessTypeSlug(slug: string): boolean {
  return canonicalTaxonomySlug(slug) in BUSINESS_TYPE_LABELS;
}

/**
 * Dictionary key for a localized taxonomy label: `type.<slug>` for salon
 * types, `cat.<slug>` for service categories. Use with `t()` from
 * `@/lib/i18n/locale-context` (client) or `@/lib/i18n/server` (server) —
 * the en dictionary carries the current English labels, so English output
 * is unchanged. Unknown slugs fall back to `cat.<slug>` and then to the
 * title-cased slug via `t()`'s own fallback chain.
 */
export function taxonomyLabelKey(slug: string): string {
  const canonicalSlug = canonicalTaxonomySlug(slug);
  return isBusinessTypeSlug(canonicalSlug) ? `type.${canonicalSlug}` : `cat.${canonicalSlug}`;
}
