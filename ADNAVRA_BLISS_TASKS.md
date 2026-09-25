# ADNAVRA BLISS — Mobile-First Rebuild Task List

**How to use this file:** Work top to bottom. Every phase is ordered by priority —
**Phase 0 and Phase 1 (mobile-first + navigation) come before anything else**,
exactly as requested. Each task names the exact file(s) to open, what is
wrong today (verified by reading the actual code in the uploaded zip), and
what to change, with code snippets. "New file" tasks give a full starting
point; "edit" tasks give the smallest correct diff. Nothing in this file was
run or tested (no `node_modules`/network in the environment that produced
it) — each task ends with a **Verify** step your agent (or you) should click
through after making the change.

## Ground rule that applies to every single task below

> **This is a mobile-first redesign.** For every component you touch, build
> and test the **mobile layout first** (375px–428px wide), then expand it to
> tablet/desktop with `sm:`/`md:`/`lg:` Tailwind prefixes. Do not design at
> desktop width and shrink it down — that is exactly the pattern causing the
> "fixed / clutter / overlapping / not scrollable" bugs reported in Phase 4
> and Phase 7. Concretely, for every screen you edit:
> - Base (no prefix) Tailwind classes = the phone layout.
> - No fixed pixel heights on scrollable content — use `min-h-` not `h-`,
>   and always add `overflow-y-auto` + `overscroll-contain` to any panel that
>   can grow taller than the viewport (bottom sheets, modals, wizard steps).
> - Tap targets are at least 44×44px.
> - Test at 375px width (iPhone SE) as the minimum supported width.

Stack recap (confirmed by reading the zip): Next.js App Router, TypeScript,
Prisma + PostgreSQL, NextAuth (`src/lib/auth.ts`), Tailwind, Zod schemas in
`src/schemas/*`. No email or SMS/WhatsApp library is installed yet — Phase 4
adds one. There is a prior `ADNAVRA_IMPLEMENTATION_GUIDE (1).md` in the zip
covering the salon-type migration, admin login link, and admin-run
onboarding — that guide is still valid and complementary to this one; a few
of its items (the `salonTypes` column, `isBusinessTypeSlug`) are reused
below rather than repeated.

---

# PHASE 0 — Mobile-first foundation (do this first, project-wide)

## 0.1 — Viewport & base layout audit
**File:** `src/app/layout.tsx` (root layout).
Open it and confirm the `<meta name="viewport">` is present with
`width=device-width, initial-scale=1`. If Next's built-in `viewport` export
isn't set, add it:
```ts
// src/app/layout.tsx
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};
```
Also audit `src/app/globals.css` for any `min-width` on `body`/`html` and
remove it — nothing should force a desktop-width layout.

## 0.2 — Kill fixed-height / non-scrollable containers
Grep the whole repo for the patterns that cause "not scrollable / fixed /
clutter" on mobile (this is exactly what's wrong with the booking wizard in
Phase 4 and the dashboard modals in Phase 7):
```bash
grep -rn "h-screen\b" src/components src/app | grep -v "min-h-screen"
grep -rn "overflow-hidden" src/components/booking src/components/dashboard
```
Rule to apply everywhere a hit is found: replace `h-screen` (which clips
content that's taller than the viewport, e.g. when the mobile keyboard is
open) with `min-h-screen` on outer wrappers, and make sure any inner panel
that holds a form or a list has `overflow-y-auto max-h-[calc(100dvh-<header
height>)]` instead of a hard `h-[…]`. Use `100dvh` (dynamic viewport height),
not `100vh`, anywhere you do need a viewport-relative height — `100vh` on
mobile Safari/Chrome includes the address bar and causes content to be cut
off at the bottom, which is very likely the root cause of the "fixed, not
scrollable" complaint.

## 0.3 — Global breakpoint sanity pass
Confirm `tailwind.config` (or the CSS `@theme` block in `globals.css` if
this project uses Tailwind v4 config-in-CSS — check which one applies)
uses the default breakpoints (`sm:640px md:768px lg:1024px xl:1280px`) and
doesn't override them to something desktop-biased. Leave as-is if standard.

**Verify (0):** Open the site in Chrome DevTools device toolbar at
`iPhone SE (375×667)`, `iPhone 14 Pro (393×852)`, and `iPad Mini
(768×1024)`. Every page in this document should be checked at all three
after its own task is done — don't just check desktop.

---

# PHASE 1 — Navigation: mobile nav bar + banner ad (top priority, per your supervisor's CarMarket.lk reference)

## 1.1 — Add the banner ad space (CarMarket.lk reference, image 1)
CarMarket.lk's homepage has a full-width promotional banner directly under
the navbar, above "Browse Items by Category". Recreate that slot on the
ADNAVRA BLISS homepage, image-driven so admin can swap it (wired to the
admin banner manager in Phase 8.5).

**1.1.a — Add the component.** New file `src/components/customer/home/ad-banner.tsx`:
```tsx
import Image from "next/image";
import Link from "next/link";

export function AdBanner({
  imageUrl = "/banner.jpg",
  href = "/for-business",
  alt = "ADNAVRA BLISS promotion",
}: {
  imageUrl?: string | null;
  href?: string;
  alt?: string;
}) {
  if (!imageUrl) return null;
  return (
    <section className="px-4 sm:px-6 lg:px-12 pt-4 max-w-[1400px] mx-auto">
      <Link
        href={href}
        className="block overflow-hidden rounded-xl sm:rounded-2xl border border-[#E5DDD0] shadow-[0_4px_16px_rgba(31,30,29,0.08)]"
      >
        {/* CarMarket's banner is ~1800x420 (≈4.3:1) on desktop; on mobile it
            needs a taller crop (≈2:1) or the text inside the banner image
            becomes unreadable — request 2 image sizes from whoever designs
            banner.jpg, or crop with object-position as done below. */}
        <div className="relative aspect-[2/1] sm:aspect-[16/9] lg:aspect-[21/5] w-full bg-[#F1E9DC]">
          <Image src={imageUrl} alt={alt} fill priority className="object-cover" sizes="100vw" />
        </div>
      </Link>
    </section>
  );
}
```
**1.1.b — Wire it into the homepage.** `src/app/page.tsx` — insert it right
after `<HomeHeader />` and before the hero `<section>`:
```tsx
import { AdBanner } from "@/components/customer/home/ad-banner";
// ...
<HomeHeader />
<AdBanner />          {/* NEW — reads from /banner.jpg by default; Phase 8.5 makes this admin-editable */}
<section className="relative border-b border-[#E5DDD0]"> …
```
**1.1.c — Add the placeholder asset.** Drop a real `banner.jpg` into
`public/banner.jpg` (matches the filename you were given). Until the admin
upload flow (Phase 8.5) exists, this static file is what renders.

**Verify (1.1):** Homepage loads with a banner strip directly under the
navbar, full width, rounded corners, clickable, correctly cropped at
375px/768px/1440px.

## 1.2 — Mobile nav: match CarMarket.lk's slide-open pattern (image 2)
Image 2 shows CarMarket's mobile nav: tapping the hamburger opens a
**full-width panel directly below the header** with the nav links stacked
and centered, not a floating dropdown card. ADNAVRA's `HomeHeader` mobile
menu (`src/components/customer/home/home-header.tsx`) is already close —
it opens a full-width panel — but it needs the same "look" (centered items,
consistent spacing, and it must also appear on **every** page that uses
`CustomerHeader`, not only the ones using `HomeHeader`), and it currently
lacks: search entry point, category/salon-type quick links, and the
language switcher (added in Phase 3).

**Edit `src/components/customer/home/home-header.tsx`** — replace the
mobile menu block (the `{mobileOpen && ( … )}` block near the bottom) with:
```tsx
{mobileOpen && (
  <div className="mx-auto mt-2 max-w-[1600px] rounded-2xl border border-white/10 bg-[#2A1D12] px-2 py-3 lg:hidden max-h-[calc(100dvh-6rem)] overflow-y-auto">
    <nav className="flex flex-col divide-y divide-white/10">
      {NAV_LINKS.map((l) => (
        <Link
          key={l.label}
          href={l.href}
          onClick={() => setMobileOpen(false)}
          className="px-4 py-3.5 text-center text-[15px] font-medium text-white/90 hover:bg-white/5"
        >
          {l.label}
        </Link>
      ))}
    </nav>
    <div className="mt-3 flex flex-col gap-2 px-2">
      <Link
        href="/customer/login"
        onClick={() => setMobileOpen(false)}
        className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 text-sm font-semibold text-white"
      >
        Log in
      </Link>
      <Link
        href="/login"
        onClick={() => setMobileOpen(false)}
        className="inline-flex h-11 items-center justify-center rounded-full bg-[#C9A063] text-sm font-semibold text-[#2A1D12]"
      >
        For business — Access Portal
      </Link>
      {/* LanguageSwitcher goes here — see Phase 3.3 */}
    </div>
  </div>
)}
```
This mirrors CarMarket's centered, stacked, full-width mobile list.

**Also apply the same panel style to `CustomerHeader`**
(`src/components/customer/customer-header.tsx`), which today has **no**
mobile menu at all — on small screens it only shows the logo plus a `Menu`
dropdown component (`MenuDropdown`) that is a small anchored popover, not a
full CarMarket-style panel. Fix `src/components/marketing/menu-dropdown.tsx`
so its `open` panel is full-width and slides from the **top**, not anchored
top-right, on mobile:
```tsx
// menu-dropdown.tsx — change the open-panel wrapper from:
<div className="absolute right-0 mt-2 w-72 rounded-xl border ...">
// to a responsive version: full-width sheet on mobile, small popover on desktop
<div className="fixed inset-x-0 top-16 z-50 mx-3 rounded-xl border border-[#ccc6bd]/40 bg-[#fdf9f3] shadow-[0_8px_30px_rgba(28,28,24,0.12)] p-2 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:mx-0 sm:w-72">
```

**Verify (1.2):** On a 375px viewport, tapping the hamburger on `/`
(HomeHeader) and on any customer page using `CustomerHeader` (e.g.
`/customer/login`) opens a full-width panel directly under the header with
centered, stacked links — matching image 2 — and it scrolls internally if
content exceeds the viewport instead of being cut off.

## 1.3 — Remove the "Help" chat icon from the dashboard topbar (separate mobile-nav item, requested again in Phase 7.1 — cross-referenced here since it's the same navbar family)
See Phase 7.1 — don't do it twice, it's listed once there with full detail.

---

# PHASE 2 — Homepage marketplace: categories, salon types, near-you, featured

## 2.1 — "Browse by category" — you already have exactly 8 treatments; keep them, just confirm the see-all wiring
Good news from reading the code: `src/lib/categories.ts` already defines
**exactly 8** `SERVICE_CATEGORIES` (Hair & styling, Nails, Hair removal,
Eyebrows & eyelashes, Facials & skincare, Massage, Spa & wellness, Makeup),
and `src/components/customer/home/browse-by-category.tsx` already accepts a
`limit` prop and renders a **"View all"** link to `/categories` when
`limit < SERVICE_CATEGORIES.length`. On the homepage it's called with
`limit={8}` — since there are exactly 8 categories, the "View all" link
currently **never appears** (limit equals total). That's fine functionally
today (nothing to see-all to), but per your request, treat this as the
reference pattern for 2.2 below. No code change required here unless you
add a 9th category later, at which point the existing logic already
produces the "See all" link automatically. Just visually confirm the grid
looks good at 2-cols mobile / 4-cols desktop (it already is: `grid-cols-2
sm:grid-cols-4`) — that satisfies "same size, nice icons, little captions,
user friendly on both".

## 2.2 — NEW: "Browse by salon type" section (Gents / Ladies / Unisex / Bridal / Home visit / …)
The taxonomy already exists in `src/lib/categories.ts` as `BUSINESS_TYPES`
(`unisex`, `gents`, `ladies`, `bridal`, `home-visits`, `spa-resort`, `kids`
— 7 total, covering the 5 you listed plus 2 extra) but there is **no
homepage section that renders it** — this is the missing piece you asked
for. Build it as a sibling of `BrowseByCategory`, reusing the exact same
visual language (numbered ghost index, icon chip, card-lift hover) so it
looks consistent, not bolted on.

**2.2.a — Give each salon type an icon.** Edit `src/lib/categories.ts`,
extend the `BUSINESS_TYPES` array with icons (currently it has no `icon`
field):
```ts
import { Scissors, Sparkles, HandMetal, Eraser, Eye, Smile, Waves, Flower2, Users, UserRound, Gem, Home, Baby } from "lucide-react";
// ...
export const BUSINESS_TYPES = [
  { slug: "unisex", label: "Unisex", icon: Users },
  { slug: "gents", label: "Gents only", icon: UserRound },
  { slug: "ladies", label: "Ladies only", icon: Sparkles },
  { slug: "bridal", label: "Bridal & occasion", icon: Gem },
  { slug: "home-visits", label: "Home visits", icon: Home },
  { slug: "spa-resort", label: "Spa & resort", icon: Flower2 },
  { slug: "kids", label: "Kids friendly", icon: Baby },
] as const;
```

**2.2.b — New component**, modeled 1:1 on `browse-by-category.tsx`. File
`src/components/customer/home/browse-by-salon-type.tsx`:
```tsx
import Link from "next/link";
import { BUSINESS_TYPES } from "@/lib/categories";
import { Reveal } from "./reveal";

export function BrowseBySalonType({
  limit,
  viewAllHref = "/salon-types",
}: {
  limit?: number;
  viewAllHref?: string;
}) {
  const types = typeof limit === "number" ? BUSINESS_TYPES.slice(0, limit) : BUSINESS_TYPES;
  const showViewAll = typeof limit === "number" && limit < BUSINESS_TYPES.length;

  return (
    <section id="salon-types" className="scroll-mt-28 px-6 lg:px-12 pt-10 pb-10 max-w-[1400px] mx-auto">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#795831]">Find your fit</p>
      <div className="mt-1 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#1F1E1D]">Browse by salon type</h2>
        <Link
          href={showViewAll ? viewAllHref : "/customer/search"}
          className="shrink-0 text-sm font-medium text-[#795831] hover:underline"
        >
          {showViewAll ? "See all" : `${BUSINESS_TYPES.length}`} types
        </Link>
      </div>

      <Reveal className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 reveal-stagger">
        {types.map((t, i) => (
          <Link
            key={t.slug}
            href={`/salon-types/${encodeURIComponent(t.slug)}`}
            className="group card-lift relative flex min-h-[152px] flex-col justify-between gap-6 rounded-xl border border-[#E5DDD0] bg-white p-5 hover:border-[#795831]"
          >
            <div className="flex items-start justify-between">
              <span className="num-ghost text-3xl font-semibold text-[#EDE6D8] tabular-nums leading-none">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="icon-pop flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F3ED] text-[#795831] group-hover:bg-[#795831] group-hover:text-white">
                <t.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="text-[15px] font-semibold text-[#1F1E1D]">{t.label}</p>
          </Link>
        ))}
      </Reveal>
    </section>
  );
}
```
With 7 total types and a homepage `limit={8}` (or omit `limit`), "See all"
never needs to trigger since 7 ≤ 8 — you said "show only 8, put see-all for
others", which this satisfies automatically as you add more types later
(the moment an 8th+ type is added, `limit={8}` will show exactly 8 plus a
working "See all").

**2.2.c — Wire into the homepage**, directly under `BrowseByCategory`.
`src/app/page.tsx`:
```tsx
import { BrowseBySalonType } from "@/components/customer/home/browse-by-salon-type";
// ...
<BrowseByCategory counts={categoryCounts} limit={8} />
<BrowseBySalonType limit={8} />     {/* NEW */}
```

**2.2.d — New listing route** for a salon type (mirrors the existing
`/categories/[slug]` route). New file `src/app/salon-types/[slug]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { VenueGrid } from "@/components/customer/home/venue-grid";
import { fetchVenuesByCategory } from "@/lib/marketplace-venues";
import { BUSINESS_TYPES, getCategoryLabel } from "@/lib/categories";

export function generateStaticParams() {
  return BUSINESS_TYPES.map((t) => ({ slug: t.slug }));
}

export default async function SalonTypePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!BUSINESS_TYPES.some((t) => t.slug === slug)) notFound();
  const label = getCategoryLabel(slug);
  const businesses = await fetchVenuesByCategory(slug); // already matches salonTypes.has(slug) — see 2.2.e
  return (
    <main className="relative min-h-screen bg-[#FDF9F3]">
      <HomeHeader />
      <section className="px-6 lg:px-12 pt-10 pb-16 max-w-[1400px] mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2A1D12]">Salon type</p>
        <h1 className="mt-1 text-2xl lg:text-3xl font-semibold tracking-tight text-[#1F1E1D]">{label}</h1>
        <p className="mt-2 text-sm text-[#8A8377]">{businesses.length} {businesses.length === 1 ? "salon" : "salons"}.</p>
        <div className="mt-8"><VenueGrid businesses={businesses} emptyText={`No ${label} salons yet.`} /></div>
      </section>
      <SiteFooter />
    </main>
  );
}
```
Also add a `/salon-types` page listing **all** types (copy
`src/app/categories/page.tsx` if it exists, or build a simple grid using
`BrowseBySalonType` with no `limit`).

**2.2.e — Confirm the matching query already works.**
`src/lib/marketplace-venues.ts`'s `fetchVenuesByCategory(slug)` already does
`OR: [{ categories: { has: slug } }, { salonTypes: { has: slug } }, {
services: { some: { category: slug } } }]` — so passing a `BUSINESS_TYPES`
slug already matches `salonTypes`. **No change needed** here, it was built
for exactly this. This confirms the missing piece really was only the
homepage section + route, not the data layer.

## 2.3 — Fix "Near you" (currently completely broken — confirmed root cause)
Reading `src/app/near-you/page.tsx` shows it is a **byte-for-byte duplicate**
of `src/app/categories/[slug]/page.tsx` (confirmed with `diff`, zero
differences) — it destructures `params: Promise<{ slug: string }>`, but the
`/near-you` route has no `[slug]` segment, so `params` is always `{}` and
`slug` is `undefined`. It then calls `fetchVenuesByCategory(undefined)`,
which safely returns an empty result (the try/catch in
`marketplace-venues.ts` swallows the Prisma type error) — so the page
silently renders **zero results**, forever, regardless of the visitor's
location. It never actually asks for geolocation at all. This matches
"the saloons near you should be perfectly working right now it is not
working" exactly.

**Fix: rewrite `src/app/near-you/page.tsx` from scratch** as a client-driven
page that asks for the browser's location (reusing the exact geolocation
pattern already proven elsewhere in this codebase, in
`src/components/customer/search/location-autocomplete.tsx`, so this isn't
new/unproven code) and ranks salons by distance server-side.

**2.3.a — New API route** `src/app/api/marketplace/near-you/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Haversine distance in km
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }
  const businesses = await db.business.findMany({
    where: { latitude: { not: null }, longitude: { not: null } },
    select: {
      id: true, name: true, slug: true, logoUrl: true, address: true, city: true,
      categories: true, salonTypes: true, latitude: true, longitude: true, marketplacePriority: true,
      services: { where: { isActive: true }, select: { category: true, price: true } },
    },
    take: 300, // ranked+sliced below; cap so this never becomes an unbounded query as the DB grows
  });
  const ranked = businesses
    .map((b) => ({ ...b, distanceKm: distanceKm(lat, lng, b.latitude as number, b.longitude as number) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 24);
  return NextResponse.json({ data: ranked });
}
```
*(For real scale later, replace the in-app Haversine sort with a PostGIS
`ST_Distance` query or Prisma raw SQL — 300 rows is fine for now but won't
scale to thousands of salons.)*

**2.3.b — Rewrite the page** as a client component that requests
geolocation, falls back gracefully, and reuses `VenueGrid`:
```tsx
// src/app/near-you/page.tsx
"use client";
import { useEffect, useState } from "react";
import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { VenueGrid } from "@/components/customer/home/venue-grid";
import { MapPin, Loader2 } from "lucide-react";

type NearVenue = {
  id: string; name: string; slug: string; logoUrl: string | null; address: string | null;
  city: string | null; categories: string[]; salonTypes: string[]; distanceKm: number;
  marketplacePriority: boolean; services: { category: string | null; price: number }[];
};

export default function NearYouPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "denied" | "unsupported">("idle");
  const [venues, setVenues] = useState<NearVenue[]>([]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`/api/marketplace/near-you?lat=${latitude}&lng=${longitude}`);
          const json = await res.json();
          setVenues(json.data ?? []);
          setStatus("ok");
        } catch {
          setStatus("denied");
        }
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }, []);

  const mapped = venues.map((v) => ({
    id: v.id, name: v.name, slug: v.slug, logoUrl: v.logoUrl, address: v.address, city: v.city,
    category: v.services[0]?.category ?? v.categories[0] ?? null, categories: v.categories,
    salonTypes: v.salonTypes, featured: v.marketplacePriority,
    fromPriceMinor: v.services.length ? Math.min(...v.services.map((s) => s.price)) : null,
  }));

  return (
    <main className="relative min-h-screen bg-[#FDF9F3]">
      <HomeHeader />
      <section className="px-6 lg:px-12 pt-10 pb-16 max-w-[1400px] mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2A1D12]">Near you</p>
        <h1 className="mt-1 text-2xl lg:text-3xl font-semibold tracking-tight text-[#1F1E1D]">Salons near you</h1>

        {status === "idle" || status === "loading" ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-[#8A8377]">
            <Loader2 className="h-4 w-4 animate-spin" /> Finding salons close to you…
          </div>
        ) : status === "unsupported" || status === "denied" ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#D9CFBE] bg-white p-8 text-center">
            <MapPin className="mx-auto h-6 w-6 text-[#9A7B4F]" />
            <p className="mt-3 text-sm font-semibold text-[#1F1E1D]">Location access needed</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-[#8A8377]">
              Allow location access in your browser to see salons closest to you, or browse the full
              directory instead.
            </p>
            <a href="/customer/search" className="mt-4 inline-flex text-sm font-medium text-[#795831] hover:underline">
              Browse all salons →
            </a>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-[#8A8377]">{venues.length} salons near you, closest first.</p>
            <div className="mt-8">
              <VenueGrid businesses={mapped} emptyText="No salons with a saved location yet." />
            </div>
          </>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
```
**2.3.c — Prerequisite:** this only works for salons that have
`latitude`/`longitude` saved — confirm the onboarding location step (Phase
6.3) actually always sets these two columns (it does, via `map-picker.tsx`),
and that admin-created salons (Task 3 in the prior implementation guide)
also collect them.

**2.3.d — Homepage rail:** `src/app/page.tsx` currently fakes "Near you" by
reusing `fetchVenues("desc", 8, 8)` (literally "newest minus the first 8",
nothing to do with location — see the comment already in that file
admitting this: `// "Near you" — client-side re-fetch will replace this
once location is known`). Leave the homepage rail as a low-friction teaser
row (it's fine as "some venues" for a home preview), but change its `href`
target and its data source to make it honest: keep it pointing at
`/near-you` (already does), and change its **label** so it's not promising
personalization it doesn't have on the homepage itself, e.g. keep "Near
you" as the section title (fine — the full experience is one click away on
`/near-you`, which now genuinely uses geolocation).

## 2.4 — Remove "New to Adnavra Bliss" rail from the homepage
Per your note ("no double booking remove this New to Adnavra Bliss") —
removing the third homepage rail. **`src/app/page.tsx`** — delete this
block:
```tsx
<VenueRailRow
  title="New to Adnavra Bliss"
  href="/new-to-adnavra-bliss"
  businesses={newest}
  emptyText="New arrivals will show here as salons sign up."
/>
```
and delete the now-unused `newest` fetch (`fetchVenues("desc", 8, 0)`) from
the `Promise.all` at the top of the file (keep `fetchVenues` for
`recommended` and the removed near-you fallback — just drop the `newest`
variable and its rail). You can leave the standalone `/new-to-adnavra-bliss`
route in place (harmless, not linked from nav) or delete
`src/app/new-to-adnavra-bliss/page.tsx` entirely if you want it fully gone —
recommend deleting it for cleanliness since nothing will link to it anymore.

## 2.5 — Add "Featured salons"
`Business.marketplacePriority: Boolean` already exists and is already read
into every `Venue.featured` field (`marketplace-venues.ts`,
`fetchVenues`/`fetchVenuesByCategory` both select it) and it's already
surfaced as a subscription-plan perk (`isFeaturedEligible` on
`SubscriptionPlan`, Phase 8.1) — but there is **no homepage rail that
actually filters `featured: true` and shows only those**. Add one.

**`src/app/page.tsx`** — add a fetch and a rail:
```ts
async function fetchFeaturedVenues(take = 8): Promise<Venue[]> {
  return fetchVenuesWhereExported... // see below — export a where-capable fetcher
}
```
Simplest correct approach: export the existing private `fetchVenuesWhere`
from `src/lib/marketplace-venues.ts` (rename export, it's already
file-scoped there) instead of duplicating logic in `page.tsx`, then in
`page.tsx`:
```ts
import { fetchVenues, fetchVenuesWhere } from "@/lib/marketplace-venues";
// ...
const featured = await fetchVenuesWhere({ marketplacePriority: true }, "desc", 8);
```
and render it as the **first** rail (before "Recommended"), since featured
placements are the salons who paid for visibility:
```tsx
<VenueRailRow
  title="Featured salons"
  href="/featured"
  businesses={featured}
  emptyText="Featured salons will appear here once a salon upgrades to a featured plan."
/>
```
Add the matching `/featured` "see all" route, copy-pasting the pattern from
`src/app/recommended/page.tsx` but with `where: { marketplacePriority:
true }` via the exported `fetchVenuesWhere` (do **not** copy the
near-you/categories bug of leaving stale unrelated logic in a duplicated
file — write this one specifically for the featured filter).

**Verify (Phase 2):** Homepage shows, top to bottom: banner ad → hero/search
→ trust bar → Browse by category (8, no dangling see-all) → Browse by salon
type (new, 7 types) → Featured salons rail (new) → Recommended rail → Near
you rail (still a teaser here, but `/near-you` itself now truly uses
geolocation and shows a real "allow location" state) → How it works → owner
CTA → footer. "New to Adnavra Bliss" is gone. Visiting `/near-you` in a
browser that grants location access returns real, distance-sorted results;
denying it shows a friendly fallback instead of a blank page.

---

# PHASE 3 — Sinhala language switcher (no Google Translate)

Google Translate's DOM-rewriting approach is exactly why it "messes up the
understanding of the sentence" — it translates text out of context,
word-by-word in places. The correct fix is a proper **i18n dictionary**:
every customer-facing string is translated once, by a person, into a
`si` (Sinhala) JSON file, and the UI switches between `en` and `si` using
React context — no runtime machine translation at all. This also gives you
a clean place to add more languages later (Tamil is the obvious next one
for Sri Lanka — build the system generically so adding `ta.json` later is
trivial).

## 3.1 — Install a lightweight i18n approach (no heavy framework needed)
Don't add `next-intl` or `react-i18next` for this — they're built for
route-based locales (`/en/...`, `/si/...`) which would mean re-routing the
entire app. A simpler **client-side dictionary + React context** switch is
enough here and touches far less of the existing app.

**New file `src/lib/i18n/dictionary.ts`:**
```ts
export type Locale = "en" | "si";

export const DEFAULT_LOCALE: Locale = "en";

// Keep keys flat and screen-scoped (e.g. "nav.home") so translators can
// work through this file top to bottom without guessing context.
export const dictionaries: Record<Locale, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.about": "About",
    "nav.locations": "Locations",
    "nav.contact": "Contact",
    "nav.login": "Log in",
    "nav.forBusiness": "For business",
    "home.hero.title1": "Book your next appointment.",
    "home.hero.title2": "Discover Sri Lanka's finest salons & spas.",
    "home.hero.subtitle": "Instantly explore and reserve verified hairstylists, skin clinics, luxury wellness spas, and beauty suites across the island.",
    "home.browseCategory": "Browse categories & services",
    "home.browseSalonType": "Browse by salon type",
    "home.seeAll": "See all",
    "home.featured": "Featured salons",
    "home.recommended": "Recommended",
    "home.nearYou": "Near you",
    "booking.selectServices": "Select your treatments",
    "booking.selectServices.sub": "Choose one or more services for this appointment.",
    "booking.step.services": "Services",
    "booking.step.professional": "Professional",
    "booking.step.time": "Time",
    "booking.step.confirm": "Confirm",
    "booking.yourDetails": "Your details",
    "booking.name": "Full name",
    "booking.phone": "Contact number",
    "booking.email": "Email (optional)",
    "booking.confirm": "Confirm booking",
    "booking.total": "Total",
    "footer.rights": "All rights reserved. Colombo, Sri Lanka.",
    // …add every remaining customer-facing string as you touch each
    // component in this task list; this file grows alongside the rest of
    // the work rather than being written all at once upfront.
  },
  si: {
    "nav.home": "මුල් පිටුව",
    "nav.about": "අප ගැන",
    "nav.locations": "ස්ථාන",
    "nav.contact": "සම්බන්ධ වන්න",
    "nav.login": "පිවිසෙන්න",
    "nav.forBusiness": "ව්‍යාපාරය සඳහා",
    "home.hero.title1": "ඔබේ ඊළඟ වේලාව වෙන් කරගන්න.",
    "home.hero.title2": "ශ්‍රී ලංකාවේ හොඳම සැලූන් සහ ස්පා සොයාගන්න.",
    "home.hero.subtitle": "දිවයින පුරා සත්‍යාපිත කොණ්ඩ නිර්මාණ ශිල්පීන්, සම ක්ලිනික, සුඛෝපභෝගී වෙල්නස් ස්පා සහ රූපලාවණ්‍ය සේවා ක්ෂණිකව සොයාගෙන වෙන් කරගන්න.",
    "home.browseCategory": "සේවා වර්ග අනුව සොයන්න",
    "home.browseSalonType": "සැලූන් වර්ගය අනුව සොයන්න",
    "home.seeAll": "සියල්ල බලන්න",
    "home.featured": "විශේෂිත සැලූන",
    "home.recommended": "නිර්දේශිත",
    "home.nearYou": "ඔබ අවට",
    "booking.selectServices": "ඔබේ ප්‍රතිකාර තෝරන්න",
    "booking.selectServices.sub": "මෙම වේලාව සඳහා එක් හෝ වැඩි ගණනක් සේවා තෝරන්න.",
    "booking.step.services": "සේවා",
    "booking.step.professional": "වෘත්තිකයා",
    "booking.step.time": "වේලාව",
    "booking.step.confirm": "තහවුරු කරන්න",
    "booking.yourDetails": "ඔබේ විස්තර",
    "booking.name": "සම්පූර්ණ නම",
    "booking.phone": "දුරකථන අංකය",
    "booking.email": "විද්‍යුත් තැපෑල (විකල්ප)",
    "booking.confirm": "වෙන්කිරීම තහවුරු කරන්න",
    "booking.total": "එකතුව",
    "footer.rights": "සියලුම හිමිකම් ඇවිරිණි. කොළඹ, ශ්‍රී ලංකාව.",
  },
};
```
> **Important note for whoever fills this file in:** the Sinhala strings
> above are starting placeholders written to be structurally correct — have
> a native Sinhala speaker (ideally someone at ADNAVRA) proofread every
> string before shipping. Get this reviewed rather than trusting any
> machine-generated Sinhala, including these — the whole point of this
> phase is to avoid mistranslation.

**New file `src/lib/i18n/locale-context.tsx`:**
```tsx
"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dictionaries, DEFAULT_LOCALE, type Locale } from "./dictionary";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const STORAGE_KEY = "adnavra-locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Read saved preference once on mount (client-only; avoids SSR mismatch)
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved === "en" || saved === "si") setLocaleState(saved);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  }

  function t(key: string): string {
    return dictionaries[locale][key] ?? dictionaries[DEFAULT_LOCALE][key] ?? key;
  }

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
```

## 3.2 — Mount the provider
**Edit `src/app/layout.tsx`** — wrap the customer-facing tree (do **not**
wrap `/dashboard` or `/admin` — those stay English-only for now, since your
request is specifically about the customer-facing site):
```tsx
import { LocaleProvider } from "@/lib/i18n/locale-context";
// ...
<body>
  <LocaleProvider>{children}</LocaleProvider>
</body>
```
Since `LocaleProvider` is a client component with internal state, this is
safe to place at the root — server components under it are unaffected and
only components that call `useLocale()` opt in.

## 3.3 — The switcher UI
**New file `src/components/customer/language-switcher.tsx`:**
```tsx
"use client";
import { Globe } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

export function LanguageSwitcher({ dark = false }: { dark?: boolean }) {
  const { locale, setLocale } = useLocale();
  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex items-center gap-1 rounded-full border p-0.5 text-xs font-semibold ${
        dark ? "border-white/20" : "border-[#E5DDD0]"
      }`}
    >
      <Globe className={`ml-1.5 h-3.5 w-3.5 ${dark ? "text-white/60" : "text-[#8A8377]"}`} />
      {(["en", "si"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            locale === l
              ? dark
                ? "bg-white text-[#2A1D12]"
                : "bg-[#2A1D12] text-white"
              : dark
              ? "text-white/70 hover:text-white"
              : "text-[#4A4640] hover:text-[#1F1E1D]"
          }`}
        >
          {l === "en" ? "EN" : "සිං"}
        </button>
      ))}
    </div>
  );
}
```
Add it to:
- `src/components/customer/home/home-header.tsx` — desktop right cluster
  (next to the search icon) **and** inside the mobile panel from Task 1.2
  (`dark` variant, since that header is dark brown).
- `src/components/customer/customer-header.tsx` — light variant, next to
  "Log in".
- `src/components/marketing/site-footer.tsx` — a small instance in the
  bottom bar is a nice-to-have but not required; header placement covers
  the requirement.

## 3.4 — Use `t()` across customer-facing text
This is incremental, not a one-shot rewrite: as you implement every other
customer-facing task in this document (homepage, booking wizard, salon
page), replace hardcoded English strings in those specific components with
`const { t } = useLocale(); …{t("some.key")}…` and add the matching key to
`dictionary.ts`. Do **not** attempt to internationalize the entire app in
one pass — prioritize the highest-traffic screens first: homepage hero +
nav (3.1 keys above already cover this), the booking wizard (Phase 4, this
is the most important screen to translate since it's where a Sinhala
speaker most needs clarity), and the salon public page.

**Verify (Phase 3):** Toggling EN/සිං in the header immediately swaps the
translated strings without a page reload, persists across a refresh
(localStorage), and never breaks layout (Sinhala text runs longer for some
words — check truncation/wrapping at 375px after adding it to the booking
wizard in particular).

---

# PHASE 4 — Booking workflow overhaul (the biggest change — take your time here)

This phase touches the database schema, the booking API, and the entire
`BookingWizard` component (1,106 lines today, single-service only, requires
a customer account). Read this whole phase before starting — the pieces
depend on each other in a specific order.

## 4.0 — What's wrong today (verified by reading the code)
- `src/components/booking/BookingWizard.tsx`: `selectedServiceId:
  string | null` — **one service at a time**, and the step-1 copy literally
  says *"Choose one service for this appointment"* (image 3 confirms this
  is exactly what you're seeing). No way to add a second treatment to the
  same appointment.
- `src/app/api/bookings/route.ts` `POST`: hard-requires a session
  (`if (!session?.user) return 401 "auth_required"`) and only accepts
  `CUSTOMER`-role sessions for self-booking. There is **no guest booking
  path** — this is why you have to remove "customer login" but the backend
  currently makes that impossible without a schema/API change.
- Same route: creates the booking with `status: "CONFIRMED"` directly —
  there is **no pending/approve step**, even though `BookingStatus` already
  has a `PENDING` value and the Prisma default is already `PENDING`
  (`prisma/schema.prisma` line ~335) — the API just overrides the default.
- `Booking` has a single `serviceId String` foreign key — **no way to
  attach multiple services to one appointment** at the schema level.
- No email or WhatsApp sending exists anywhere in the codebase
  (`grep`-confirmed — zero hits for nodemailer/resend/twilio/whatsapp).

## 4.1 — Schema changes
**Edit `prisma/schema.prisma`.**

**4.1.a — Group bookings made in the same wizard session.** Add a
nullable `groupId` so 1 customer selecting 3 treatments creates 3 `Booking`
rows (one per service, so each keeps its own duration/price/staff exactly
like every other part of the system already expects) that are visibly
"one appointment" to everyone. Sequential time slots (services run
back-to-back), same customer, same group:
```prisma
model Booking {
  id         String   @id @default(cuid())
  businessId String
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  serviceId String
  service   Service @relation(fields: [serviceId], references: [id], onDelete: Restrict)

  staffMemberId String?
  staffMember   StaffMember? @relation(fields: [staffMemberId], references: [id], onDelete: SetNull)

  customerId String
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Restrict)

  startTime DateTime @db.Timestamptz(6)
  endTime   DateTime @db.Timestamptz(6)

  status    BookingStatus @default(PENDING)
  reference String        @unique @default(cuid())

  // NEW — links every service in the same appointment together. Null for
  // legacy single-service bookings (backward compatible, no backfill needed).
  groupId      String?
  groupTotal   Int?     // sum of all services' prices in the group, minor units — denormalized for fast display

  notes String? @db.Text

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([businessId])
  @@index([groupId])   // NEW
  @@map("bookings")
}
```
**4.1.b — Booking model already defaults to `PENDING`** — no schema change
needed there, only the API needs to stop overriding it (4.4).

**4.1.c — Run the migration:**
```bash
npx prisma migrate dev --name add_booking_group_and_pending_default
```

## 4.2 — Remove the customer-login requirement everywhere in the booking flow
Per your instruction: **name and contact are required, email is optional,
no account needed.**

**4.2.a** — `src/schemas/booking.ts`: tighten the contract so `customerName`
and `customerPhone` are required for the public flow, email stays optional:
```ts
export const createBookingSchema = z.object({
  businessId: z.string().cuid(),
  // CHANGED: multiple services instead of one
  serviceIds: z.array(z.string().cuid()).min(1, "Select at least one treatment").max(10),
  staffMemberId: z.string().cuid().optional().nullable(),
  customerName: z.string().min(1, "Name is required").max(100).trim(),
  customerPhone: z.string().min(7, "Contact number is required").max(20).trim(),
  customerEmail: z.string().email().optional().nullable().or(z.literal("")),
  startAt: z.coerce.date(),
  notes: z.string().max(1000).optional().nullable(),
});
```

**4.2.b** — `src/app/api/bookings/route.ts` `POST`: remove the entire
auth-required block. New shape:
```ts
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await rateLimit(`booking-create:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many booking attempts. Please try again later." }, { status: 429, headers: rateLimitHeaders(rl, 10) });
  }

  // No auth requirement anymore — this is now a public, guest-friendly endpoint.
  // Staff/owner manual entry (walk-ins) still goes through this same route but is
  // detected via an authenticated OWNER/STAFF/ADMIN session when present.
  const session = await auth().catch(() => null);
  const sessionRole = (session?.user as unknown as { role: string } | undefined)?.role ?? null;
  const sessionUserId = (session?.user as unknown as { id: string } | undefined)?.id ?? null;
  const sessionBusinessId = (session?.user as unknown as { businessId: string | null } | undefined)?.businessId ?? null;
  const isStaffSession = sessionRole === "OWNER" || sessionRole === "STAFF" || sessionRole === "ADMIN";

  const body = await request.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400, headers: rateLimitHeaders(rl, 10) });
  }
  const { businessId, serviceIds, staffMemberId, startAt, notes, customerName, customerPhone } = parsed.data;
  const customerEmail = parsed.data.customerEmail || null;

  if (isStaffSession && (sessionRole === "OWNER" || sessionRole === "STAFF")) {
    if (!sessionBusinessId) return NextResponse.json({ error: "No business linked to account" }, { status: 400, headers: rateLimitHeaders(rl, 10) });
    if (businessId !== sessionBusinessId) return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: rateLimitHeaders(rl, 10) });
  }

  const business = await db.business.findUnique({ where: { id: businessId }, select: { id: true, openingHours: true } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404, headers: rateLimitHeaders(rl, 10) });

  const services = await db.service.findMany({ where: { id: { in: serviceIds }, businessId, isActive: true } });
  if (services.length !== serviceIds.length) {
    return NextResponse.json({ error: "One or more selected services are unavailable" }, { status: 404, headers: rateLimitHeaders(rl, 10) });
  }
  // Preserve the customer's chosen order (service picking order matters for sequencing)
  const orderedServices = serviceIds.map((id) => services.find((s) => s.id === id)!);

  if (staffMemberId) {
    const staff = await db.staffMember.findFirst({ where: { id: staffMemberId, businessId } });
    if (!staff) return NextResponse.json({ error: "Staff not found for this business" }, { status: 400, headers: rateLimitHeaders(rl, 10) });
  }

  const firstStart = new Date(startAt);
  if (Number.isNaN(firstStart.getTime())) return NextResponse.json({ error: "Invalid start time" }, { status: 400, headers: rateLimitHeaders(rl, 10) });

  // Build sequential [start,end) windows, one per service, back-to-back.
  const windows: { service: (typeof orderedServices)[number]; startTime: Date; endTime: Date }[] = [];
  let cursor = firstStart;
  for (const svc of orderedServices) {
    const end = new Date(cursor.getTime() + svc.duration * 60 * 1000);
    windows.push({ service: svc, startTime: cursor, endTime: end });
    cursor = end;
  }
  const groupStart = windows[0].startTime;
  const groupEnd = windows[windows.length - 1].endTime;

  // Opening-hours check against the FULL group span (not just the first service)
  const dateStr = toDateOnlyUtc(groupStart);
  const map = normalizeOpeningHours(business.openingHours as never);
  const opening = openingForDate(map, dateStr);
  if (opening) {
    if (opening.closed) return NextResponse.json({ error: "Business is closed on this day" }, { status: 409, headers: rateLimitHeaders(rl, 10) });
    const openParts = opening.open.split(":").map(Number);
    const closeParts = opening.close.split(":").map(Number);
    const ymd = dateStr.split("-").map(Number);
    const openDate = new Date(Date.UTC(ymd[0], ymd[1] - 1, ymd[2], openParts[0], openParts[1]));
    const closeDate = new Date(Date.UTC(ymd[0], ymd[1] - 1, ymd[2], closeParts[0], closeParts[1]));
    if (groupStart.getTime() < openDate.getTime() || groupEnd.getTime() > closeDate.getTime()) {
      return NextResponse.json({ error: `Slot must be within opening hours ${opening.open}–${opening.close}` }, { status: 409, headers: rateLimitHeaders(rl, 10) });
    }
  }

  // Overlap check across the WHOLE group span — no double booking (see 4.3)
  const overlapWhere: Record<string, unknown> = {
    businessId, status: { not: "CANCELLED" },
    startTime: { lt: groupEnd }, endTime: { gt: groupStart },
  };
  if (staffMemberId) (overlapWhere as Record<string, unknown>).staffMemberId = staffMemberId;
  const overlapping = await db.booking.findFirst({ where: overlapWhere as never, select: { id: true } });
  if (overlapping) {
    return NextResponse.json({ error: "That time is already booked. Please pick another time." }, { status: 409, headers: rateLimitHeaders(rl, 10) });
  }

  const groupId = crypto.randomUUID();
  const groupTotal = orderedServices.reduce((sum, s) => sum + s.price, 0);
  const reference = genReference(); // one reference shared by the whole group

  try {
    const result = await db.$transaction(async (tx) => {
      let customer = sessionUserId
        ? await tx.customer.findFirst({ where: { businessId, userId: sessionUserId } })
        : null;
      if (!customer && customerPhone) customer = await tx.customer.findFirst({ where: { businessId, phone: customerPhone } });
      if (!customer && customerEmail) customer = await tx.customer.findFirst({ where: { businessId, email: customerEmail } });
      if (!customer) {
        customer = await tx.customer.create({
          data: { businessId, name: customerName, email: customerEmail, phone: customerPhone, ...(sessionUserId ? { userId: sessionUserId } : {}) } as never,
        });
      }

      const bookings = [];
      for (const w of windows) {
        bookings.push(
          await tx.booking.create({
            data: {
              businessId, serviceId: w.service.id, staffMemberId: staffMemberId ?? null,
              customerId: customer.id, startTime: w.startTime, endTime: w.endTime,
              status: "PENDING", reference, groupId, groupTotal, notes: notes ?? null,
            },
          }),
        );
      }
      return { bookings, customer };
    });

    await auditLog({
      action: "booking.create", userId: sessionUserId ?? null, businessId, targetType: "Booking",
      targetId: result.bookings[0].id,
      metadata: { serviceIds, reference, groupId, staffMemberId: staffMemberId ?? null, createdByRole: sessionRole ?? "GUEST" },
      ip,
    });

    // NEW — Phase 4.5: notify the salon owner a booking is awaiting approval
    await notifyOwnerOfNewBooking({ businessId, reference, groupId }).catch((e) => console.error("[booking notify]", e));

    return NextResponse.json(
      { data: result.bookings, customer: result.customer, message: "Booking request sent — the salon will confirm shortly.", reference, groupId },
      { status: 201, headers: rateLimitHeaders(rl, 10) },
    );
  } catch (e: unknown) {
    const msg = (e as Error).message ?? "";
    if (msg.includes("23P01") || msg.includes("exclusion")) {
      return NextResponse.json({ error: "That time was just booked by someone else. Please pick another time." }, { status: 409, headers: rateLimitHeaders(rl, 10) });
    }
    console.error("[bookings POST] error:", msg);
    return NextResponse.json({ error: "Unable to create booking. Please try again." }, { status: 500, headers: rateLimitHeaders(rl, 10) });
  }
}
```
Add `import { notifyOwnerOfNewBooking } from "@/lib/notify";` (built in 4.5).

**4.2.c** — Remove the account gate from the wizard itself.
`src/components/booking/BookingWizard.tsx`: delete the entire
`useSession()`/`isCustomer` block and every place it's referenced (search
for `sessionStatus`, `isCustomer`, `currentUrlWithSelection`'s sign-in
redirect usage, and the "Log in to confirm" gating in the confirm step —
grep `useSession` in this file to find every usage). Replace with local
name/phone/email form fields (4.3 below). Also check
`src/app/[businessSlug]/book/page.tsx` (the route wrapper) — it's noted in
the code comments as *"already redirects logged-out visitors"* — find and
remove that redirect so guests can reach the wizard directly.

**Verify (4.2):** Open a salon's `/[slug]/book` page in a fully logged-out
private/incognito browser — the wizard loads immediately, no redirect to
login, no "sign in to continue" gate anywhere in the flow.

## 4.3 — Multi-treatment selection + contact form + redesigned mobile-first wizard
This is a substantial rewrite of `BookingWizard.tsx`. Rather than a
line-by-line diff of a 1,100-line file, here is the **exact shape** your
agent should rebuild it to — implement each piece, keeping the existing
slot-fetching (`/api/availability`) and staff-fetching logic, which don't
need to change:

**State changes:**
```ts
// OLD: const [selectedServiceId, setSelectedServiceId] = useState<string | null>(...)
// NEW:
const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
  initialServiceId ? [initialServiceId] : []
);
function toggleService(id: string) {
  setSelectedServiceIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
}
const selectedServices = useMemo(
  () => selectedServiceIds.map((id) => services.find((s) => s.id === id)).filter((s): s is Service => !!s),
  [selectedServiceIds, services],
);
const totalDuration = useMemo(() => selectedServices.reduce((sum, s) => sum + s.duration, 0), [selectedServices]);
const totalPrice = useMemo(() => selectedServices.reduce((sum, s) => sum + s.price, 0), [selectedServices]);

// NEW — contact fields, replacing the account-based identity
const [customerName, setCustomerName] = useState("");
const [customerPhone, setCustomerPhone] = useState("");
const [customerEmail, setCustomerEmail] = useState(""); // optional
const contactValid = customerName.trim().length > 0 && customerPhone.trim().length >= 7;
```

**Step 1 (Services) card rendering** — change the single-select radio
pattern (`isSelected = selectedServiceId === s.id`, clicking replaces the
selection) to a **multi-select checkbox** pattern (clicking toggles
membership, doesn't replace):
```tsx
{groupServices(services).map((group) => (
  <div key={group.key}>
    <h3 className="...">{group.label}</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {group.services.map((s) => {
        const isSelected = selectedServiceIds.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => toggleService(s.id)}
            aria-pressed={isSelected}
            className={`relative flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
              isSelected ? "border-[#795831] bg-[#F7F3ED] ring-2 ring-[#795831]/30" : "border-[#E5DDD0] bg-white hover:border-[#C9B99C]"
            }`}
          >
            <ServiceImage name={s.name} category={s.category} imageUrl={s.imageUrl} className="h-16 w-16 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[#1F1E1D] truncate">{s.name}</p>
              <p className="text-xs text-[#8A8377] mt-0.5">{s.duration} min · {formatPrice(s.price)}</p>
            </div>
            <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${isSelected ? "border-[#795831] bg-[#795831]" : "border-[#D9CFBE]"}`}>
              {isSelected && <Check className="h-3 w-3 text-white" />}
            </span>
          </button>
        );
      })}
    </div>
  </div>
))}
```
Change the copy from *"Choose one service for this appointment"* to
*"Choose one or more services for this appointment."* and change the
`goNext` guard from `!selectedServiceId` to `selectedServiceIds.length ===
0`. Add a sticky mobile summary bar at the bottom of step 1 (this is the
kind of "sticky total" pattern booking apps use so the customer always sees
what they've picked without scrolling back up — also solves the "not user
friendly" complaint):
```tsx
{selectedServiceIds.length > 0 && (
  <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E5DDD0] bg-white/95 backdrop-blur px-4 py-3 sm:static sm:mt-4 sm:rounded-xl sm:border sm:bg-[#F7F3ED]">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-[#8A8377]">{selectedServiceIds.length} treatment{selectedServiceIds.length > 1 ? "s" : ""} · {totalDuration} min</p>
        <p className="font-semibold text-[#1F1E1D]">{formatPrice(totalPrice)}</p>
      </div>
      <PrimaryCta onClick={goNext}>Continue</PrimaryCta>
    </div>
  </div>
)}
```

**New step, inserted before "confirm": "Your details"** (replaces the old
account/sign-in gate). Insert into `STEP_ORDER`/`STEP_LABELS`:
```ts
const STEP_ORDER: Step[] = ["services", "professional", "time", "details", "confirm"];
const STEP_LABELS: Record<Step, string> = { services: "Services", professional: "Professional", time: "Time", details: "Your details", confirm: "Confirm" };
```
Step body:
```tsx
{step === "details" && (
  <div className="space-y-4 max-w-md">
    <div>
      <label className="text-sm font-medium text-[#1F1E1D]">Full name *</label>
      <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required
        className="mt-1 w-full h-12 rounded-xl border border-[#E5DDD0] px-4 text-[15px] outline-none focus:border-[#795831]" placeholder="Your name" />
    </div>
    <div>
      <label className="text-sm font-medium text-[#1F1E1D]">Contact number *</label>
      <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required type="tel"
        className="mt-1 w-full h-12 rounded-xl border border-[#E5DDD0] px-4 text-[15px] outline-none focus:border-[#795831]" placeholder="07X XXX XXXX" />
      <p className="mt-1 text-xs text-[#8A8377]">The salon will contact you here to confirm your appointment.</p>
    </div>
    <div>
      <label className="text-sm font-medium text-[#1F1E1D]">Email <span className="text-[#8A8377] font-normal">(optional)</span></label>
      <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} type="email"
        className="mt-1 w-full h-12 rounded-xl border border-[#E5DDD0] px-4 text-[15px] outline-none focus:border-[#795831]" placeholder="you@example.com" />
    </div>
  </div>
)}
```
Guard: `if (step === "details" && !contactValid) return;` inside `goNext`.

**Confirm step submit payload:**
```ts
const res = await fetch("/api/bookings", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    businessId: business!.id,
    serviceIds: selectedServiceIds,          // CHANGED from serviceId
    staffMemberId: selectedStaffId,
    startAt: selectedSlot!.start,
    customerName, customerPhone, customerEmail: customerEmail || undefined,
    notes: notes || undefined,
  }),
});
```
Update every summary block that reads `selectedService`/`selectedService!`
(there are ~10 usages, listed in the grep output already gathered) to
instead render `selectedServices.map(...)` as a list with a running total
— e.g. the price sidebar becomes:
```tsx
<ul className="divide-y divide-[#F1EBDF]">
  {selectedServices.map((s) => (
    <li key={s.id} className="flex items-center justify-between py-2 text-sm">
      <span className="text-[#4A4640]">{s.name} · {s.duration} min</span>
      <span className="font-medium text-[#1F1E1D]">{formatPrice(s.price)}</span>
    </li>
  ))}
</ul>
<div className="flex items-center justify-between pt-3 border-t border-[#E5DDD0] mt-2">
  <span className="font-semibold">Total</span>
  <span className="font-semibold">{formatPrice(totalPrice)}</span>
</div>
```
And the success screen should say *"Your booking request has been sent —
the salon will confirm shortly"* rather than "Booking confirmed" (since it
now starts `PENDING`, see 4.4).

**Mobile-first structural fixes for the wizard itself** (this is the "not
scrollable / fixed / clutter / overlapping" complaint): the wizard's outer
container and step content must scroll independently of the fixed
summary/progress bars. Audit the component's top-level wrapper — it should
look like:
```tsx
<div className="flex min-h-[100dvh] flex-col">
  <div className="shrink-0"> {/* progress/step indicator, sticky top-0 */} </div>
  <div className="flex-1 overflow-y-auto overscroll-contain pb-28 sm:pb-8"> {/* step content — pb-28 clears the fixed mobile summary bar */}
    {/* step body */}
  </div>
  <div className="shrink-0 sm:static"> {/* back/continue CTA row — fixed on mobile only if content can overflow, else keep in normal flow */} </div>
</div>
```
Do not wrap the whole wizard in a component with `overflow-hidden` and a
fixed `h-[…]` — that combination is what produces "fixed and can't scroll".

**Verify (4.3):** On a 375px-wide screen, open the booking page, select 2–3
services from different categories (the sticky bottom bar shows a running
count/price and updates live), move through Professional → Time → Your
details (name+phone required, submit blocked without them, email optional)
→ Confirm, see all selected services + total listed, submit, and see a
"request sent" success state — no login prompt anywhere, no layout
clipping at any step, everything scrolls properly with the keyboard open
on the details step.

## 4.4 — No double booking (confirm existing protection still holds after the multi-service change)
The DB-level EXCLUDE constraint (Postgres `23P01`) already exists per-staff
and for unassigned bookings (`bookings_no_overlap_per_staff` /
`bookings_no_overlap_unassigned`, added in migration
`20260826073830_add_booking_overlap_exclusion` and
`20260826150000_add_unassigned_booking_exclusion`). Since 4.2.b now creates
**multiple rows per group** with sequential, non-overlapping windows, each
individual `Booking` row still satisfies its own non-overlap constraint
against every other row in the table (including rows from other groups) —
the group members never overlap each other by construction (they're
computed back-to-back), and each one is still checked against the rest of
the table by the existing exclusion constraint. **No constraint change
needed** — the app-level overlap check added in 4.2.b (checking the whole
group span before insert) plus the existing per-row DB constraint together
give you the same double-booking protection as before, now correctly
spanning multiple services. Just make sure the migration in 4.1.c doesn't
accidentally drop those constraints — Prisma migrate should only add
columns, but check the generated SQL before applying it in production.

## 4.5 — Approve / disapprove workflow + email/WhatsApp notification
**4.5.a — Stop auto-confirming.** Already done in 4.2.b (status is now
`"PENDING"` on create, not `"CONFIRMED"`).

**4.5.b — Approve/reject API.** `src/app/api/bookings/[id]/route.ts` already
has a `PATCH` (check it — it likely already accepts a `status` field per
`updateBookingSchema`). Confirm it allows `OWNER`/`STAFF`/`ADMIN` to set
`status: "CONFIRMED"` or `status: "CANCELLED"`, scoped to their own
`businessId`, and that changing status **also updates every other booking
in the same `groupId`** (so approving one card approves the whole
multi-treatment appointment at once):
```ts
// inside PATCH, after validating the target booking and new status:
if (booking.groupId) {
  await db.booking.updateMany({
    where: { groupId: booking.groupId, businessId: booking.businessId },
    data: { status: parsed.data.status },
  });
} else {
  await db.booking.update({ where: { id: booking.id }, data: { status: parsed.data.status } });
}
// after updating, fire the customer notification:
await notifyCustomerOfDecision({ bookingId: booking.id, status: parsed.data.status }).catch((e) => console.error("[booking notify]", e));
```

**4.5.c — Dashboard UI for approve/disapprove.** Find the existing
appointments list (`src/app/dashboard/sales/appointments/page.tsx` and/or
`src/app/dashboard/calendar/page.tsx` — check both) and, for any booking
`groupId` (or single booking with no group), render **one card per group**
(not one card per service row) with:
- All service names + combined duration + combined price (use the new
  `groupTotal` column instead of re-summing on every render).
- Two buttons for `PENDING` bookings: **Approve** (green) and **Decline**
  (outline/red), calling `PATCH /api/bookings/[id]` with
  `{status:"CONFIRMED"}` / `{status:"CANCELLED"}`.
- A status pill for everything else (`Confirmed`, `Cancelled`, `Completed`,
  `No-show`) matching the existing status-badge styling already used
  elsewhere in the dashboard (reuse, don't reinvent).
Grouping helper (client-side, since `GET /api/bookings` returns flat rows):
```ts
function groupBookings(rows: BookingRow[]) {
  const byGroup = new Map<string, BookingRow[]>();
  const singles: BookingRow[] = [];
  for (const b of rows) {
    if (b.groupId) {
      const arr = byGroup.get(b.groupId) ?? [];
      arr.push(b);
      byGroup.set(b.groupId, arr);
    } else {
      singles.push(b);
    }
  }
  return [...[...byGroup.values()].map((g) => ({ groupId: g[0].groupId!, bookings: g })), ...singles.map((b) => ({ groupId: null, bookings: [b] }))];
}
```
**4.5.d — Update the dashboard notification bell copy.** The `NotificationBell`
in `src/components/dashboard/topbar.tsx` currently shows a hardcoded
disclaimer: *"Right now all bookings are created as CONFIRMED
automatically, so there is no action needed."* — remove that paragraph
entirely (it's now false) and instead link straight to the appointments
page's pending filter, since pending bookings are now a real, actionable
queue.

**4.5.e — Notification sending.** No mail/SMS library exists yet — add one.
Recommend **Resend** (`npm install resend`) for email — simplest Next.js
integration, generous free tier, good for a Sri Lankan SaaS at this stage.
New file `src/lib/notify.ts`:
```ts
import { Resend } from "resend";
import { db } from "@/lib/db";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function notifyOwnerOfNewBooking({ businessId, reference, groupId }: { businessId: string; reference: string; groupId: string | null }) {
  const business = await db.business.findUnique({ where: { id: businessId }, select: { name: true, email: true, slug: true } });
  if (!business?.email || !resend) return; // no owner email on file, or Resend not configured — skip silently, don't throw
  await resend.emails.send({
    from: "ADNAVRA BLISS <bookings@adnavra.lk>", // must be a domain verified in Resend
    to: business.email,
    subject: `New booking request — ${reference}`,
    html: `<p>You have a new booking request (ref ${reference}) awaiting your approval.</p>
           <p><a href="https://YOUR_DOMAIN/dashboard/sales/appointments">Review it in your dashboard →</a></p>`,
  });
}

export async function notifyCustomerOfDecision({ bookingId, status }: { bookingId: string; status: string }) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { customer: true, business: { select: { name: true, phone: true } }, service: true },
  });
  if (!booking) return;
  const decided = status === "CONFIRMED" ? "confirmed" : status === "CANCELLED" ? "declined" : null;
  if (!decided) return;

  if (booking.customer.email && resend) {
    await resend.emails.send({
      from: "ADNAVRA BLISS <bookings@adnavra.lk>",
      to: booking.customer.email,
      subject: `Your booking at ${booking.business.name} was ${decided}`,
      html: `<p>Hi ${booking.customer.name}, your booking (ref ${booking.reference}) at ${booking.business.name} has been <strong>${decided}</strong>.</p>`,
    });
  }
  // WhatsApp — see note below; wa.me fallback needs no API keys but is not
  // fully automated (no server-side "send" without WhatsApp Business API/Twilio).
}
```
Add `RESEND_API_KEY` to `.env` / `.env.example` and to your Vercel project
env vars.

**On WhatsApp specifically** — there is no way to send an **automated**
WhatsApp message without either (a) the official WhatsApp Business
Platform (Meta) with a verified business + phone number, or (b) a paid
provider like Twilio's WhatsApp API, both of which need real business
verification and take days to set up. Two honest options, pick one for
launch:
1. **MVP now, zero setup:** generate a pre-filled `wa.me` deep link
   (`https://wa.me/94771234567?text=...`) shown to the **salon staff** in
   the dashboard notification/approval UI, so they tap it and send the
   WhatsApp confirmation manually with one tap — no API needed, works
   today.
2. **Fully automated later:** once ADNAVRA has a verified WhatsApp Business
   number, swap in Twilio's WhatsApp API (`npm install twilio`) inside
   `notifyCustomerOfDecision`, gated behind an env var so it degrades
   gracefully if not configured (same pattern as the `resend` null-check
   above).
Recommend shipping with option 1 now (add the `wa.me` link next to each
approve/decline card in 4.5.c) and treating full automation as a fast-
follow — don't block the rest of this task list on WhatsApp Business
verification.

**Verify (Phase 4.5):** Create a booking as a guest → dashboard shows it as
one grouped card with status "Pending" and Approve/Decline buttons →
clicking Approve flips the whole group to Confirmed and (with
`RESEND_API_KEY` set) sends the customer a confirmation email → the
notification bell no longer claims bookings auto-confirm.

---

# PHASE 5 — Salon public page fixes (`src/app/[businessSlug]/page.tsx`)

## 5.1 — Hide "Meet the Team" and "Guest Experiences" when empty
Today both sections **always render**, showing a dashed empty-state card
(this is exactly image 4) instead of disappearing. Fix: only render the
`<section>` — including its nav link — when there is real data.

**Edit `src/app/[businessSlug]/page.tsx`:**
```tsx
// Team section — wrap the whole <section> in a length check
{business.staffMembers.length > 0 && (
  <section aria-label="Team">
    <SectionHeader id="specialists" eyebrow="Artistry & care" title="Meet the Team" />
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {business.staffMembers.map((m) => ( /* unchanged */ ))}
    </div>
  </section>
)}
```
```tsx
// Reviews section — needs real review data first (it currently has none —
// see 5.2). Once reviews are fetched:
{reviews.length > 0 && (
  <section aria-label="Reviews">
    <SectionHeader id="reviews" eyebrow="Feedback & praise" title="Guest Experiences" right={<span>{reviewCount} reviews · {avgRating.toFixed(1)} ★</span>} />
    {/* render actual review cards — see 5.2 */}
  </section>
)}
```
Then fix the `navLinks` array (further up the same file) so "Specialists"
and "Reviews" only appear in the sticky top nav when their section is
present — it already uses a `show:` boolean pattern for "Atmosphere" and
"Location", extend the same pattern:
```ts
const navLinks = [
  { href: "#services", label: "Services", show: true },
  { href: "#atmosphere", label: "Atmosphere", show: galleryPhotos.length > 0 },
  { href: "#specialists", label: "Specialists", show: business.staffMembers.length > 0 }, // CHANGED from `show: true`
  { href: "#hours-side", label: "Hours", show: true },
  { href: "#reviews", label: "Reviews", show: reviews.length > 0 }, // NEW
  { href: "#location", label: "Location", show: hasLocation },
].filter((l) => l.show);
```

## 5.2 — Wire up real reviews on the public page (currently 100% hardcoded placeholder)
Reading the code confirms the "Guest Experiences" section never actually
queries the `Review` table at all — it's a static empty-state block. The
real `GET /api/reviews` route exists but is **auth-gated to staff** and
**locked behind the `onlineReputation` plan feature** — neither is
appropriate for a public storefront page (customers browsing a salon they
don't own shouldn't need a plan check). Query reviews directly in the
server component instead, unrelated to that gated staff-facing API.

**In `src/app/[businessSlug]/page.tsx`, alongside the existing
`db.business.findUnique(...)` call**, add:
```ts
const [reviews, reviewAgg] = await Promise.all([
  db.review.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: { customer: { select: { name: true } } },
  }),
  db.review.aggregate({ where: { businessId: business.id }, _avg: { rating: true }, _count: true }),
]);
const avgRating = reviewAgg._avg.rating ?? 0;
const reviewCount = reviewAgg._count;
```
Render actual cards when `reviews.length > 0` (star rating + comment +
reviewer first name + relative date), keeping the existing empty-state
markup only as a true fallback if you want it — but per your instruction,
prefer hiding the whole section over showing an empty state.

## 5.3 — Add a working "Leave feedback" button + public review submission
**5.3.a — New public API**, `src/app/api/public/reviews/route.ts` (separate
from the staff-only `/api/reviews` route — deliberately public, rate
limited, no plan gate):
```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { z } from "zod";

const publicReviewSchema = z.object({
  businessId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().nullable(),
  name: z.string().min(1).max(100).optional(), // optional reviewer name — not tied to a Customer account
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await rateLimit(`review-create:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.success) return NextResponse.json({ error: "Too many reviews submitted. Try again later." }, { status: 429, headers: rateLimitHeaders(rl, 5) });

  const body = await request.json().catch(() => null);
  const parsed = publicReviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400, headers: rateLimitHeaders(rl, 5) });

  const business = await db.business.findUnique({ where: { id: parsed.data.businessId }, select: { id: true } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404, headers: rateLimitHeaders(rl, 5) });

  const review = await db.review.create({
    data: {
      businessId: parsed.data.businessId,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
      source: "marketplace",
      // customerId intentionally omitted — Review.customerId is nullable; a public
      // reviewer's display name is stored on the review's `comment` context by the UI,
      // OR extend the schema with a nullable `reviewerName String?` column if you want
      // it stored structurally rather than folded into the comment. Recommended: add
      // that column — cleaner than overloading `comment`.
    },
  });
  return NextResponse.json({ data: review }, { status: 201, headers: rateLimitHeaders(rl, 5) });
}
```
**Recommended schema addition** (small, additive) so the reviewer's name is
stored properly instead of folded into the comment text — add to `Review`
in `prisma/schema.prisma`:
```prisma
model Review {
  // ...existing fields...
  reviewerName String?   // NEW — public reviewer's display name when no Customer account exists
}
```
then `npx prisma migrate dev --name add_review_reviewer_name` and use
`reviewerName: parsed.data.name || null` in the create call above.

**5.3.b — Feedback button + modal on the public page.** New component
`src/components/business/feedback-button.tsx`:
```tsx
"use client";
import { useState } from "react";
import { Star, X } from "lucide-react";

export function FeedbackButton({ businessId, businessName }: { businessId: string; businessName: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/public/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, rating, comment: comment || undefined, name: name || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to submit feedback");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-[#E5DDD0] bg-white px-4 py-2 text-sm font-medium text-[#1F1E1D] hover:bg-[#F7F3ED]">
        <Star className="h-4 w-4 text-[#9A7B4F]" /> Leave feedback
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-6 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#1F1E1D]">Rate {businessName}</h3>
              <button aria-label="Close" onClick={() => setOpen(false)}><X className="h-5 w-5 text-[#8A8377]" /></button>
            </div>
            {done ? (
              <p className="mt-6 text-sm text-[#4A4640]">Thanks for your feedback!</p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                      <Star className={`h-7 w-7 ${n <= rating ? "fill-[#9A7B4F] text-[#9A7B4F]" : "text-[#E5DDD0]"}`} />
                    </button>
                  ))}
                </div>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" className="w-full h-11 rounded-xl border border-[#E5DDD0] px-3 text-sm" />
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Tell others about your visit (optional)" className="w-full rounded-xl border border-[#E5DDD0] px-3 py-2 text-sm" />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="button" onClick={submit} disabled={submitting} className="w-full h-11 rounded-full bg-[#1F1B17] text-white text-sm font-semibold disabled:opacity-50">
                  {submitting ? "Submitting…" : "Submit feedback"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```
Place it in the "Guest Experiences" section header's `right` slot (reusing
the existing `SectionHeader` `right` prop already used elsewhere on this
page for the photo count), so it's visible whether or not reviews already
exist:
```tsx
<SectionHeader id="reviews" eyebrow="Feedback & praise" title="Guest Experiences" right={<FeedbackButton businessId={business.id} businessName={business.name} />} />
```
And show it even when there are zero reviews yet — i.e., keep a lightweight
"No reviews yet — be the first" state **with the feedback button visible**,
rather than hiding the whole section, since your instruction was to hide
team/reviews only when *empty of any way to add them*; the feedback button
being present means the section still has a purpose. (If you'd rather hide
it fully until the first review exists, move `FeedbackButton` next to the
services section instead — either is reasonable, pick one and be
consistent.)

## 5.4 — Back button on salon pages
Add a simple, reliable back control — browser history back, with a
same-origin fallback to the homepage. New component
`src/components/business/back-button.tsx`:
```tsx
"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/");
      }}
      aria-label="Go back"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E9E1D3] bg-white text-[#4A4640] hover:bg-[#F1E9DC]"
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
}
```
Add it to the sticky top nav in `src/app/[businessSlug]/page.tsx`, to the
**left** of the logo (mobile-first — this is the first thing a thumb
reaches):
```tsx
<div className={`${WRAP} flex h-16 items-center justify-between gap-3`}>
  <div className="flex items-center gap-2">
    <BackButton />
    <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="ADNAVRA BLISS home">…</Link>
  </div>
  …
```
Also add the same `BackButton` to the top of `BookingWizard.tsx`'s header
row (booking pages are one level deeper, back should return to the salon
page) and to `src/app/customer/account/*` pages if they don't already have
one.

## 5.5 — Atmosphere: keep desktop image count, cap mobile thumbnails at 3
`src/components/business/venue-gallery.tsx`'s thumbnail grid currently
renders **all** photos in a `grid-cols-3 sm:grid-cols-4` grid on every
breakpoint. Change it to slice to 3 on mobile only:
```tsx
{photos.length > 1 && (
  <div className="mt-3 grid grid-cols-3 gap-3 sm:hidden" role="tablist" aria-label="Photo thumbnails">
    {photos.slice(0, 3).map((p, i) => ( /* same button markup as before */ ))}
  </div>
)}
{photos.length > 1 && (
  <div className="mt-3 hidden sm:grid sm:grid-cols-4 gap-3" role="tablist" aria-label="Photo thumbnails">
    {photos.map((p, i) => ( /* same button markup, full desktop set — unchanged behavior */ ))}
  </div>
)}
```
(Duplicate the existing `<button>` markup into both blocks rather than
trying to share one block with a responsive `slice` — keeps the diff small
and avoids a hydration mismatch between server/client photo counts.)

## 5.6 — Always show 4 treatments, add "See all" for the rest
`src/components/business/service-tabs.tsx` currently renders **every**
service in the active tab with no cap. Add a 4-item default + expand:
```tsx
const [showAll, setShowAll] = useState(false);
const visibleServices = showAll ? visible : visible.slice(0, 4);
// ...
<ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
  {visibleServices.map((s) => ( /* unchanged card markup */ ))}
</ul>
{!showAll && visible.length > 4 && (
  <div className="mt-4 flex justify-center">
    <button type="button" onClick={() => setShowAll(true)} className="inline-flex h-10 items-center rounded-full border border-[#E5DDD0] px-5 text-sm font-medium text-[#1F1E1D] hover:bg-[#F7F3ED]">
      See all {visible.length} treatments
    </button>
  </div>
)}
```
Reset `showAll` to `false` whenever the active category tab changes (add
`useEffect(() => setShowAll(false), [active])`) so switching categories
doesn't leave a stale "expanded" state.

## 5.7 — Opening hours: dashboard-editable tab, linked from the public page
The public page already renders opening hours nicely (the `hoursCard`
block, with a correct empty state). What's missing is a **dedicated
dashboard settings tab** to edit them (confirm whether
`src/app/dashboard/settings/scheduling/page.tsx` already covers this — open
it and check). If it only covers staff shifts and not the business-level
`Business.openingHours` JSON, add a clearly-labeled "Opening hours" card
there with one row per day (`Mon…Sun`, open/close time pickers + a
"Closed" toggle), saving via `PATCH /api/businesses/[id]` with an
`openingHours` payload shaped exactly like
`src/lib/availability.ts`'s `normalizeOpeningHours` expects (open that file
to confirm the exact JSON shape before building the form, since the public
page's `hoursMap`/`groupHours` logic must match it exactly or hours will
silently mismatch between dashboard and public page). Link to it explicitly
from the public page's "Opening Hours" card is not needed on the public
side (customers don't edit it) — instead, add a **dashboard** sidebar/topbar
shortcut or a "Edit hours" link inside `src/app/dashboard/settings/business/page.tsx`
pointing at the scheduling tab, so owners can find it in one click from
the business profile screen where they're already editing everything else.

**Verify (Phase 5):** Visit a salon with no staff and no reviews — "Meet the
Team" and "Guest Experiences" sections (and their nav links) don't render
at all except the review section's feedback CTA if you chose to keep it
visible per 5.3. Visit a salon with staff and reviews — both sections
render with real data, ratings shown. Tap "Leave feedback", submit a
review, refresh — it appears. A back button appears top-left on the salon
page and in the booking wizard. A gallery with 6 photos shows all 6
thumbnails on desktop and only 3 on a 375px screen. A salon with 9 services
shows exactly 4 + a "See all 9 treatments" button that expands in place.

---

# PHASE 6 — Salon onboarding fixes

## 6.0 — Root cause: three different, disconnected category taxonomies
Reading the code turned up a real structural bug: there are **three
separate, non-matching lists** used for "what kind of salon is this":
1. `src/lib/categories.ts` → `SERVICE_CATEGORIES` (8 slugs like
   `hair-styling`, `facials-skincare`) — used by the homepage "Browse by
   category" and by `fetchVenuesByCategory`.
2. `src/lib/categories.ts` → `BUSINESS_TYPES` (7 slugs like `unisex`,
   `gents`) — used by the new "Browse by salon type" (Phase 2.2) and
   already matched by `fetchVenuesByCategory`.
3. `src/components/onboarding/step-categories.tsx` → a **third, bespoke**
   `CATEGORIES` array (`hair-salon`, `medspa`, `barber`, `tattoo-piercing`,
   `pet-grooming`, …, images 6–7) whose slugs **match neither of the
   above**.

Because onboarding saves whatever the salon picks from list #3 straight
into `Business.categories`, and the homepage category filter matches
against list #1's slugs, a salon that picks "Barber" and "Medspa" during
onboarding will **never show up** when a customer browses "Facials &
skincare" or any other homepage category — the slugs simply don't overlap.
This is very likely a real, currently-invisible bug affecting your search
results, on top of being the literal cause of "the home page categories
and types should show the salons that only choose specific types and
categories" not working the way you expect.

## 6.1 — Fix: onboarding reuses the real `SERVICE_CATEGORIES` taxonomy (max 4)
**Edit `src/components/onboarding/step-categories.tsx`** — delete the local
bespoke `CATEGORIES` array entirely and import the shared one:
```tsx
"use client";
import { SERVICE_CATEGORIES } from "@/lib/categories";

export function StepCategories({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div>
      <p className="text-sm text-[#a89880] mb-4">Choose up to 4 treatment categories your salon offers.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SERVICE_CATEGORIES.map((c) => {
          const active = selected.includes(c.slug);
          const disabled = !active && selected.length >= 4;
          return (
            <button key={c.slug} type="button" disabled={disabled} onClick={() => onToggle(c.slug)}
              className={`rounded-xl border p-5 text-left transition-colors ${active ? "border-[#c9a26d] bg-[#c9a26d]/10" : "border-[#e6dcc8] bg-[#f6efe3] hover:bg-[#f3ebdd]"} disabled:opacity-40`}>
              <c.icon className="h-5 w-5" />
              <p className="mt-3 text-sm font-medium">{c.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```
Grid changed from `md:grid-cols-3` (matching the old 12-item list) to
`md:grid-cols-4` (matching the new 8-item list, same visual density as
`browse-by-category.tsx` for consistency — images 6/7's card style is kept
identically, only the content/taxonomy changes).

## 6.2 — NEW onboarding step: salon type (max 4, using `BUSINESS_TYPES`)
**New file `src/components/onboarding/step-salon-types.tsx`**, styled
identically to `step-categories.tsx` above:
```tsx
"use client";
import { BUSINESS_TYPES } from "@/lib/categories";

export function StepSalonTypes({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div>
      <p className="text-sm text-[#a89880] mb-4">Choose up to 4 types that describe your salon (e.g. Gents, Ladies, Unisex, Bridal, Home visits).</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {BUSINESS_TYPES.map((t) => {
          const active = selected.includes(t.slug);
          const disabled = !active && selected.length >= 4;
          return (
            <button key={t.slug} type="button" disabled={disabled} onClick={() => onToggle(t.slug)}
              className={`rounded-xl border p-5 text-left transition-colors ${active ? "border-[#c9a26d] bg-[#c9a26d]/10" : "border-[#e6dcc8] bg-[#f6efe3] hover:bg-[#f3ebdd]"} disabled:opacity-40`}>
              <t.icon className="h-5 w-5" />
              <p className="mt-3 text-sm font-medium">{t.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```
**Wire it into the wizard**, `src/app/dashboard/onboarding/page.tsx`:
```ts
const TOTAL_STEPS = 6; // was 5 — new step inserted
// ...
const [salonTypes, setSalonTypes] = useState<string[]>([]);
function toggleSalonType(id: string) {
  setSalonTypes((cur) => (cur.includes(id) ? cur.filter((c) => c !== id) : cur.length < 4 ? [...cur, id] : cur));
}
```
Insert a new `case`/step between the existing "categories" step and
"team size" step (follow the exact pattern already used for the other
steps in this file's render switch), and include `salonTypes` in the
`POST /api/businesses` body in `handleFinish`:
```ts
body: JSON.stringify({
  name, slug: slugify(name), website: website || undefined,
  categories, salonTypes, // salonTypes NEW
  teamSize, locationType, /* ...unchanged location fields... */
}),
```
Confirm `src/schemas/business.ts`'s `createBusinessSchema` already accepts
`salonTypes` (it should, per the prior implementation guide's Task 1 — if
not, add `salonTypes: z.array(z.string()).max(4).optional()` alongside
`categories`) and that `POST /api/businesses` passes it through to
`db.business.create`.

## 6.3 — Onboarding location step: keep the manual pin, add "use my current location"
`src/components/onboarding/step-location-map.tsx` already has a
draggable-pin map (`MapPicker`) — keep that exactly as-is, it satisfies "we
have to manually add a pin to map keep that also". Add a location-request
button above it, reusing the exact geolocation pattern already proven in
`src/components/customer/search/location-autocomplete.tsx` (grep
`navigator.geolocation` there for the reference implementation):
```tsx
// step-location-map.tsx — add above <MapPicker ... />
const [locating, setLocating] = useState(false);
const [geoError, setGeoError] = useState<string | null>(null);

function useMyLocation() {
  if (!navigator.geolocation) { setGeoError("Geolocation isn't supported in this browser."); return; }
  setLocating(true);
  setGeoError(null);
  navigator.geolocation.getCurrentPosition(
    (pos) => { onChange({ ...value, latitude: pos.coords.latitude, longitude: pos.coords.longitude }); setLocating(false); },
    () => { setGeoError("Couldn't get your location — drag the pin manually instead."); setLocating(false); },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
  );
}
// ...JSX, directly above <MapPicker>:
<button type="button" onClick={useMyLocation} disabled={locating}
  className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#e6dcc8] bg-white px-4 py-2 text-sm font-medium text-[#3a2f22] hover:bg-[#f6efe3] disabled:opacity-50">
  <LocateFixed className="h-4 w-4" /> {locating ? "Locating…" : "Use my current location"}
</button>
{geoError && <p className="mb-2 text-xs text-red-600">{geoError}</p>}
```
(`import { LocateFixed } from "lucide-react";`) This sets the pin to the
device's GPS position, then the salon owner can still drag it to fine-tune
— both workflows coexist, exactly as requested.

## 6.4 — Fix image 5's bug: onboarding shouldn't show the full dashboard chrome
Root cause, confirmed by reading `src/app/dashboard/layout.tsx`: **every**
route under `/dashboard`, including `/dashboard/onboarding`, renders inside
the same layout that includes the full `DashboardSidebar` (with PRO badges
on sections the salon can't use yet) and `DashboardTopbar` (search,
reports, QR, notifications, help, account menu) — none of which make sense
while a salon hasn't finished setting up their profile yet. That's the
clutter you're seeing in images 5–7.

**Fix: give onboarding its own layout that skips the dashboard chrome.**
Move (or route-group) onboarding so it renders standalone:
```
src/app/dashboard/onboarding/page.tsx
```
becomes
```
src/app/(onboarding)/dashboard/onboarding/layout.tsx   <-- NEW, minimal
src/app/(onboarding)/dashboard/onboarding/page.tsx      <-- MOVED, unchanged content
```
Next.js route groups (`(onboarding)`) let you keep the exact same URL
(`/dashboard/onboarding`) while opting out of the parent `dashboard/layout.tsx`
— **but only if `(onboarding)` and `dashboard` are siblings, not nested**,
since a layout only applies to routes physically nested under it on disk.
Concretely: create `src/app/(onboarding)/dashboard/onboarding/` as a
**new** path outside the existing `src/app/dashboard/` folder — Next.js
resolves both to the same `/dashboard/onboarding` URL as long as no other
literal `src/app/dashboard/onboarding/page.tsx` also exists (delete the old
one after moving its contents). The new minimal layout:
```tsx
// src/app/(onboarding)/dashboard/onboarding/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/onboarding");
  const role = (session.user as unknown as { role: string }).role;
  if (!["OWNER", "STAFF", "ADMIN"].includes(role)) redirect("/");
  return <div className="min-h-screen bg-[#faf6ef]">{children}</div>; // no sidebar, no topbar — just the wizard
}
```
This keeps auth protection (don't drop that) while removing every bit of
dashboard chrome — the onboarding wizard becomes a focused, full-screen
flow exactly like `WizardShell` was designed to look, with nothing behind
it. Double check `src/app/dashboard/layout.tsx`'s own onboarding-redirect
guard (the block that sends new OWNER/STAFF without a `businessId` to
`/dashboard/onboarding`) still works after the move — it only checks the
URL string, so it will.

**Verify (Phase 6):** A brand-new salon signs up, is redirected to
`/dashboard/onboarding`, and sees **only** the wizard (progress bar, step
content, back/continue) with no sidebar icons or topbar buttons around it.
Step 2 shows the 8 real treatment categories (Hair & styling, Nails, …),
capped at 4. A new step 3 shows the 7 salon types, capped at 4. Step 4
(location) has a "Use my current location" button above the draggable pin
map. After finishing, the salon's homepage category cards and salon-type
cards (Phase 2) correctly show this salon when a customer filters by
whatever it picked — because the slugs now match end to end.

---

# PHASE 7 — Salon dashboard: mobile-first pass + specific bug fixes

## 7.1 — Remove the "Help" button from the dashboard top navbar
Three places currently link to `/help` in the dashboard chrome — remove
**all three** (you asked for the navbar one specifically; the sidebar and
mobile-nav copies are the same link duplicated, remove those too for
consistency unless you want Help reachable some other way, e.g. folded
into the account menu instead):
1. `src/components/dashboard/topbar.tsx` — delete the `<Link href="/help"
   aria-label="Help chat">…<MessageCircle …/></Link>` block entirely.
2. `src/components/dashboard/sidebar.tsx` — delete the bottom `<Link
   href="/help" …><HelpCircle …/></Link>` block (and the now-unused
   `HelpCircle` import).
3. `src/components/dashboard/mobile-nav.tsx` — delete the `<Link
   href="/help" …>Help</Link>` block at the bottom of the slide-in panel
   (and the now-unused `HelpCircle` import).
If you still want a way to reach `/help`, the cleanest place is inside
`AccountMenu` (`src/components/dashboard/account-menu.tsx`) as a menu item
— optional, not required by your instruction, mention it as a suggestion
only if asked.

## 7.2 — Dashboard mobile-first pass
The dashboard already has real mobile scaffolding (`MobileNav` slide-in
panel, a `md:hidden` trigger row) — the work here is auditing every
**page** under `src/app/dashboard/**` for the same "fixed/clutter/
overlap" issues called out in Phase 4, since this is the same "mobile
first" instruction applied to the salon-facing side, not just the
customer-facing booking flow. Priority order (highest traffic first):
1. `src/app/dashboard/page.tsx` (home) — check stat cards don't overflow
   horizontally at 375px; grids should be `grid-cols-1 sm:grid-cols-2
   lg:grid-cols-4`, not a fixed multi-column grid that forces horizontal
   scroll.
2. `src/app/dashboard/calendar/page.tsx` + `src/components/dashboard/
   calendar-pro-tools.tsx` — a full week/day calendar grid is the single
   hardest thing to make mobile-first; at minimum, add a day-only view
   toggle for `<640px` viewports instead of trying to cram a 7-day grid
   into a phone screen.
3. `src/components/dashboard/add-booking-modal.tsx` — this is a modal, the
   most common source of "fixed and not scrollable" bugs; apply the same
   `max-h-[90dvh] overflow-y-auto` pattern used in the feedback modal
   (Phase 5.3.b) and in the wizard fix (Phase 4.3).
4. `src/app/dashboard/sales/appointments/page.tsx` — now the primary
   approve/decline screen (Phase 4.5.c) — make sure each grouped booking
   card stacks its Approve/Decline buttons full-width on mobile instead of
   sitting side-by-side and getting cramped.
Apply the Phase 0 rules (no `h-screen`, use `100dvh`, `overflow-y-auto` on
anything that scrolls, 44px tap targets) to each as you go.

**Verify (Phase 7):** The `/help` icon/link is gone from the dashboard
topbar, sidebar, and mobile nav. Every primary dashboard screen (Home,
Calendar, Appointments, Add booking modal) is usable one-handed on a
375px-wide phone without horizontal scrolling or clipped content.

---

# PHASE 8 — Admin panel fixes

## 8.1 — Subscription Plans page: fix the overlapping/cluttered toggle row
`src/components/admin/subscription-plan-card.tsx`'s toggle row already uses
`flex flex-wrap items-center gap-x-5 gap-y-3`, which *should* wrap
correctly — if it still visually overlaps, the likely cause is the
absolutely-positioned "Disabled" badge (`absolute right-5 top-5`) colliding
with the card's icon row on narrow cards, or the toggle row simply being
too cramped next to the numeric input grid above it. Make the toggle
section unambiguously its own block with clear separation and a
label-above-switch stacked layout at narrow widths instead of the current
horizontal cluster:
```tsx
<div className={`mt-5 grid grid-cols-1 min-[480px]:grid-cols-3 gap-3 rounded-xl px-4 py-4 ${visual.isDark ? "bg-white/5" : "bg-[#faf6ef]"}`}>
  <div className="flex items-center justify-between min-[480px]:flex-col min-[480px]:items-start min-[480px]:gap-2">
    <ToggleSwitch label="Active" checked={fields.isActive} disabled={saving} dark={visual.isDark} onChange={(v) => update("isActive", v)} />
  </div>
  <div className="flex items-center justify-between min-[480px]:flex-col min-[480px]:items-start min-[480px]:gap-2">
    <ToggleSwitch label="Featured-eligible" checked={fields.isFeaturedEligible} disabled={saving} dark={visual.isDark} onChange={(v) => update("isFeaturedEligible", v)} />
  </div>
  <div className="flex items-center justify-between min-[480px]:flex-col min-[480px]:items-start min-[480px]:gap-2">
    <ToggleSwitch label="Priority-eligible" checked={fields.isPriorityEligible} disabled={saving} dark={visual.isDark} onChange={(v) => update("isPriorityEligible", v)} />
  </div>
</div>
```
Also move the "Disabled" ribbon so it can never collide with the icon
badge — clamp it inside the card's own padding box rather than
`absolute right-5 top-5` floating over content:
```tsx
{!fields.isActive && (
  <span className="absolute right-4 top-4 z-10 rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-current opacity-70">
    Disabled
  </span>
)}
```
(`z-10` plus a slightly tighter offset keeps it clear of the icon+title row
which starts at `mt-0` inside the same padded card — test at the card's
narrowest real width, `md:grid-cols-2` means ~340px per card on a
768px-wide tablet, which is the tightest this card ever gets.)

## 8.2 — Confirm all created salons show in admin, sorted by creation date
`src/app/admin/businesses/page.tsx` already does `orderBy: { createdAt:
"desc" }` — **this part is already correct**, no change needed for
sorting. The one real gap: it's capped at `take: 100` with no pagination,
so once you have more than 100 salons some will stop appearing. Add
pagination:
```ts
const PAGE_SIZE = 50;
const { q, page: pageParam } = await searchParams; // extend searchParams type to include page
const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
const [businesses, total] = await Promise.all([
  db.business.findMany({ where: /* unchanged */, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, select: { /* unchanged */ } }),
  db.business.count({ where: /* same where */ }),
]);
```
Add simple Prev/Next links at the bottom of the table using `?page=N`,
preserving the existing `?q=` search param.

## 8.3 — Advertisements & Boosts: audit every toggle
Open `src/components/admin/advertisement-card.tsx`,
`src/components/admin/cancel-boost-button.tsx`, and
`src/components/admin/manual-boost-form.tsx`. For each `ToggleSwitch` or
button that calls a mutation (`PATCH`/`POST`/`DELETE`), confirm:
1. It shows a loading state while the request is in flight (disable the
   control, don't let a double-click fire two requests).
2. It shows an error state on failure (don't silently no-op).
3. It optimistically updates or re-fetches after success (don't leave the
   UI showing the pre-toggle state after a successful save).
Apply the same "grid, not cramped flex row" fix from 8.1 to any other
admin card with 2+ toggles side by side (`grep -rn "ToggleSwitch" src/components/admin`
to find every usage and check each one individually).

## 8.4 — Businesses list sort (already fine per 8.2) + banner management
Add the promised admin control for the homepage banner ad from Phase 1.1.
**8.4.a** — Add `Business`-independent, single-row settings for the
banner. Check `prisma/schema.prisma` for a `PlatformSettings` model
(migration `20260923060624_add_platform_settings` in the zip strongly
suggests one already exists) — open it and, if it has a generic
`key`/`value` JSON shape, add a `homepageBannerUrl` field there instead of
a new table. If it's a fixed-shape singleton row, add a column:
```prisma
model PlatformSettings {
  // ...existing fields...
  homepageBannerImageUrl String?
  homepageBannerLinkHref String? @default("/for-business")
}
```
**8.4.b** — New admin page `src/app/admin/homepage/page.tsx` (or extend
wherever `PlatformSettings` is already edited, if it exists) with an image
upload (reuse the existing upload pattern from
`src/components/admin/business-images-manager.tsx` — same S3/local upload
helper, just a different target field) and a destination-link input.
**8.4.c** — Update `src/components/customer/home/ad-banner.tsx` (from
1.1.a) to accept `imageUrl`/`href` as props instead of hardcoded defaults,
and `src/app/page.tsx` to fetch `PlatformSettings` and pass them in:
```tsx
const settings = await db.platformSettings.findFirst();
<AdBanner imageUrl={settings?.homepageBannerImageUrl ?? "/banner.jpg"} href={settings?.homepageBannerLinkHref ?? "/for-business"} />
```

**Verify (Phase 8):** Subscription plan cards show three clearly separated,
non-overlapping toggles at every width from 340px to 1400px. Admin
businesses list shows a Prev/Next control once you pass 50 salons, still
sorted newest-first. Every advertisement/boost toggle shows a spinner
while saving and reflects the new state immediately after. Uploading a new
image in Admin → Homepage updates the live banner ad without a code
deploy.

---

# PHASE 9 — About page: "A product of ADNAVRA (Pvt) Ltd"

`src/app/about/page.tsx` — add a clear, dedicated attribution block (not
buried in the footer fine print — you asked for it "clearly displayed").
Place it near the top of the page, right under the hero/intro, as its own
small card:
```tsx
<div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-[#E5DDD0] bg-white px-5 py-3">
  <Image src="/logo.png" alt="ADNAVRA" width={28} height={28} className="h-7 w-7 rounded-md object-contain" />
  <p className="text-sm text-[#4A4640]">
    ADNAVRA BLISS is a product of <span className="font-semibold text-[#1F1E1D]">ADNAVRA (Pvt) Ltd</span>, Sri Lanka.
  </p>
</div>
```
Also update the footer copyright line for consistency (small change,
`src/components/marketing/site-footer.tsx`):
```tsx
<span>© {new Date().getFullYear()} ADNAVRA (Pvt) Ltd. All rights reserved. Colombo, Sri Lanka.</span>
```
(Confirm "ADNAVRA (Pvt) Ltd" is the exact legal name you want displayed —
swap the string if the registered name differs.)

**Verify (Phase 9):** `/about` clearly states the product is made by
ADNAVRA (Pvt) Ltd, visible without scrolling past the fold on both mobile
and desktop.

---

# PHASE 10 — Shared date-picker component (image 8 style), used everywhere

Image 8 shows a clean, centered "Select Date" modal — month/year dropdown
with prev/next arrows, a standard 7-column day grid, today's date
highlighted, a selected date circled, and Cancel/OK buttons at the bottom.
Today the codebase has **at least three different, inconsistent** date
pickers: `src/components/customer/search/date-time-picker.tsx` (custom
calendar + time-band picker for search), the booking wizard's date strip
(`getDateStrip`/`dayLabel` in `BookingWizard.tsx` — a horizontal scrolling
strip of 7 days, not a full calendar), and native `<input type="date">`
elsewhere (e.g. likely in `add-booking-modal.tsx` — check it). Per your
request, standardize on one shared, reusable calendar component styled
like image 8.

## 10.1 — Build the shared component
New file `src/components/shared/date-picker-modal.tsx`:
```tsx
"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function daysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function firstWeekday(year: number, month: number) { return new Date(year, month, 1).getDay(); } // 0=Sun

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["S","M","T","W","T","F","S"];

export function DatePickerModal({
  open, onClose, value, onSelect, minDate,
}: {
  open: boolean;
  onClose: () => void;
  value: Date | null;
  onSelect: (d: Date) => void;
  minDate?: Date;
}) {
  const [cursor, setCursor] = useState(() => value ?? new Date());
  const [pending, setPending] = useState<Date | null>(value);

  if (!open) return null;
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const totalDays = daysInMonth(year, month);
  const startOffset = firstWeekday(year, month);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const cells: (Date | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: totalDays }, (_, i) => new Date(year, month, i + 1))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8A8377]">Select date</p>
        <div className="mt-3 flex items-center justify-between">
          <select
            value={month}
            onChange={(e) => setCursor(new Date(year, Number(e.target.value), 1))}
            className="rounded-lg border border-[#E5DDD0] bg-white px-2 py-1.5 text-sm font-medium text-[#1F1E1D]"
          >
            {MONTHS.map((m, i) => <option key={m} value={i}>{m} {year}</option>)}
          </select>
          <div className="flex items-center gap-1">
            <button aria-label="Previous month" onClick={() => setCursor(new Date(year, month - 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F7F3ED]"><ChevronLeft className="h-4 w-4" /></button>
            <button aria-label="Next month" onClick={() => setCursor(new Date(year, month + 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F7F3ED]"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-y-2 text-center">
          {WEEKDAYS.map((w, i) => <span key={`${w}-${i}`} className="text-[11px] font-semibold text-[#9A9184]">{w}</span>)}
          {cells.map((d, i) => {
            if (!d) return <span key={`empty-${i}`} />;
            const disabled = minDate ? d < minDate : d < today;
            const isSelected = pending && d.toDateString() === pending.toDateString();
            const isToday = d.toDateString() === today.toDateString();
            return (
              <button
                key={d.toISOString()}
                type="button"
                disabled={disabled}
                onClick={() => setPending(d)}
                className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${
                  isSelected ? "bg-[#1F1B17] text-white font-semibold" : isToday ? "border border-[#9A7B4F] text-[#1F1E1D]" : "text-[#1F1E1D] hover:bg-[#F7F3ED]"
                } disabled:cursor-not-allowed disabled:text-[#D9CFBE] disabled:hover:bg-transparent`}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-[#795831]">Cancel</button>
          <button type="button" disabled={!pending} onClick={() => { if (pending) { onSelect(pending); onClose(); } }} className="text-sm font-semibold text-[#795831] disabled:opacity-40">OK</button>
        </div>
      </div>
    </div>
  );
}
```
This matches image 8's structure: month/year selector + arrow nav, day
grid with today outlined and selected day filled, Cancel/OK actions.

## 10.2 — Replace every ad-hoc date picker with it
- `src/components/customer/search/date-time-picker.tsx` — swap its custom
  inline calendar grid for `<DatePickerModal>`, keeping its separate
  morning/afternoon/evening band selector as a second, distinct control
  underneath (don't merge them — they're different concerns).
- `src/components/dashboard/add-booking-modal.tsx` — replace any native
  `<input type="date">` with `<DatePickerModal>` for visual consistency
  with the rest of the app (native date inputs render completely
  differently per-browser/OS, which is part of why things "don't look like
  they used to").
- Any admin form with a date field (`manual-boost-form.tsx`, if it has a
  boost expiry date) — same swap.
- The booking wizard's day-strip (`getDateStrip`) can **stay** as the
  primary quick-pick UI (it's a good, compact pattern for "next 7 days"),
  but add a small calendar icon button next to it that opens
  `<DatePickerModal>` for picking a date further out than 7 days — today
  there's a `dateOffset` state that pages the strip forward, which works
  but is slower than jumping straight to a date via a calendar.

**Verify (Phase 10):** Every date-selection surface in the app (customer
search, booking wizard's "pick a date further out" option, dashboard "Add
booking" modal, admin boost form) opens the same visually consistent
modal, styled like image 8, on both mobile and desktop.

## 10.3 — Trust bar: clean up for mobile
`src/components/customer/home/trust-stats-bar.tsx` already uses `grid
sm:grid-cols-3` (so it's already 1-column-stacked below `640px`, not
literally broken) — but audit it against the same "not cluttered" bar
image 8 implicitly sets as the target: icon consistently sized, text
never wrapping awkwardly. Tighten the mobile layout by giving each stat
row a bit more breathing room and stopping the icon column from shrinking:
```tsx
<Reveal as="div" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-5 sm:py-6 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3 reveal-stagger">
  {STATS.map((s) => (
    <div key={s.title} className="flex items-center gap-3 rounded-xl border border-[#E5DDD0]/60 bg-white/60 px-4 py-3 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7F3ED] text-[#795831]">
        <s.icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#1F1E1D] truncate">{/* unchanged title logic */}</p>
        <p className="text-xs text-[#8A8377] truncate">{s.desc}</p>
      </div>
    </div>
  ))}
</Reveal>
```
The added `border`/`bg-white/60` per-row card on mobile only (removed again
at `sm:`) gives each stat clear visual separation instead of three lines of
text running together, which is likely what read as "cluttered" on a phone
screen.

**Verify (10.3):** On a 375px screen, the trust bar shows three clearly
separated rows, each with an icon + two lines of text, no wrapping
collisions.

---

# PHASE 11 — Database migrations summary (run in this order)

```bash
# Phase 1's implementation guide already covers salonTypes if not yet applied:
npx prisma migrate dev --name add_salon_types_column          # (skip if already applied)

# Phase 4 — multi-service booking groups:
npx prisma migrate dev --name add_booking_group_and_pending_default

# Phase 5.3 — structured reviewer name for guest feedback:
npx prisma migrate dev --name add_review_reviewer_name

# Phase 8.4 — homepage banner settings (only if PlatformSettings needs new columns):
npx prisma migrate dev --name add_homepage_banner_settings
```
After each `migrate dev` locally, remember production uses
`npx prisma migrate deploy` (never `migrate dev` against prod — see the
existing `ADNAVRA_IMPLEMENTATION_GUIDE (1).md` Task 4.2 for the full
deploy procedure already documented for this project).

---

# PHASE 12 — Final QA checklist (run through this on a real phone, not just DevTools)

- [ ] Homepage loads with: banner ad → hero/search → trust bar (clean,
      non-overlapping on mobile) → Browse by category (8 cards, icons,
      captions) → Browse by salon type (NEW, 7 cards) → Featured salons
      (NEW) → Recommended → Near you → How it works → Owner CTA → footer.
      "New to Adnavra Bliss" rail is gone.
- [ ] `/near-you` genuinely requests device location and returns
      distance-sorted real salons, with a graceful fallback if denied.
- [ ] Mobile hamburger menu on both `HomeHeader` and `CustomerHeader` opens
      a full-width panel matching CarMarket.lk's mobile pattern (image 2),
      including the language switcher.
- [ ] EN/සිං toggle works instantly, persists on refresh, no broken layout
      in Sinhala.
- [ ] A guest (no account, no login) can book **multiple** treatments in
      one appointment, enters name + phone (required) + email (optional),
      and receives a "request sent" confirmation — the booking lands as
      **Pending** in the dashboard.
- [ ] Owner approves/declines from the dashboard in one tap per grouped
      appointment; customer gets an email (and, per 4.5.e's MVP path, staff
      get a one-tap WhatsApp deep link) reflecting the decision.
- [ ] No double booking: attempting to book an overlapping slot for the
      same staff member is rejected with a clear error, including when the
      new attempt is a multi-service group.
- [ ] Salon public page: team/reviews sections hidden when empty, feedback
      button works and new reviews appear, back button present, gallery
      shows 3 thumbnails on mobile / all on desktop, treatments capped at 4
      with a working "See all", opening hours editable from the dashboard
      and correctly reflected publicly.
- [ ] Onboarding: no dashboard sidebar/topbar visible during setup; step 2
      is the real 8 treatment categories (max 4); a new step 3 is the 7
      salon types (max 4); location step has both a "use my location"
      button and the existing draggable pin; after finishing, the salon
      correctly appears when filtering the homepage by whatever it picked.
- [ ] Dashboard: no "Help" button anywhere in the topbar/sidebar/mobile
      nav; Home/Calendar/Appointments/Add-booking-modal are all usable on
      a 375px phone without clipped or fixed-position content.
- [ ] Admin: subscription plan toggles are visually separated at every
      width; businesses list shows every salon, newest first, paginated
      past 50; advertisement/boost toggles show loading/error states and
      reflect changes immediately; homepage banner is editable from admin
      and updates the live site.
- [ ] `/about` clearly states "A product of ADNAVRA (Pvt) Ltd".
- [ ] Every date-picker in the app (customer search, booking wizard,
      dashboard add-booking modal, admin boost form) opens the same
      image-8-style modal.

---

*End of task list. If your coding agent gets stuck on any single task,
have it re-read that task's "root cause" explanation first — every task in
this document was written after reading the actual file, not guessed, so
the described current behavior should match what the agent finds when it
opens the file.*
