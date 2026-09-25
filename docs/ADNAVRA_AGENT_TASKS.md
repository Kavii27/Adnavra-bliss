# ADNAVRA — Agent Task List

Read this top to bottom. Tasks are ordered by priority. Each task lists exact file
paths, what's wrong (verified by reading the actual code — not guessed), and what to
do. This file only — no code was changed in this pass, nothing has been reverted.

Run `npm install && npm run dev` before starting, then work Priority 0 → 5 in order,
doing the "Verify" step for each before moving to the next.

---

## ✅ Priority 0 — Already fixed in an earlier pass (verify, don't redo)

These were root-caused and patched directly in a previous session on these exact
files. Don't touch them again unless verification below turns up a regression.

1. `src/components/onboarding/wizard-shell.tsx` — white text on cream background
   fixed (`text-white` → `text-[#3a2f22]`).
2. `src/components/onboarding/step-location-map.tsx` — invisible input text fixed;
   "Edit business location" modal z-index raised so it can't be sat on top of.
3. `src/components/onboarding/step-business-name.tsx` — same invisible-input-text
   bug fixed.
4. `src/components/onboarding/map-picker.tsx` — map given its own isolated stacking
   context (`isolate`) so Leaflet's internal panes stop overlapping page UI; added a
   working "Use my location" button (`navigator.geolocation`).
5. Logo added to every navbar that was missing it: `src/components/dashboard/
   sidebar.tsx`, `src/app/admin/layout.tsx`, and all 4 auth pages (`(auth)/login`,
   `(auth)/signup`, `customer/login`, `customer/signup`).

**Still open from that pass:** grep for any remaining text-only "ADNAVRA" wordmark
headers that never got a logo image:
```bash
grep -rln "ADNAVRA" src/app src/components | xargs grep -L "logo.png"
```

---

## 🔴 Priority 1 — Subscription plan gating (full implementation)

### Ground truth, verified by reading the code
- `prisma/schema.prisma` already has `enum SubscriptionPlan { STARTER PROFESSIONAL
  PREMIUM }` and a `Subscription` model with `businessId`, `plan`, `status`. The
  data layer is ready.
- **Nothing in the app reads `subscription.plan` to lock or blur anything.** The
  only place `SubscriptionPlan` appears in `src/` is a read-only display on
  `src/app/dashboard/settings/billing/page.tsx`. Every dashboard page is currently
  visible to every plan.
- `src/app/dashboard/layout.tsx` currently fetches only `{ name, slug }` for the
  business — it does not fetch or pass down the subscription/plan at all. This is
  the first thing that needs to change; every gate downstream depends on it.

### Decision: the feature matrix

You told me to decide what's locked at each tier — here's the full matrix, built
directly from your pricing page copy plus every dashboard feature that pricing
copy didn't explicitly mention (I've made a judgment call on those and flagged
them). Treat this table as the single source of truth — put it in code exactly as
written, don't let individual pages invent their own rules.

| Dashboard area / page | Route | Tier required | Why |
|---|---|---|---|
| Home, Calendar (basic), Appointments, Service menu, Client list (basic), Business settings, Billing settings, Scheduling (basic), QR code (basic), Reports (booking counts only) | various | **STARTER** (always on) | Matches "Online appointment booking / management, Services & pricing listing, Basic availability management, Business opening hours" |
| Team → Members (staff mgmt, multiple staff, staff-specific appointments) | `/dashboard/team/members` | **PROFESSIONAL** | Pricing copy, verbatim |
| Clients → List, advanced filters + booking history | `/dashboard/clients/list` | **PROFESSIONAL** | "Customer database", "Booking history" |
| Calendar advanced view (custom appointment statuses, bulk reschedule) | `/dashboard/calendar` | **PROFESSIONAL** | "Advanced schedule management", "Appointment status management" |
| Reports → revenue & trend charts | `/dashboard/reports` | **PROFESSIONAL** | "Basic business analytics" |
| Marketing (promotions, base) | `/dashboard/marketing` | **PROFESSIONAL** | "Promotional offers", "Featured salon profile" |
| Sales → Daily summary | `/dashboard/sales/daily-summary` | **PROFESSIONAL** | Financial reporting beyond raw booking list |
| Sales → Payments (payment history / online payments) | `/dashboard/sales/payments` | **PROFESSIONAL** | Pairs with Customer database / Booking history tier |
| Sales → Packages sold | `/dashboard/sales/packages` | **PROFESSIONAL** | Pairs with catalog packages (below) |
| Catalog → Products (retail) | `/dashboard/catalog/products` | **PROFESSIONAL** | Extends Starter's "Services & pricing listing" |
| Catalog → Packages (define bundles) | `/dashboard/catalog/packages` | **PROFESSIONAL** | "Promotional offers" |
| Settings → Client settings | `/dashboard/settings/clients` | **PROFESSIONAL** | Pairs with Customer database |
| Settings → Payments config | `/dashboard/settings/payments` | **PROFESSIONAL** | Pairs with Sales → Payments |
| Settings → Sales config (receipts/tax) | `/dashboard/settings/sales` | **PROFESSIONAL** | Operational tool for a business already taking payments |
| Clients → Online reputation | `/dashboard/clients/reputation` | **PROFESSIONAL** | Judgment call — ties to "Featured salon profile" visibility |
| Business settings → multi-branch fields | `/dashboard/settings/business` | **PREMIUM** | "Multiple branches / locations" |
| Reports → advanced analytics, online-presence insights | `/dashboard/reports` | **PREMIUM** | "Advanced analytics & reports", "Booking & revenue insights" |
| Clients → Segments | `/dashboard/clients/segments` | **PREMIUM** | "Advanced customer management" |
| Clients → Loyalty | `/dashboard/clients/loyalty` | **PREMIUM** | "Loyalty / return-customer features", verbatim |
| Marketing → scheduled campaigns, marketplace priority placement | `/dashboard/marketing` | **PREMIUM** | "Promotional campaigns", "Featured marketplace placement", "Priority listing" |
| Sales → Memberships sold | `/dashboard/sales/memberships` | **PREMIUM** | Recurring-revenue feature, judgment call |
| Sales → Gift cards sold | `/dashboard/sales/gift-cards` | **PREMIUM** | Judgment call — revenue/promo feature |
| Sales → Sales (detailed records) | `/dashboard/sales/sales` | **PREMIUM** | "Booking & revenue insights" |
| Catalog → Suppliers, Stock orders, Stocktakes | `/dashboard/catalog/{suppliers,stock-orders,stocktakes}` | **PREMIUM** | Full inventory ops — judgment call, scale/ops feature |
| Team → Shifts, Timesheets | `/dashboard/team/{shifts,timesheets}` | **PREMIUM** | "Advanced staff management" |
| Settings → Forms (client intake) | `/dashboard/settings/forms` | **PREMIUM** | "Advanced customer management" |
| QR code → premium templates/print materials | `/dashboard/qr-code` | **PREMIUM** | "Premium QR materials", verbatim |
| **Apps** (integrations marketplace) | `/dashboard/apps` | **not gated** | Browsable by every plan; individual third-party apps may carry their own pricing later |
| **Team → Pay runs** | `/dashboard/team/pay-runs` | **out of scope permanently** | The page's own copy already says "Payroll is not part of the ADNAVRA platform." Don't gate it — remove the nav entry entirely (see Task 1.7) instead of leaving a dead link at any tier. |

### Task 1.1 — Central feature config
Create `src/lib/plan-features.ts`:
```ts
export const PLAN_RANK = { STARTER: 0, PROFESSIONAL: 1, PREMIUM: 2 } as const;
export type Plan = keyof typeof PLAN_RANK;

export const FEATURE_MIN_PLAN = {
  staffManagement: "PROFESSIONAL",
  clientDatabase: "PROFESSIONAL",
  advancedScheduling: "PROFESSIONAL",
  basicAnalytics: "PROFESSIONAL",
  promotions: "PROFESSIONAL",
  dailySummary: "PROFESSIONAL",
  onlinePayments: "PROFESSIONAL",
  packagesSold: "PROFESSIONAL",
  retailProducts: "PROFESSIONAL",
  packageCatalog: "PROFESSIONAL",
  clientSettings: "PROFESSIONAL",
  paymentSettings: "PROFESSIONAL",
  salesSettings: "PROFESSIONAL",
  onlineReputation: "PROFESSIONAL",

  multiBranch: "PREMIUM",
  advancedAnalytics: "PREMIUM",
  clientSegments: "PREMIUM",
  loyaltyProgram: "PREMIUM",
  campaigns: "PREMIUM",
  membershipsSold: "PREMIUM",
  giftCardsSold: "PREMIUM",
  detailedSales: "PREMIUM",
  inventoryOps: "PREMIUM",
  staffScheduling: "PREMIUM",
  intakeForms: "PREMIUM",
  premiumQrMaterials: "PREMIUM",
} as const satisfies Record<string, Plan>;

export type Feature = keyof typeof FEATURE_MIN_PLAN;

export function hasAccess(currentPlan: Plan, feature: Feature): boolean {
  return PLAN_RANK[currentPlan] >= PLAN_RANK[FEATURE_MIN_PLAN[feature]];
}
```

### Task 1.2 — Server-side guard (this is the one that's actually security-relevant)
Create `src/lib/require-plan.ts`:
```ts
import { db } from "@/lib/db";
import { hasAccess, type Feature, type Plan } from "@/lib/plan-features";

export async function getCurrentPlan(businessId: string): Promise<Plan> {
  const sub = await db.subscription.findUnique({ where: { businessId } });
  return sub?.status === "ACTIVE" ? sub.plan : "STARTER";
}

export class FeatureLockedError extends Error {
  constructor(public feature: Feature) {
    super(`Feature locked: ${feature}`);
  }
}

export async function requirePlanFeature(businessId: string, feature: Feature) {
  const plan = await getCurrentPlan(businessId);
  if (!hasAccess(plan, feature)) throw new FeatureLockedError(feature);
}
```
Call `requirePlanFeature()` at the top of every gated API route (see the per-page
table above for which routes need it) and catch `FeatureLockedError` → return
`403` with `{ error: "upgrade_required", feature }`.

### Task 1.3 — Wire plan into the dashboard layout
Edit `src/app/dashboard/layout.tsx` — change the existing business fetch:
```ts
const business = await db.business.findUnique({
  where: { id: businessId },
  select: { name: true, slug: true, subscription: { select: { plan: true, status: true } } },
});
const currentPlan: Plan =
  business?.subscription?.status === "ACTIVE" ? business.subscription.plan : "STARTER";
```
Then wrap `{children}` in a client context provider so nested client components
(the sidebar, the gate component) can read the plan without prop-drilling through
every page:
```tsx
// src/components/dashboard/plan-context.tsx
"use client";
import { createContext, useContext } from "react";
import type { Plan } from "@/lib/plan-features";

const PlanContext = createContext<Plan>("STARTER");
export const PlanProvider = PlanContext.Provider;
export const useCurrentPlan = () => useContext(PlanContext);
```
In `layout.tsx`: `<PlanProvider value={currentPlan}><main>{children}</main></PlanProvider>`.

### Task 1.4 — The lock/blur UI component
Create `src/components/dashboard/plan-gate.tsx`:
```tsx
"use client";
import Link from "next/link";
import { Lock } from "lucide-react";
import { hasAccess, type Feature } from "@/lib/plan-features";
import { useCurrentPlan } from "@/components/dashboard/plan-context";

export function PlanGate({ feature, children }: { feature: Feature; children: React.ReactNode }) {
  const plan = useCurrentPlan();
  if (hasAccess(plan, feature)) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm opacity-60">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/40">
        <Lock className="h-5 w-5 text-[#8a6d4f]" />
        <p className="text-sm font-medium text-[#3a2f22]">Upgrade to unlock this</p>
        <Link href="/dashboard/settings/billing" className="text-xs font-semibold text-[#8a6d4f] hover:underline">
          View plans →
        </Link>
      </div>
    </div>
  );
}
```
For an entire page that's gated (not just a section of one), wrap the whole
returned JSX in `<PlanGate feature="...">...</PlanGate>` inside the page component
— no separate "locked page" template needed, this component already renders the
lock overlay.

### Task 1.5 — Sidebar badges
`src/components/dashboard/sidebar.tsx` currently shows every section identically.
Add a small "PRO" / "PREMIUM" badge next to any top-level item where *every* page
under it is gated above Starter (Marketing, Team once you decide members-only vs
whole section — per the matrix, Team/Members is Professional so badge "PRO" on
the Team icon). Read `useCurrentPlan()` and only show the badge when the viewer's
plan doesn't already meet it — don't show a "PRO" badge to someone already on
Professional.

### Task 1.6 — Apply the gate to every route in the matrix
Go through the table above top to bottom. For each row: wrap the page body in
`<PlanGate feature="...">`, and add `await requirePlanFeature(businessId,
"...")` to any API route that page calls. Do the STARTER rows last (i.e. do
nothing to them — confirming they're *not* gated is the check, not a code change).

### Task 1.7 — Remove Pay runs from the nav
`src/app/dashboard/team/pay-runs/page.tsx` explicitly documents itself as
out-of-platform-scope. Don't gate it. Remove its entry from whatever sub-nav
lists Team pages (check `src/app/dashboard/team/layout.tsx` if one exists, or
wherever the Team section's tab list is rendered) so it stops being a dead end at
any subscription tier. Leave the page file itself in place in case it's
reintroduced later, just unlink it.

### Verify
Seed three businesses, one per plan tier. Confirm: Starter sees every STARTER row
working normally and every PROFESSIONAL/PREMIUM row blurred with an upgrade
prompt; Professional sees PROFESSIONAL unlocked, PREMIUM blurred; Premium sees
everything. Then, logged in as the Starter business, hit a gated API route
directly (Postman/curl) and confirm it 403s — the blur is UX only, the API check
is what actually matters.

---

## 🔴 Priority 2 — Every sidebar tab, fully implemented

### Ground truth, verified by reading every `page.tsx` under `src/app/dashboard/`
Two pages are genuinely missing (404, no file at all): `/dashboard/marketing` and
`/dashboard/apps`. Everything else in the sidebar resolves to a real file — but 20
of those files are intentional `<ComingSoon />` placeholders, not bugs. That's
actually reasonable practice (they're clearly labeled, not broken), but you asked
for them built out, so here's the full list with what each one needs. Tier shown
is the decision from Priority 1's matrix — build the gate (Priority 1) and the
feature (this section) together per page, don't build the UI now and gate it
later as two separate passes.

#### Cluster A — "Sold items" list pages (same pattern × 4)
`sales/gift-cards`, `sales/memberships`, `sales/packages`, `sales/sales` are all
currently a `<ComingSoon>` stub with identical structure. They all need the same
build pattern:

1. Add a Prisma model for the underlying record if one doesn't exist yet
   (`GiftCard`, `Membership`, `PackageSale` — check `prisma/schema.prisma` first,
   `Sale`/transaction records may already exist for `sales/sales` since bookings
   already have a status/price). Include `businessId`, and filter every query by
   it (per `AGENTS.md` rule — no exceptions).
2. Add a Zod schema in `src/schemas/` for creating one (e.g. `giftCard.ts`).
3. Add the API route(s) under `src/app/api/` (e.g. `src/app/api/gift-cards/
   route.ts`) — `GET` list scoped to `businessId`, `POST` create, validated with
   the Zod schema from step 2, rate-limited per `AGENTS.md`.
4. Replace the `<ComingSoon>` body in the page with: a table/list of records
   (reuse the table styling from `src/app/dashboard/clients/list/page.tsx`,
   don't invent new table CSS), a "Create" button/modal, empty state.
5. Wrap the page (or just the create action, your call per feature) in
   `<PlanGate feature="...">` per the Priority 1 matrix.
6. Verify: create a record as a business at the required tier, confirm it lists;
   confirm a business below that tier sees the blur instead.

#### Cluster B — Catalog inventory pages (same pattern × 3)
`catalog/suppliers`, `catalog/stock-orders`, `catalog/stocktakes` — same build
pattern as Cluster A, but these three relate to each other (a stock order
references a supplier; a stocktake reconciles current stock), so build them in
this order, not in parallel:
1. `Supplier` model + CRUD page first (simplest, no dependencies).
2. `StockOrder` model (references `Supplier`, has line items referencing
   `Product` — which itself needs to exist first, see Cluster C).
3. `Stocktake` model (a snapshot of counted quantities vs expected).
All three gate at PREMIUM per the matrix.

#### Cluster C — Catalog additions (2 pages)
- `catalog/products` — needs a `Product` model (name, price, stock quantity,
  businessId) separate from `Service` (services are already modeled). Build the
  CRUD page the same way as `catalog/service-menu/page.tsx` (already fully
  built, 341 lines — copy that pattern, don't start from scratch). PROFESSIONAL.
- `catalog/packages` — needs a `Package` model (bundles N services at a fixed
  price). Feeds `sales/packages` (Cluster A) once a customer buys one.
  PROFESSIONAL.

#### Cluster D — Client relationship pages (3 pages)
- `clients/loyalty` — needs a points/visits model tied to `Customer` (check if a
  `Customer` model already exists — `src/app/api/customers/` suggests yes,
  extend it rather than duplicating). Simplest version: N visits = 1 reward,
  configurable by the salon in Settings. PREMIUM.
- `clients/segments` — tag/filter customers by visit frequency, last-visit date,
  total spend. Can be computed from existing `Booking` records — likely doesn't
  need a new model, just aggregation queries. PREMIUM.
- `clients/reputation` — review/rating aggregation. Check whether a `Review`
  model already exists for the marketplace listing (the public salon page shows
  ratings somewhere per your Salonkee reference image) — reuse it rather than
  building a second reviews system. PROFESSIONAL.

#### Cluster E — Team pages (2 remaining, Pay runs excluded per Task 1.7)
- `team/shifts` — roster/shift assignment per staff member. Needs a `Shift`
  model (staffId, businessId, start, end). PREMIUM.
- `team/timesheets` — clock-in/out or manual hours entry per staff member,
  reads against `Shift` if you want scheduled-vs-actual comparison, otherwise
  standalone. PREMIUM.

#### Cluster F — Settings sub-pages (4 pages)
All four currently redirect-style `<ComingSoon>` under `/dashboard/settings/*`:
- `settings/clients` — custom client fields + notification toggles. PROFESSIONAL.
- `settings/payments` — payment gateway connection (this is the one with real
  external dependency — you'll need to pick a gateway, e.g. PayHere or Stripe,
  before this can be more than a UI shell; flag that decision to your team, don't
  guess a provider). PROFESSIONAL.
- `settings/sales` — receipt template + tax rate configuration, feeds Cluster A's
  `sales/sales`. PROFESSIONAL.
- `settings/forms` — intake form builder (field list, required/optional toggle,
  attached to booking flow). PREMIUM.

#### Task 2.1 — Marketing page (net-new, no file exists)
Create `src/app/dashboard/marketing/page.tsx`. PROFESSIONAL baseline: a list of
promotional offers (discount code, % off, valid dates) tied to a new `Promotion`
model. PREMIUM addition on the same page: scheduled/recurring "campaigns" (a
`Promotion` with a repeat rule) and a toggle for marketplace priority placement
(this second part also needs `src/app/api/marketplace/search/route.ts` updated
to actually weight priority businesses higher — check that file, it currently
has no concept of priority at all).

#### Task 2.2 — Apps page (net-new, no file exists)
Create `src/app/dashboard/apps/page.tsx`. Not plan-gated. Minimum viable: a
static grid of integration cards (payment gateway, SMS reminders, etc.) each
marked "Available" or "Coming soon" — no functional integration required yet,
this just needs to stop being a 404. Real integrations are a separate,
larger project outside this task list's scope.

#### Task 2.3 — Reports page: split the existing sections by tier
`src/app/dashboard/reports/page.tsx` (332 lines, already substantially built)
already has an `available: false` flag on an "online-presence" section with
`lockedReason: "Coming soon"`. Replace that ad-hoc flag with the real
`<PlanGate feature="advancedAnalytics">` — it's already 90% of the way there,
someone just needs to swap the hardcoded lock for the real one. Basic
booking-count sections stay STARTER; revenue/trend charts move behind
`basicAnalytics` (PROFESSIONAL); the online-presence section behind
`advancedAnalytics` (PREMIUM).

#### Task 2.4 — Calendar & QR code: add the tier's extra features, don't rebuild
Both already work at a basic level. Don't rewrite them — add to them:
- `src/app/dashboard/calendar/page.tsx` — add custom appointment status labels
  and bulk-reschedule, gated `advancedScheduling` (PROFESSIONAL).
- `src/app/dashboard/qr-code/page.tsx` (51 lines currently — a single QR, likely
  minimal) — add downloadable premium print templates (table tent, window
  sticker sizes), gated `premiumQrMaterials` (PREMIUM).

### Verify (whole Priority 2)
After each cluster, click every single sidebar item and every sub-nav item as a
Premium-tier test business — nothing should show "Coming soon" or 404 by the end
of this priority. Then repeat as a Starter-tier business and confirm the
PROFESSIONAL/PREMIUM ones show the Priority-1 blur instead of either the old
"Coming soon" placeholder or a broken page.

---

## 🟠 Priority 3 — Salon logo/photo quality control (admin-side)

Verified: `Business.logoUrl` is a plain `String?` — there is no upload endpoint
anywhere in `src/app/api/` and no image-processing step, so there's currently no
size/quality floor on what a salon owner submits.

### Task 3.1 — Upload endpoint with quality enforcement
```bash
npm install sharp
```
```ts
// src/app/api/businesses/[id]/images/route.ts
import sharp from "sharp";
import { auth } from "@/lib/auth";

const MIN_WIDTH = 512;
const MAX_SIZE_MB = 8;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  // verify session.user owns business params.id OR role === "ADMIN"
  // — reuse the ownership check already in src/app/api/businesses/[id]/route.ts

  const form = await req.formData();
  const file = form.get("file") as File;
  const kind = form.get("kind") as "logo" | "cover" | "gallery";
  if (!file || file.size > MAX_SIZE_MB * 1024 * 1024) {
    return Response.json({ error: "File too large" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const meta = await sharp(buf).metadata();
  if (!meta.width || meta.width < MIN_WIDTH) {
    return Response.json(
      { error: `Image must be at least ${MIN_WIDTH}px wide (got ${meta.width}px)` },
      { status: 422 }
    );
  }
  const processed = await sharp(buf)
    .rotate()
    .resize({ width: kind === "logo" ? 512 : 1600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  // store `processed` in your object storage, save the URL to Business.logoUrl
  // or the new BusinessImage table (Task 3.3)
}
```

### Task 3.2 — Client-side pre-check
In `src/app/dashboard/settings/business/page.tsx`, read image dimensions before
uploading and warn immediately if too small, instead of waiting on a 422.

### Task 3.3 — Gallery/cover images need a real table
`Business` only has one `logoUrl` field — no field exists for a photo gallery
(your Salonkee reference screenshot shows 6+ photos). Add:
```prisma
model BusinessImage {
  id         String   @id @default(cuid())
  businessId String
  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  url        String
  kind       String   // "cover" | "gallery"
  position   Int      @default(0)
  createdAt  DateTime @default(now())

  @@index([businessId])
}
```
`npx prisma migrate dev --name add_business_images` after adding this.

### Task 3.4 — Admin override tool (no salon login required)
Add `src/app/admin/businesses/[id]/images/page.tsx`. Reuse the Task 3.1 endpoint
— its ownership check already allows `role === "ADMIN"` to act on any
`businessId`, so no separate endpoint needed. Thumbnails of current logo/cover/
gallery, replace button per image, delete per gallery photo. Match the existing
list-view styling in `src/app/admin/businesses/page.tsx`.

### Verify
As ADMIN, open a salon you don't own, replace its logo, confirm it updates on
that salon's public page (`src/app/[businessSlug]/page.tsx`) without ever signing
in as that salon.

---

## 🟡 Priority 4 — Customer booking page UI (match your reference)

You pointed at Image 1 (Salonkee) as the target for `src/app/[businessSlug]/
page.tsx` + `src/app/[businessSlug]/book/page.tsx`. This is a redesign task — I
haven't rendered the current page in a browser, so I won't prescribe exact
Tailwind classes against a screenshot I can't diff. Concretely:
1. Screenshot your current live salon page at the same viewport width as Image 1.
2. Diff section by section: hero photo + thumbnail strip, sticky "Book
   appointment" button, rating summary, tabbed services list, map + hours +
   contact block, reviews with a rating breakdown bar.
3. File one task per section once you have that diff.
4. Reuse `src/components/booking/BookingWizard.tsx` and `SlotPicker.tsx` — those
   already work, this is a layout/chrome task, not booking-logic.

---

## 🟢 Priority 5 — Project structure cleanup

Confirm each with your team before deleting — don't delete blindly:
1. `docs/ADNAVRA_BUILD_PLAN (3).md` — the `(3)` suggests a duplicate save, not a
   real v3. Keep whichever of the 6 docs is current, archive/delete the rest.
2. `replace_colors.js` at project root — a one-off script that already did the
   blue→terracotta theme migration. Done running; move to `scripts/` or delete.
3. `.agents/skills/` and `.claude/skills/` both contain identical `supabase` and
   `supabase-postgres-best-practices` skill folders — but `AGENTS.md` says this
   project uses Prisma + Postgres directly on a Hostinger VPS, not Supabase.
   Confirm you're not using Supabase anywhere, then remove both.
4. Do **not** touch `prisma/migrations/` — every folder there is a real applied
   migration; deleting any of them breaks your migration history.

---

## How to work through this
1. `npm install`, copy `.env.example` → `.env` with real values, `npx prisma
   migrate dev`, `npm run dev`.
2. Priority 1 (gating infra) before Priority 2 (features) — build the `PlanGate`/
   `requirePlanFeature` plumbing first, then build each feature cluster already
   wrapped in its gate, not as two separate passes.
3. `npm run lint` and `npm test` before calling any priority done —
   `tests/availability.test.ts` already exists and must keep passing.
