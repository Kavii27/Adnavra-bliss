# ADNAVRA — Customer Marketplace, Navigation & Booking Flow Implementation Plan

This file is written for an AI coding agent (Claude Code, Cursor, etc.) working directly inside the
`adnavra-platform-dev` repository. It is a follow-up to `ADNAVRA_UI_UX_IMPLEMENTATION_PLAN.md` (already
mostly executed) and only covers the gaps described below. Follow tasks in order. Each task names exact
files. Do not skip tasks. Do not invent tasks outside this list.

## 0. What this plan fixes

Reference screenshots (Fresha) supplied by the founder, mapped to what we are building:

| # | Screenshot shows | We are building |
|---|---|---|
| 1 | Business-site header, "Marketplace / Sign up / Menu" button opened, showing "For businesses" links + a "For customers →" row | A `Menu` dropdown on the ADNAVRA **business marketing header** with the same structure, minus "Download the app" |
| 2 | Customer homepage: hero search bar, Recommended/New/Trending rails, app section, reviews, stats, "for business" cross-promo, footer | Full rebuild of `/customer` |
| 3 | "All treatments" dropdown with category list | `TreatmentsDropdown` component |
| 4 | Location field autocomplete | `LocationAutocomplete` component |
| 5 | "Any time" date/time picker with calendar | `DateTimePicker` component |
| 6 | Search results: list + map, day pills, filters | Polish of existing `/customer/search` |
| 7 | Business public profile with services, team, reviews, about, hours | Polish of existing `/[businessSlug]` |
| 8, 9, 10 | Multi-step booking modal: Services → Professional → Time → Confirm | Rebuild of `/[businessSlug]/book` as a step wizard |
| 11 | Customer account area: Profile / Activity / Forms / Settings | New `/customer/account/*` section |

**Current root cause of the "messy login/signup" feeling:** there are two separate, correctly-separated
auth systems (business owner/staff at `/login` + `/signup`, customer at `/customer/login` +
`/customer/signup`, both backed by the same `User` table via `role`). The mess is that **nothing in the
UI cross-links them**, so a visitor lands on one side and has no way to discover the other, and after
booking a customer has nowhere to go back to ("Activity" page did not exist). This plan does not merge
the two auth systems (that would be a regression — a salon owner account must never be offered a customer
signup form and vice versa). It fixes the **navigation and account surface** around them instead.

**Decision (do not re-litigate this while implementing):** `/` stays the business marketing/SaaS pitch
(matches the PDF proposal, this is what founders will link from ads). `/customer` stays the Fresha-style
consumer marketplace. The two are cross-linked via the new `Menu` dropdown described in Phase 2.

**Double-booking guarantee (already correct, do not break it):** the QR code (`src/lib/qr.ts`,
`publicBusinessUrl`) encodes `/{slug}`, which is the same public profile page a marketplace search result
links to. Both paths lead to the same `/{slug}/book` flow, which calls the same `POST /api/bookings`,
which is protected by the Postgres `EXCLUDE` constraints in the migration plus the app-level overlap
check. **Never create a second booking table, a second booking endpoint, or a QR-only booking code path.**
Every task below that touches booking must keep using `POST /api/bookings` (extended, never duplicated).

---

## PHASE 1 — Data model additions (additive only)

Follow the existing rule from the UI/UX plan: never touch business logic. These are strictly additive
Prisma fields/models, all optional, all backward compatible.

### Task 1.1 — Link `Customer` records to a logged-in `User`

Today `Customer` is a business-scoped guest record (name/phone/email typed fresh at every booking). To
power the customer "Activity" tab (a logged-in customer's bookings across every salon they have used) we
need to tie repeat bookings from the same account together.

**File: `prisma/schema.prisma`** — add to `model Customer`:

```prisma
model Customer {
  id         String   @id @default(cuid())
  businessId String
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  // NEW — optional link to the logged-in customer account that made this booking.
  // Null for guest/phone bookings taken by staff. Never required.
  userId String?
  user   User?   @relation("CustomerAccountLink", fields: [userId], references: [id], onDelete: SetNull)

  name  String
  email String?
  phone String?
  notes String? @db.Text

  bookings Booking[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([businessId])
  @@index([email])
  @@index([userId])
  @@map("customers")
}
```

**File: `prisma/schema.prisma`** — add the reverse relation to `model User`:

```prisma
model User {
  // ...existing fields unchanged...
  customerProfiles Customer[] @relation("CustomerAccountLink")
  // ...
}
```

Run:

```bash
npx prisma migrate dev --name link_customer_to_user
```

### Task 1.2 — Service category taxonomy (for the treatments dropdown and filtering)

**File: `prisma/schema.prisma`** — add one optional field to `model Service`:

```prisma
model Service {
  // ...existing fields unchanged...
  category String? // one of the CATEGORY_SLUGS values in src/lib/categories.ts, nullable for legacy rows
}
```

**File: `src/lib/categories.ts` (new)**

```ts
import { Scissors, Sparkles, HandMetal, Eraser, Eye, Smile, Waves, Flower2 } from "lucide-react";

export const SERVICE_CATEGORIES = [
  { slug: "hair-styling", label: "Hair & styling", icon: Scissors },
  { slug: "nails", label: "Nails", icon: HandMetal },
  { slug: "hair-removal", label: "Hair removal", icon: Eraser },
  { slug: "eyebrows-eyelashes", label: "Eyebrows & eyelashes", icon: Eye },
  { slug: "facials-skincare", label: "Facials & skincare", icon: Smile },
  { slug: "massage", label: "Massage", icon: Waves },
  { slug: "spa-wellness", label: "Spa & wellness", icon: Flower2 },
  { slug: "makeup", label: "Makeup", icon: Sparkles },
] as const;

export type ServiceCategorySlug = (typeof SERVICE_CATEGORIES)[number]["slug"];
```

Run `npx prisma migrate dev --name service_category`.

**File: `src/schemas/service.ts`** — add `category: z.string().optional().nullable()` to both
`createServiceSchema` and `updateServiceSchema`. Do not remove or rename any existing field.

**File: `src/app/dashboard/services/page.tsx`** — add a category `<select>` (options from
`SERVICE_CATEGORIES`) to the existing create/edit service form, sent as `category` in the existing POST/PUT
calls. This is additive UI on an existing form, not a rewrite.

### Task 1.3 — Do not fabricate metrics or reviews

There is no `Review` model in this schema yet. The reference screenshots show "4.9 stars, 2,391 reviews"
and "1 billion+ appointments" — those are Fresha's real numbers for Fresha, not ADNAVRA's. When building
the sections below:

- Never hardcode a fake review count, star rating, or "N appointments booked today" counter for ADNAVRA
  or for any real salon in this codebase.
- Where the design calls for a stat, either compute it live from the database (e.g. `db.business.count()`
  for "X salons on ADNAVRA") or write honest, non-numeric aspirational copy ("Built for salons across Sri
  Lanka"), matching the tone rules already in Section 10 of the UI/UX plan (no AI-slop, no invented
  claims).
- The Reviews section on the business profile page and the "Reviews" rail on the customer homepage must
  render nothing (or an honest "No reviews yet" state) until a real `Review` model exists. Do not invent
  reviewer names or quotes. Add "Customer reviews" as a call-out in Section 15 of the UI/UX plan's roadmap
  list (it is already there) rather than faking it here.

---

## PHASE 2 — Navigation: the `Menu` dropdown cross-link (screenshot 1)

### Task 2.1 — Build a shared dropdown component

**File: `src/components/marketing/menu-dropdown.tsx` (new)**

A single reusable client component, parameterized by which side of the product it is rendered on, so both
headers share one implementation instead of drifting apart.

```tsx
"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Menu as MenuIcon, X, Globe, ArrowRight } from "lucide-react";

type Audience = "business" | "customer";

const BUSINESS_LINKS = [
  { href: "/login", label: "Log in or sign up" },
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/help", label: "Help and support" },
];

const CUSTOMER_LINKS = [
  { href: "/customer/login", label: "Log in or sign up" },
  { href: "/customer", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/help", label: "Help and support" },
];

export function MenuDropdown({ audience }: { audience: Audience }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const links = audience === "business" ? BUSINESS_LINKS : CUSTOMER_LINKS;
  const sectionLabel = audience === "business" ? "For businesses" : "For customers";
  const crossHref = audience === "business" ? "/customer" : "/for-business";
  const crossLabel = audience === "business" ? "For customers" : "For businesses";

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 h-10 rounded-full border border-[#E3E8F0] px-4 text-sm font-medium text-[#101828] hover:bg-[#EFF4FA]"
        aria-expanded={open}
      >
        {open ? <X className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
        Menu
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-[#E3E8F0] bg-white shadow-[0_8px_30px_rgba(16,24,40,0.12)] p-2 z-50">
          <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-[#8A94A6]">
            {sectionLabel}
          </p>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm ${
                l.label === "Log in or sign up" ? "font-semibold text-[#26418F]" : "text-[#101828] hover:bg-[#EFF4FA]"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-[#475467]">
            <Globe className="h-4 w-4" /> English (GB)
          </div>
          <div className="mt-1 border-t border-[#EEF2F7] pt-1">
            <Link
              href={crossHref}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold text-[#101828] hover:bg-[#EFF4FA]"
            >
              {crossLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
```

Notes matching the screenshot and the founder's explicit instruction:
- No "Download the app" row (the founder said this is not needed yet; it is already listed correctly as
  a future roadmap item, do not add a link that goes nowhere).
- "English (GB)" is a static, non-interactive label for now (no i18n system exists). Do not wire it to
  anything or claim other languages work.
- `/blog` and `/help` do not exist yet. Create two trivial static pages so the links are never dead:
  - `src/app/blog/page.tsx` — heading "Blog", one paragraph: "We are working on our first posts. Check
    back soon." Reuse `SiteHeader` + `SiteFooter`.
  - `src/app/help/page.tsx` — heading "Help and support", a short FAQ list (3–4 Q&A about booking,
    cancellation policy, contacting a salon directly) plus a mailto link. Reuse `SiteHeader` + `SiteFooter`.

### Task 2.2 — Wire it into the business header

**File: `src/components/marketing/site-header.tsx`** — replace the desktop-right block:

```tsx
<div className="hidden md:flex items-center gap-3">
  <Link href="/customer" className="text-sm font-medium text-[#101828] hover:underline">
    Marketplace
  </Link>
  <Link href="/signup">
    <Button>Sign up</Button>
  </Link>
  <MenuDropdown audience="business" />
</div>
```

Remove the old plain "Log in" link and the plain hamburger `<button>` — "Log in" now lives inside the
`Menu` dropdown as "Log in or sign up", exactly like screenshot 1. Keep the existing mobile `open` drawer
behaviour, but change its bottom links block to match (Log in or sign up / Marketplace / For customers
link), so mobile and desktop stay consistent. Import `MenuDropdown` from `./menu-dropdown`.

### Task 2.3 — Give the customer site the same header pattern

**File: `src/components/customer/customer-header.tsx` (new)** — extract the inline `<header>` currently
duplicated across `src/app/customer/page.tsx` and `src/app/customer/search/page.tsx` into one component,
so Phase 3+ only edits it once:

```tsx
"use client";
import Link from "next/link";
import { MenuDropdown } from "@/components/marketing/menu-dropdown";

export function CustomerHeader() {
  return (
    <header className="h-16 border-b border-[#E3E8F0] bg-white flex items-center justify-between px-6 lg:px-12">
      <Link href="/customer" className="text-lg font-semibold tracking-tight text-[#101828]">
        ADNAVRA
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/customer/login" className="hidden sm:inline text-sm font-medium text-[#101828] hover:underline">
          Log in
        </Link>
        <Link href="/for-business" className="hidden sm:inline text-sm font-medium text-[#101828] hover:underline">
          For business
        </Link>
        <MenuDropdown audience="customer" />
      </div>
    </header>
  );
}
```

Update `src/app/customer/page.tsx` and `src/app/customer/search/page.tsx` to import and render
`<CustomerHeader />` instead of their inline `<header>` block. (Task 3.x below replaces the rest of
`customer/page.tsx`, so do this extraction first.)

---

## PHASE 3 — Customer homepage rebuild (screenshot 2)

### Task 3.1 — Rewrite `src/app/customer/page.tsx`

Section order (top to bottom), each as its own component under `src/components/customer/home/`:

1. `<CustomerHeader />` (Task 2.3).
2. **Hero** — headline "Book local selfcare services", subheading, and `<SearchBar />` (Phase 4). Keep the
   existing soft gradient background. Remove the "Get the app" pill for now (no app exists yet) or keep it
   but link it to `/help` with copy "Mobile app coming soon" rather than a fake store link — founder
   preference, default to removing it since it currently points nowhere.
3. **`<VenueRail title="Recommended" businesses={...} />`** — fetch the first N businesses (e.g.
   `db.business.findMany({ take: 8, orderBy: { createdAt: "asc" }, include: { services: true } })`) server
   side in the page component (this is a Server Component; only `<SearchBar />` and rail card favorite
   buttons need `"use client"`). Do not label these "Best in Class" or attach a star rating (Task 1.3) —
   use a plain category tag pulled from the business's most common `Service.category`, or omit the badge
   entirely if there is no data.
4. **`<VenueRail title="New to ADNAVRA" businesses={...} />`** — `orderBy: { createdAt: "desc" }, take: 8`.
5. Skip a fabricated "Trending" rail (no booking-volume analytics exist yet to make this real) — replace it
   with **`<VenueRail title="Near you" businesses={...} />`** once `Task 4.2`'s location value is present
   (client-side re-fetch using `/api/marketplace/search`), otherwise fall back to the same "New" data with
   a different `take` offset so the rail is not literally identical content.
6. **For business cross-promo** — reuses the same visual pattern as the reference "Fresha for business"
   block, but honest copy: heading "ADNAVRA for business", one paragraph pulled from the PDF proposal's
   Executive Summary tone, button "Find out more" → `/for-business`. No fake "Excellent 5/5, 1250 reviews
   on Capterra" line — omit it.
7. **Browse by city** — static list driven by `SRI_LANKA_LOCATIONS` (Task 4.2) grouped by district, links
   to `/customer/search?location=<city>`.
8. `<SiteFooter />` reused from `src/components/marketing/site-footer.tsx` (already exists) — pass a prop
   or duplicate lightly styled version if it currently hardcodes business-only links; if so, add a
   `variant="customer"` prop that swaps "For business" / "For partners" copy but keeps the same layout, so
   there is only one footer component to maintain.

`VenueRail` card content per business: logo/photo placeholder, name, address/city, service category tag
if available. Do not render a star rating or review count (Task 1.3) until reviews exist.

### Task 3.2 — Reusable venue card

**File: `src/components/customer/home/venue-card.tsx` (new)** — props: `{ id, name, slug, logoUrl,
address, city, category? }`. Renders as a `<Link href={`/${slug}`}>` card with a heart/favorite icon
button (visual only for now; wiring favorites to the database is future roadmap, keep the button inert
with an `aria-label="Save"` and a no-op `onClick` that does not throw, do not fake a saved state).

---

## PHASE 4 — Smart search bar (screenshots 3, 4, 5)

### Task 4.1 — `TreatmentsDropdown` (screenshot 3)

**File: `src/components/customer/search/treatments-dropdown.tsx` (new)**

- Trigger: the "All treatments" input segment of the search bar.
- Panel: tab row `All | Treatments | Venues | Professionals` (visual tabs; only `Treatments` needs real
  data right now — `Venues`/`Professionals` tabs can filter the same `SERVICE_CATEGORIES` list plus a
  business-name search once `Task 4.4` wires live query, keep them functional stubs that at minimum do not
  error).
- Below the tabs: "Treatments" heading, then a list built from `SERVICE_CATEGORIES` (Task 1.2), each row
  with the lucide icon in a rounded soft-indigo circle, exactly like screenshot 3.
- Selecting a row sets the input's display text to the category label and closes the dropdown, and stores
  `categorySlug` in the parent `<SearchBar />` state (Task 4.5) to be sent as `?category=` on submit.
- "All treatments" row clears the category filter.

### Task 4.2 — `LocationAutocomplete` (screenshot 4)

Since there is no geocoding API key configured yet (`ResultsMap`/`marketplace/search` already default to
Colombo, see `src/app/customer/search/page.tsx`), do this with a **static Sri Lanka locations list** first,
which is honest (no third-party dependency, no fabricated "current GPS location" claim) and upgradeable
later.

**File: `src/lib/sri-lanka-locations.ts` (new)** — a plain array of ~60–100 real Sri Lankan towns/cities
with approximate lat/lng and district, e.g.:

```ts
export type SriLankaLocation = { name: string; district: string; lat: number; lng: number };

export const SRI_LANKA_LOCATIONS: SriLankaLocation[] = [
  { name: "Colombo", district: "Colombo", lat: 6.9271, lng: 79.8612 },
  { name: "Negombo", district: "Gampaha", lat: 7.2083, lng: 79.8358 },
  { name: "Minuwangoda", district: "Gampaha", lat: 7.1697, lng: 79.9553 },
  { name: "Kandy", district: "Kandy", lat: 7.2906, lng: 80.6337 },
  { name: "Galle", district: "Galle", lat: 6.0535, lng: 80.221 },
  // ...continue with the rest of the 25 districts' main towns. Use real, verifiable town names and
  // coordinates only — do not invent place names.
];
```

**File: `src/components/customer/search/location-autocomplete.tsx` (new)**

- Debounced (150–200ms) case-insensitive substring match against `SRI_LANKA_LOCATIONS` by `name` (and
  `district` as a secondary match), capped to 6 results, each row rendered with a `MapPin` icon exactly
  like screenshot 4.
- "Current location" as the default placeholder; if the user grants `navigator.geolocation`, reverse-map
  to the nearest entry in `SRI_LANKA_LOCATIONS` by haversine distance instead of showing a dropdown (do
  not call any paid geocoding API — keep this fully client-side and free, matching the "no hidden costs"
  promise in the SaaS proposal).
- Selecting a row stores `{ lat, lng, label }` in the parent state and is what
  `src/app/customer/search/page.tsx` should use to replace its hardcoded Colombo `center` constant (Task
  4.4).

### Task 4.3 — `DateTimePicker` (screenshot 5)

**File: `src/components/customer/search/date-time-picker.tsx` (new)**

- Left column: "Today" and "Tomorrow" quick-pick cards showing the actual current date (use `new Date()`,
  never a hardcoded date).
- Right: a real month calendar (build with plain date-fns-free arithmetic, no new dependency needed) with
  prev/next month arrows, current month highlighted, past days disabled/greyed exactly like screenshot 5.
- Bottom row: "Any time / Morning (9am–12pm) / Afternoon (12pm–6pm) / Evening (6pm–12am) / Custom" pill
  buttons. "Custom" reveals a simple `<input type="time">` pair (from–to).
- Selecting a date and a time band stores `{ date: "YYYY-MM-DD", band: "any"|"morning"|"afternoon"|
  "evening"|"custom", from?, to? }` in parent state; this maps to the existing `date` param already
  consumed by `src/components/booking/SlotPicker.tsx`'s availability fetch, and to a new optional
  `timeBand` query param on `/api/marketplace/search` (Task 4.6) used only to sort/label results, not to
  hard-filter salons that have no bookable slot data cached (avoid returning zero results due to a filter
  we cannot actually verify without hitting `/api/availability` per business, which is a Phase 5 nice-to-
  have, not required for this plan).

### Task 4.4 — Assemble `<SearchBar />` and reuse it in two places

**File: `src/components/customer/search/search-bar.tsx` (new)** — a client component composing the three
dropdowns above into the pill-shaped bar seen in screenshots 2 and 6 (`rounded-full` on the homepage,
`rounded-lg` / inline in the results page top bar — accept a `variant: "hero" | "compact"` prop). On
submit, it navigates to:

```
/customer/search?q=<treatment-or-category>&location=<lat>,<lng>&locationLabel=<label>&date=<YYYY-MM-DD>&timeBand=<band>
```

Replace:
- The inline `<form>` in `src/app/customer/page.tsx` (Task 3.1) with `<SearchBar variant="hero" />`.
- The static header search bar visible at the top of `src/app/customer/search/page.tsx` (screenshot 6 top
  bar) with `<SearchBar variant="compact" />`, pre-filled from the current `useSearchParams()`.

### Task 4.5 — Wire the location param into the results page

**File: `src/app/customer/search/page.tsx`** — replace the hardcoded

```ts
const center: [number, number] = [6.9271, 79.8612];
```

with parsing `params.get("location")` as `"lat,lng"` when present, falling back to the Colombo default
only when absent. Also forward `params.get("q")` (already done) — additionally forward a new `category`
param the same way, appended to the existing `qs` `URLSearchParams` block, so `TreatmentsDropdown`
selections actually filter results.

### Task 4.6 — ADDITIVE: category filter on marketplace search

**File: `src/app/api/marketplace/search/route.ts`** — add an optional `category` query param that, when
present, adds `services: { some: { category, isActive: true } }` to the existing Prisma `where` clause.
This is additive: omitting the param must behave exactly as it does today. Do not remove or rename any
existing accepted param (`lat`, `lng`, `radiusKm`, `q`).

---

## PHASE 5 — Search results page polish (screenshot 6)

`src/app/customer/search/page.tsx` is already close (list + map, radius selector). Bring it the rest of
the way:

### Task 5.1 — Day-pill row and Venues/Professionals toggle

Add, directly under the header/search bar and above the results count:

- A horizontal scrollable pill row: `Any day | Today | <next 12 dates>`, generated from `new Date()`
  forward (never hardcoded), each pill setting a `date` query param that re-runs the existing
  `/api/marketplace/search` fetch (only affects display grouping for now — do not attempt real per-salon
  slot availability search yet, that is Phase 8/roadmap scope).
- A segmented control `Venues | Professionals` above the list. "Professionals" can be a disabled/greyed
  tab with a small "Coming soon" tooltip if there is no professional-level search API yet — do not fake
  results for it.
- Replace the existing `<select>` radius control with the same visual pattern as screenshot 6's "Filters"
  button + "Hide map" button (two `secondary` `<Button>`s); keep the radius `<select>` inside a small
  "Filters" popover instead of inline, and make "Hide map" collapse the `<ResultsMap />` column to full
  width for the list (simple `useState` toggle, `grid-cols-[1fr]` vs `grid-cols-[420px_1fr]`).

### Task 5.2 — Result card polish

Update the existing card markup in the same file to add: a photo (use `business.logoUrl` if present,
otherwise a neutral placeholder block, never a stock photo claiming to be the real salon), a heart/save
icon (same inert pattern as Task 3.2), and — only if `Task 1.3`'s constraint is respected — omit any star
rating until reviews exist.

---

## PHASE 6 — Business profile page polish (screenshot 7)

`src/app/[businessSlug]/page.tsx` already renders header, services list, opening hours, footer. Add:

### Task 6.1 — Team section

Fetch `staffMembers: { where: { isActive: true } }` alongside the existing `services` include, and render
a "Team" section (avatar circle with initials if no photo, name, role — reuse `StaffMember.name`; there is
no `title`/role-label field today, so either add one as an additive optional `title String?` column on
`StaffMember`, defaulting to "Team member" when null, or simply omit a role subtitle — do not invent a
title like "Senior Director" for a real person's data).

### Task 6.2 — About section

Render `business.description` (already fetched) as an "About" section with a heading, if present; if
absent, omit the section entirely (do not insert placeholder lorem-ipsum copy).

### Task 6.3 — Additional information

Render a small icon list only for fields that are actually true/present (e.g. `business.website` present
→ "Website" row; do not render "Pet-friendly", "Adults only", etc. unless/until those become real boolean
columns on `Business`; adding them as additive nullable booleans is fine if the founder wants this later,
but do not fabricate them now).

### Task 6.4 — Nearby venues

Reuse `VenueRail`/`venue-card.tsx` from Task 3.2, querying `/api/marketplace/search` with the business's
own `latitude`/`longitude` and a small radius, excluding the current business by id.

---

## PHASE 7 — Booking flow rewrite as a step wizard (screenshots 8, 9, 10)

This is the highest-risk phase. Read carefully before writing code.

### Task 7.1 — Require a logged-in customer before booking

Today `SlotPicker` asks for name/phone/email as free text on every booking, with no account link — this is
why the flow feels disconnected from "your dashboard" in screenshot 11. Change this:

**File: `src/app/[businessSlug]/book/page.tsx`** — make it a server component that calls `auth()` first:

```tsx
const session = await auth();
if (!session?.user || (session.user as unknown as { role: string }).role !== "CUSTOMER") {
  redirect(`/customer/login?callbackUrl=${encodeURIComponent(`/${businessSlug}/book${serviceId ? `?serviceId=${serviceId}` : ""}`)}`);
}
```

If the visitor is a business OWNER/STAFF/ADMIN, also redirect to `/customer/login` with the same
`callbackUrl` — an owner account should still create a real customer account to book for themselves,
exactly like screenshot 11's `H.A. Ashiru Dilmin De Silva` customer identity, never silently reuse their
staff session as a customer.

If not logged in, this is also the natural place for the "Select an option" step from the screenshots
(`Book an appointment` vs any future option). Since there is currently only one booking type, skip
rendering a real chooser screen and go straight to `Services`, but keep the breadcrumb labelled
`Services · Professional · Time · Confirm` (screenshots 9/10) so a second option (e.g. "Book for someone
else") can be added later without restructuring.

### Task 7.2 — Step wizard shell

**File: `src/components/booking/BookingWizard.tsx` (new, replaces `SlotPicker.tsx` as the page's main
component; delete `SlotPicker.tsx` once nothing imports it)**

State machine, four steps exactly matching the breadcrumbs in screenshots 8–10:

```ts
type Step = "services" | "professional" | "time" | "confirm";
```

Shared right-hand summary panel (screenshots 8–10 right column: business logo/name/rating placeholder
removed per Task 1.3, address, selected service line, total) rendered alongside every step, updating live
as selections are made. Top bar: `X` close button → back to `/${businessSlug}`, back arrow → previous
step or exit on the first step, breadcrumb row `Services > Professional > Time > Confirm` with the current
step bolded and completed steps clickable to jump back.

### Task 7.3 — Step 1: Services (screenshot 8)

- Fetch business services the same way `SlotPicker` already does (`/api/businesses/by-slug/[slug]` then
  `/api/services?businessId=...`).
- Group by `category` (Task 1.2) into named sections exactly like screenshot 8 ("Featured" first if any
  service has no category or is flagged featured, then one section per category present in the data —
  do not render empty category sections).
- Each row: name, duration, "Female only"/"Male only" badge only if such a field exists (it does not yet
  — omit the badge entirely rather than inventing gender restrictions that are not in the data), price,
  a `+` button that adds it to a local `selectedServices` array (support **multiple** services in one
  booking cart, since screenshot 8 shows a running "Total" — this is new: today's schema/API only support
  one `serviceId` per booking).
- **Because `Booking.serviceId` is a single required field**, model "multiple services in the cart" as
  **multiple sequential bookings created in one submit**, all sharing the same `startTime` chain (service
  2 starts when service 1 ends, etc.) inside one `$transaction`, OR — the simpler and safer option for
  this pass — **cap Step 1 to a single selected service for now** (radio-style selection instead of a
  cart) and leave multi-service carts as a clearly labelled follow-up task, since building a correct
  multi-service, multi-duration, overlap-safe transaction is substantial new booking logic and the ground
  rule is "never touch business logic" casually. **Default to the single-service version for this plan.**
  Note this explicitly in the wizard's Step 1 UI is not necessary; just do not render a "+" that implies a
  cart if only one selection is allowed — use the existing radio/select pattern already in `SlotPicker`,
  restyled to the grouped-list look of screenshot 8.

### Task 7.4 — Step 2: Professional (new step, not present in the old flow)

- Fetch `/api/staff` scoped to the business (reuse the existing dashboard staff API, add a small
  ADDITIVE public read path: `GET /api/staff?businessId=...&public=true` returning only `{ id, name }` for
  `isActive` staff, no email/phone — check `src/app/api/staff/route.ts`'s current auth guard and add a
  branch that allows unauthenticated `public=true` requests to return this minimal shape only. Do not
  loosen the existing authenticated branch's fields or permissions.)
- Render "Any professional" as the first, pre-selected option, then one row per staff member, matching
  screenshot 9's `Any professional ⌄` dropdown pattern (a simple `<select>` is acceptable; a custom
  dropdown matching the visual is nicer but not required).
- Selection maps directly to the existing `staffMemberId` field already accepted by
  `createBookingSchema` — no schema change needed here.

### Task 7.5 — Step 3: Time (screenshot 9)

- Reuse the existing date-strip + slot-grid logic from `SlotPicker` (`/api/availability`), restyled to
  match screenshot 9's horizontal date strip (7 visible days, arrows to page) and time-slot list.
- Pass the chosen `staffMemberId` from Step 2 into the `/api/availability` call if that endpoint does not
  already accept it — check `src/app/api/availability/route.ts`; if it ignores staff-specific schedules
  today, that is an existing gap outside this plan's scope, leave a `// TODO: filter by staffMemberId once
  per-staff schedules exist` comment rather than inventing fake per-staff availability.

### Task 7.6 — Step 4: Confirm (screenshot 10)

- Show: cancellation policy (static text, editable per business later — for now a fixed sentence like the
  screenshot, "Please cancel at least 24 hours before your appointment", stored as a constant, not
  per-business yet), an "Important information" block only if `business.description`-adjacent field exists
  for it (otherwise omit, do not invent salon policy text attributed to a real business), a "Comments or
  requests" free-text `<textarea>` mapping to the existing `notes` field already accepted by
  `createBookingSchema`, and the summary panel with date/time/service/total.
- On confirm, `POST /api/bookings` — but since the customer is now authenticated (Task 7.1), stop asking
  for name/phone/email as free text. Instead:
  - **File: `src/schemas/booking.ts`** — widen `createBookingSchema` additively: make `customerName` and
    `customerPhone` optional instead of required, and it is fine because the API route will now backfill
    them from the session when present (next bullet). Do not remove the fields (guest/staff-entered
    bookings from the dashboard's "new booking" form, if any, may still rely on them).
  - **File: `src/app/api/bookings/route.ts`** — in the `POST` handler, after parsing the body, call
    `const session = await auth();` and, if `session?.user?.role === "CUSTOMER"`, use
    `session.user.name`/`session.user.email` as fallbacks for missing `customerName`/`customerEmail`, and
    require `customerPhone` to come from the user's profile (Task 8.1 adds a `phone` field to `User`) or
    the request body if still missing. When creating/finding the `Customer` record inside the existing
    `$transaction`, also match on `userId: session.user.id` first (before falling back to the existing
    email/phone matching), and set `userId` on both create and the update branch, so this booking is now
    linked to the customer's account for Task 8.2's Activity page. This is additive: unauthenticated
    (guest) bookings keep working exactly as they do today, just without a `userId` on the `Customer` row.

### Task 7.7 — Success state

After a successful `POST`, replace the wizard content with a confirmation screen (breadcrumb collapses),
then auto-offer a link "View in your activity" → `/customer/account/activity` (Task 8.2), matching the
"appointment confirmed" step the founder described and the "Upcoming" card seen in screenshot 11.

---

## PHASE 8 — Customer account area (screenshot 11)

The founder asked specifically for **Profile, Activity, Forms, Settings**. Screenshot 11 additionally
shows Wallet/Messages/Favourites in the sidebar — do not build those now (there is no payments, messaging,
or favourites backend). List them as disabled/greyed rows with a small "Coming soon" label so the sidebar
visually matches the reference without shipping fake functionality, or omit them entirely and only ship
the four requested tabs — **default to omitting them** to keep the surface honest and small; only add the
greyed rows if the founder later asks for the exact visual parity.

### Task 8.1 — Add a `phone` field to `User` (additive)

**File: `prisma/schema.prisma`** — add `phone String?` to `model User`. Run
`npx prisma migrate dev --name user_phone`.
**File: `src/schemas/user.ts`** — the signup route already accepts `phone` in the body but discards it
(`void phone;` in `src/app/api/auth/signup/route.ts`) — change that line to persist it:
`data: { email, password: hashed, name, role, businessId, phone: phone ?? null }` in the `tx.user.create`
call, and remove the `void phone;` no-op.

### Task 8.2 — Route structure

```
src/app/customer/account/layout.tsx      // sidebar + auth guard, mirrors dashboard/layout.tsx pattern
src/app/customer/account/page.tsx        // redirect to /customer/account/activity
src/app/customer/account/profile/page.tsx
src/app/customer/account/activity/page.tsx
src/app/customer/account/forms/page.tsx
src/app/customer/account/settings/page.tsx
```

**File: `src/app/customer/account/layout.tsx`** — same guard pattern as
`src/app/dashboard/layout.tsx`: `await auth()`, redirect to `/customer/login?callbackUrl=/customer/account`
if absent, redirect to `/` (or show an access-denied panel) if `role !== "CUSTOMER"`. Sidebar links:
Profile, Activity, Forms, Settings (icons: `User`, `CalendarCheck`, `ClipboardList`, `Settings` from
`lucide-react`), styled as a left rail like screenshot 11, with the customer's name at the top and a
"Sign out" action reusing the existing `signOut` server action pattern from
`src/app/dashboard/layout.tsx`.

### Task 8.3 — Activity page

**File: `src/app/customer/account/activity/page.tsx`** — Server Component. Query:

```ts
const bookings = await db.booking.findMany({
  where: { customer: { userId: session.user.id } },
  orderBy: { startTime: "desc" },
  include: { service: true, business: true, staffMember: true },
});
const now = new Date();
const upcoming = bookings.filter((b) => b.startTime >= now && b.status !== "CANCELLED");
const past = bookings.filter((b) => b.startTime < now || b.status === "CANCELLED");
```

Render an "Upcoming" list (screenshot 11's left list of appointment cards) and a "Past" list below it,
each card linking to a detail panel/page showing the same fields as screenshot 11's right panel: business
name/logo, status badge, date/time, "Add to calendar" (generate a `.ics` file client-side — small, no new
dependency needed), "Get directions" (existing `openstreetmap.org` link pattern already used on the
business profile page), "View venue" (`/${business.slug}`). Do not add "Send message" (no messaging
system exists) — omit that row rather than linking it to nothing.

### Task 8.4 — Profile page

**File: `src/app/customer/account/profile/page.tsx`** — a form (client component) to edit `name`, `phone`
(new field from Task 8.1), and optionally a profile photo URL if `User.image` is already a column (it is,
per `prisma/schema.prisma`). Submits to an ADDITIVE new route:

**File: `src/app/api/customers/me/route.ts` (new)** — `PATCH` handler: `auth()` guard requiring
`role === "CUSTOMER"`, validates a small Zod schema (`name`, `phone`, `image` all optional), updates
`db.user.update({ where: { id: session.user.id }, ... })`. Reuses `auditLog` the same way every other
mutation route in this codebase does (`action: "customer.profile_update"`).

### Task 8.5 — Forms page

**File: `src/app/customer/account/forms/page.tsx`** — there is no intake/consent form feature in the
schema or the SaaS proposal today. Ship this as an honest empty state: heading "Forms", body copy "Salons
you book with may ask you to fill out forms before your appointment. When a salon sends you one, it will
show up here." and a muted illustration/icon. Do not fabricate sample forms. This matches the roadmap
posture used elsewhere in this plan.

### Task 8.6 — Settings page

**File: `src/app/customer/account/settings/page.tsx`** — sections:
- **Change password** — form posting to an ADDITIVE new route `src/app/api/customers/me/password/route.ts`
  (`PATCH`), which requires the current password (re-verify with `verifyPassword` from
  `src/lib/password.ts`, same as login) before hashing and saving a new one via `hashPassword`. Reuse the
  existing password rules already enforced by `signupSchema` (`min(8).max(100)`).
- **Deactivate account** — a destructive button behind a confirmation dialog, posting to ADDITIVE
  `src/app/api/customers/me/route.ts` `DELETE` handler. Since `Customer.userId` uses `onDelete: SetNull`
  and `Booking.customerId` uses `onDelete: Restrict` (see schema), a hard delete of the `User` row would
  throw on any account with existing bookings. Do **not** hard-delete. Instead, add one more additive
  field:

  **File: `prisma/schema.prisma`** — add `deactivatedAt DateTime?` to `model User`. Run
  `npx prisma migrate dev --name user_deactivation`.

  The `DELETE` handler sets `deactivatedAt: new Date()` instead of deleting the row, and immediately calls
  `signOut()`. **File: `src/lib/auth.ts`** — in the `authorize` callback, after loading `user`, add a check:
  if `user.deactivatedAt` is set, throw the same generic `"Invalid email or password"` error used for
  every other auth failure (never reveal that the account exists but is deactivated, consistent with the
  existing timing-safe generic-error pattern already documented at the top of that file).

---

## PHASE 9 — Auth entry point cleanup

### Task 9.1 — Business `/signup` — make the role explicit and stop it from ever creating a `CUSTOMER`

`src/schemas/user.ts`'s `signupSchema` already defaults `role` to `"OWNER"`. Confirm
`src/app/(auth)/signup/page.tsx`'s submit handler never sends `role: "CUSTOMER"` (it currently omits the
field, which is correct because of the default) — leave as is, just add a short one-line note under the
form's heading: "Creating a business account. Looking to book an appointment instead? Go to the customer
site." with the second half as a `<Link href="/customer/signup">`. This directly resolves the "messy"
feeling by telling a lost customer where to go instead of leaving them on the wrong form.

### Task 9.2 — Customer `/customer/signup` — same reciprocal note

**File: `src/app/customer/signup/page.tsx`** — add a matching line: "Signing up to book appointments.
Own a salon? " + `<Link href="/signup">Create a business account</Link>`.

### Task 9.3 — Post-login redirect correctness

Confirm (do not change unless broken) that:
- `/login` (business) success handler sends `OWNER`/`STAFF`/`ADMIN` to `callbackUrl` default `/dashboard`.
- `/customer/login` success handler sends `CUSTOMER` to `callbackUrl` default `/customer` — change this
  default to `/customer/account/activity` now that Phase 8 exists, so a returning customer lands on their
  activity list instead of the generic homepage (matches the founder's mental model of screenshot 11 being
  "the dashboard").
- If a `CUSTOMER` account somehow submits `/login` (business form), or an `OWNER`/`STAFF` submits
  `/customer/login`, show a clear inline error ("This looks like a business account. Log in at the
  business login instead." / the reverse) instead of a generic auth failure — this requires checking
  `session.user.role` client-side right after a successful `signIn` call in both login pages and, if it
  does not match the page's expected audience, immediately `signOut()` and show the redirect message with
  a link, rather than leaving them signed into the wrong context.

---

## PHASE 10 — QA checklist (run before calling this done)

1. `npm run lint && npm run test && npm run build` all pass.
2. Scan a business's real QR code (or open `/dashboard/qr-code` and copy the encoded URL) → confirm it
   opens `/{slug}` → confirm "Book now" leads to the exact same `/{slug}/book` wizard a marketplace search
   result reaches by clicking a `VenueCard`.
3. Start a booking from the QR path and, in a second browser/tab, start a booking for the *same
   professional and the exact same time slot* from the marketplace path. Confirm the second submission is
   rejected with "That slot was just booked by someone else" (the existing `EXCLUDE` constraint / overlap
   check in `POST /api/bookings` — Phase 7 must not have removed or bypassed this).
4. Complete a booking as a logged-in customer, then visit `/customer/account/activity` and confirm it
   appears under "Upcoming" with the correct business, service, date/time, and status.
5. Log in as a business `OWNER`, open `/dashboard` (existing bookings table), and confirm the same booking
   from step 4 appears there too — one booking, two views, never two rows.
6. Try to reach `/customer/account/*` while logged out → redirected to `/customer/login` with the correct
   `callbackUrl`, and after logging in, land back on the page requested.
7. Try to reach `/customer/account/*` while logged in as an `OWNER`/`STAFF` account → access denied or
   redirected, never shown another business's or another customer's data.
8. Deactivate a test customer account (Task 8.6), then try to log back in with the same credentials →
   generic "Invalid email or password", not a distinct "account deactivated" message.
9. Every new page (`/blog`, `/help`, `/customer/account/*`) renders with the shared header/footer and has
   no dead links, no `lorem ipsum`, no fabricated star ratings, review counts, or usage statistics
   anywhere introduced by this plan (Task 1.3).
10. Confirm `Menu` dropdown (Phase 2) on the business header's "For customers" row lands on `/customer`
    and the customer header's "For businesses" row lands on `/for-business`, both from a fresh, logged-out
    session.

---

## Summary of every new/changed file

**New files**
```
src/lib/categories.ts
src/lib/sri-lanka-locations.ts
src/components/marketing/menu-dropdown.tsx
src/components/customer/customer-header.tsx
src/components/customer/home/venue-card.tsx
src/components/customer/home/venue-rail.tsx
src/components/customer/search/treatments-dropdown.tsx
src/components/customer/search/location-autocomplete.tsx
src/components/customer/search/date-time-picker.tsx
src/components/customer/search/search-bar.tsx
src/components/booking/BookingWizard.tsx
src/app/blog/page.tsx
src/app/help/page.tsx
src/app/customer/account/layout.tsx
src/app/customer/account/page.tsx
src/app/customer/account/profile/page.tsx
src/app/customer/account/activity/page.tsx
src/app/customer/account/forms/page.tsx
src/app/customer/account/settings/page.tsx
src/app/api/customers/me/route.ts
src/app/api/customers/me/password/route.ts
```

**Edited files**
```
prisma/schema.prisma                          (Customer.userId, User.customerProfiles, User.phone,
                                                User.deactivatedAt, Service.category, optionally
                                                StaffMember.title)
src/schemas/service.ts                         (+ category)
src/schemas/booking.ts                         (customerName/customerPhone become optional)
src/app/api/bookings/route.ts                  (session-aware customer linking)
src/app/api/marketplace/search/route.ts        (+ category filter)
src/app/api/staff/route.ts                     (+ public=true minimal read branch)
src/app/api/auth/signup/route.ts               (persist phone)
src/lib/auth.ts                                (deactivatedAt check)
src/components/marketing/site-header.tsx       (Menu dropdown, Marketplace link)
src/app/customer/page.tsx                      (full rebuild, Phase 3)
src/app/customer/search/page.tsx               (Phase 5 polish, location param, category param)
src/app/customer/login/page.tsx                (reciprocal note, redirect default, wrong-audience guard)
src/app/customer/signup/page.tsx               (reciprocal note)
src/app/(auth)/login/page.tsx                  (wrong-audience guard)
src/app/(auth)/signup/page.tsx                 (reciprocal note)
src/app/[businessSlug]/page.tsx                (Phase 6: team, about, additional info, nearby)
src/app/[businessSlug]/book/page.tsx           (auth guard, renders BookingWizard)
src/app/dashboard/services/page.tsx            (+ category select on the existing form)
```

**Deleted files**
```
src/components/booking/SlotPicker.tsx   (superseded by BookingWizard.tsx — delete only after
                                          BookingWizard.tsx is wired in and the QA checklist passes)
```

Do not delete `SlotPicker.tsx` until `BookingWizard.tsx` is confirmed working end to end (Phase 10, items
2–5) — keep both in the repo simultaneously during development so there is always a working booking path.
