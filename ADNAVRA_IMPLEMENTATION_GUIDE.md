# ADNAVRA BLISS — Implementation Guide

This is the build spec, not a discussion doc. Every step below has exact file
paths and code — your agent should be able to work straight through it without
guessing. Everything here was verified by reading the actual code in the zip
you sent, including the two brand-new findings in Step 2 (the dead dashboard
buttons you noticed). Nothing here was run in a browser — no `node_modules` or
network access in this environment — so each step ends with a "Verify" you
should actually click through once it's built.

Work top to bottom. Steps 1–2 are small, isolated bug fixes — do them first,
they unblock accurate testing of several later steps (especially anything
location-related).

---

## Step 1 — Two global header bugs (do these first)

### Task 1.1 — Geolocation is disabled sitewide by your own security header
`next.config.js` currently sets:
```js
{
  key: "Permissions-Policy",
  value: "camera=(), microphone=(), geolocation=()",
}
```
`geolocation=()` blocks every origin, **including your own site**, from ever
asking for the user's location. This is why "Use my location" on salon
signup and "Current location" in marketplace search both silently fail — the
browser refuses the permission prompt before your code runs.

**Fix** — in `next.config.js`, change that one line to:
```js
{
  key: "Permissions-Policy",
  value: "camera=(), microphone=(), geolocation=(self)",
}
```
`src/middleware.ts` doesn't set `Permissions-Policy` at all (only CSP), so no
change needed there for this task.

### Task 1.2 — Map iframe blocked by CSP ("This content is blocked...")
Your salon page already uses OpenStreetMap, not Google Maps
(`src/app/[businessSlug]/page.tsx`, builds an `openstreetmap.org/export/
embed.html` iframe URL) — so this was never a Google Maps API key problem.
The real cause: your CSP has no `frame-src` directive in either place it's
defined, so it falls back to `default-src 'self'`, which blocks the browser
from loading an iframe pointed at any other domain.

**Fix, two files, keep them in sync:**

`next.config.js` — add one line to the CSP array:
```js
value: [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-src 'self' https://www.openstreetmap.org",   // ← add this line
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; "),
```

`src/middleware.ts` — same addition inside `buildCsp()`:
```ts
function buildCsp(nonce: string): string {
  const scriptSrc = `script-src 'self' 'unsafe-inline' 'unsafe-eval' 'nonce-${nonce}' 'strict-dynamic' https:`;
  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-src 'self' https://www.openstreetmap.org",   // ← add this line
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}
```
Middleware's version runs at request time and overrides the static one, so
both must say the same thing or you'll get inconsistent behavior between the
first paint and subsequent navigations.

### Verify (Step 1)
1. Open salon signup (onboarding), click "Use my location" — browser should
   now show the permission prompt and pin the map on approval.
2. Open marketplace search, click the location field's "current location"
   option — same check.
3. Open any salon's public page (`/[businessSlug]`) — the "Where to find us"
   map should render, not show the blocked message.

---

## Step 2 — Dead buttons in the dashboard

I looked for exactly this — buttons with no click handler and buttons whose
text is invisible against their own background. Found both, in four files.

### Task 2.1 — Calendar page: four buttons that genuinely do nothing
`src/app/dashboard/calendar/page.tsx`, lines 166, 169–174, 178, 181. None of
these four buttons have an `onClick` at all:

```tsx
// line 166 — "Scheduled team" filter, currently dead
<button className="inline-flex items-center gap-1.5 rounded-full bg-[#f6efe3] px-3 py-1.5 text-xs font-medium text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]">
  Scheduled team <ChevronDown className="h-3.5 w-3.5" />
</button>

// line 169–174 — filter icon, currently dead
<button
  aria-label="Filter"
  className="flex h-8 w-8 items-center justify-center rounded-full text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]"
>
  <SlidersHorizontal className="h-4 w-4" />
</button>

// line 178 — "Day" view switcher, currently dead
<button className="inline-flex items-center gap-1 rounded-lg border border-[#e6dcc8] bg-[#f6efe3] px-3 py-1.5 text-xs font-semibold text-[#3a2f22] hover:bg-[#f3ebdd]">
  Day <ChevronDown className="h-3.5 w-3.5" />
</button>

// line 181 — "Add" (new booking), currently dead — this one matters most
<button className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-sidebar-active)] px-3 py-1.5 text-xs font-semibold text-[#3a2f22] hover:opacity-90">
  <Plus className="h-3.5 w-3.5" /> Add <ChevronDown className="h-3.5 w-3.5" />
</button>
```
The page only has one piece of state today (`const [date, setDate] =
useState(...)` — no view mode, no staff filter, no modal state). Fix each in
order of how much it matters:

**2.1.a — "Add" button: build a manual booking modal (the important one)**
This is the one your staff will actually miss — right now there's no way to
enter a walk-in or phone booking from the calendar at all.
1. Create `src/components/dashboard/add-booking-modal.tsx` — a modal with
   service picker, staff picker (from the `staff` array already fetched on
   this page), date/time picker, and customer name + phone fields.
2. It should `POST` to the existing `src/app/api/bookings/route.ts` — that
   route already exists and already accepts owner/staff-created bookings.
   This is also where Step 4's guest-booking decision matters: once Step 4
   removes public guest checkout, keep a staff-entered path (this modal)
   alive on the same endpoint, just gated by the OWNER/STAFF session instead
   of being open to the public.
3. Wire it up:
```tsx
const [addOpen, setAddOpen] = useState(false);
// ...
<button
  onClick={() => setAddOpen(true)}
  className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-sidebar-active)] px-3 py-1.5 text-xs font-semibold text-[#3a2f22] hover:opacity-90"
>
  <Plus className="h-3.5 w-3.5" /> Add
</button>
{addOpen && (
  <AddBookingModal
    businessId={businessId}
    staff={staff}
    defaultDate={date}
    onClose={() => setAddOpen(false)}
    onCreated={() => { setAddOpen(false); /* re-run the existing load()/fetch that populates bookings */ }}
  />
)}
```
(Drop the `<ChevronDown>` from this button — it implied a dropdown menu that
was never built; a single "Add" action doesn't need one.)

**2.1.b — "Scheduled team" filter: wire it to the staff you already fetch**
```tsx
const [staffFilter, setStaffFilter] = useState<string | null>(null);
// dropdown listing `staff` (already fetched), each option calls setStaffFilter(s.id)
// then filter the rendered bookings list: bookings.filter(b => !staffFilter || b.staffId === staffFilter)
```
Simplest version: a native `<select>` bound to `staffFilter` instead of a
custom dropdown — functional now, can be restyled later.

**2.1.c — "Day" view switcher: don't ship a dropdown with one working option**
Building Week/Month calendar views is a real, separate project — don't do it
as a side effect of fixing a dead button. For now, the honest small fix is to
remove the `<ChevronDown>` and make it a plain, non-interactive label ("Day
view") until Week/Month actually exist, so it stops looking like a broken
dropdown. File Week/Month as its own future task, not part of this fix.

**2.1.d — Filter icon: same honest-scope call**
Either wire it to a real advanced-filter panel (status, service type) if you
want that now, or remove the button until there's a filter panel behind it.
Don't leave a `SlidersHorizontal` icon that opens nothing.

### Task 2.2 — Invisible pagination button text (two files, same bug)
`src/app/dashboard/sales/appointments/page.tsx` (lines 154, 156) and
`src/app/dashboard/clients/list/page.tsx` (lines 207, 209) both have Prev/Next
pagination buttons with `bg-white` and `text-[#faf6ef]` — cream-on-white,
invisible. These do work when clicked (they're the one place `onClick` was
actually present), the label is just impossible to read, so it looks broken.

```tsx
// current (both files, both buttons):
className="rounded-lg border border-[#3a2f22] bg-white px-3 py-1.5 text-sm font-medium text-[#faf6ef] hover:bg-white/90 disabled:opacity-40 shadow-sm"

// fixed — swap the text color to the dark ink token used everywhere else:
className="rounded-lg border border-[#3a2f22] bg-white px-3 py-1.5 text-sm font-medium text-[#3a2f22] hover:bg-[#f6efe3] disabled:opacity-40 shadow-sm"
```
(Also swapped the hover background from `bg-white/90` to `bg-[#f6efe3]` since
white-on-white hover is the same invisibility bug on interaction.)

### Verify (Step 2)
Click every button on the Calendar page and both paginated list pages
(Sales → Appointments, Clients → List) — every one should either do something
visible or not exist as an interactive element at all. No silent dead clicks.

---

## Step 3 — Remove "nearby venues" suggestions from a salon's own page
`src/app/[businessSlug]/page.tsx`:
```tsx
// DELETE this import:
import { NearbyVenues } from "@/components/business/nearby-venues";

// DELETE this block (right after the About section):
{/* ── Nearby venues ── */}
{hasCoords && (
  <NearbyVenues
    businessId={business.id}
    latitude={business.latitude as number}
    longitude={business.longitude as number}
    radiusKm={15}
  />
)}
```
Leave `src/components/business/nearby-venues.tsx` itself alone — it's fine as
a "you might also like" block on the search results page later, just not on
a specific salon's own profile.

### Verify
Open any `/[businessSlug]` page — no "nearby venues" or "see all suggestions"
section should render anywhere on it.

---

## Step 4 — Require an account before a booking is confirmed
Checked `src/components/booking/BookingWizard.tsx` and
`src/app/api/bookings/route.ts` in full. Today: the wizard has no session
check at all, and the API route has a comment saying *"guest bookings keep
working exactly as before"* — unauthenticated bookings are explicitly allowed.

### Task 4.1 — Gate the wizard UI
In `BookingWizard.tsx`, add a session check:
```tsx
import { useSession } from "next-auth/react";
// ...
const { data: session, status } = useSession();
const isCustomer = status === "authenticated" && session?.user?.role === "CUSTOMER";
```
At the confirm step, when `!isCustomer`, render a sign-in prompt instead of
the confirm button — not a dead-end error after they click it:
```tsx
{!isCustomer ? (
  <div className="rounded-xl border border-[#E5DDD0] bg-[#F7F3ED] p-4 text-center">
    <p className="text-sm font-medium text-[#1F1E1D]">Sign in to confirm your booking</p>
    <p className="mt-1 text-xs text-[#8A8377]">Your selection is saved — you'll come right back here.</p>
    <div className="mt-3 flex justify-center gap-2">
      <Link
        href={`/customer/login?callbackUrl=${encodeURIComponent(currentUrlWithSelection)}`}
        className="rounded-lg bg-[#1F1E1D] px-4 py-2 text-sm font-medium text-white"
      >
        Log in
      </Link>
      <Link
        href={`/customer/signup?callbackUrl=${encodeURIComponent(currentUrlWithSelection)}`}
        className="rounded-lg border border-[#E5DDD0] px-4 py-2 text-sm font-medium text-[#1F1E1D]"
      >
        Sign up
      </Link>
    </div>
  </div>
) : (
  <ConfirmButton ... />
)}
```
Build `currentUrlWithSelection` as the current booking URL with the chosen
service/staff/slot as query params, so `callbackUrl` returns them to the same
step instead of restarting the flow.

### Task 4.2 — Enforce it server-side too
In `src/app/api/bookings/route.ts`, the public booking POST path must reject
unauthenticated requests:
```ts
const session = await auth();
if (!session?.user || session.user.role !== "CUSTOMER") {
  return NextResponse.json({ error: "auth_required" }, { status: 401 });
}
```
Remove (or clearly wall off) the existing guest-booking branch from this
public path. Recommendation: keep a guest/manual-entry capability only inside
the OWNER/STAFF dashboard (this is exactly what Step 2's new "Add booking"
modal needs — a staff member entering a walk-in isn't the same as a public
guest checkout). Don't delete guest-booking capability entirely, just move
who's allowed to trigger it.

### Verify
As a logged-out visitor, go through service + time selection on any salon's
booking page — hitting confirm should prompt sign-in, not error out. Sign in
and confirm you land back on the same step with your selection intact, not a
blank booking flow. Then confirm `POST /api/bookings` returns 401 for an
unauthenticated request via curl/Postman, not just that the UI hides it.

---

## Step 5 — Fix the marketplace search box (it's currently non-functional for text)
This one's worse than it looked in the plan doc — I read the actual component
this time. `src/components/customer/search/search-bar.tsx` has:
```ts
const [q] = useState(initialQ);   // ← no setter. q can never change after mount.
```
And nowhere in the JSX is there a text `<input>` for it — the "Treatments"
segment only renders `<TreatmentsDropdown>`, a category picker. Worse, inside
`src/components/customer/search/treatments-dropdown.tsx`, the "Venues" tab
literally tells the customer:
> *"Type a salon name in the search bar and results will appear on the
> search page."*
There is no search bar field to type into. This is the exact bug behind your
"I need a salon search option" ask — it's not missing polish, the box is
non-functional for free text today.

### Task 5.1 — Give `search-bar.tsx` a real, working text input
```tsx
// change:
const [q] = useState(initialQ);
// to:
const [q, setQ] = useState(initialQ);
```

### Task 5.2 — Make the dropdown trigger an actual input, not a static span
In `treatments-dropdown.tsx`, the trigger button currently renders:
```tsx
<span className={`flex-1 truncate text-sm ${value ? "text-[#1F1E1D]" : "text-[#8A8377]"}`}>{displayText}</span>
```
Replace this static span with a controlled text input, and add two new props
so `search-bar.tsx` can own the free-text state:
```tsx
type TreatmentsDropdownProps = {
  value: string | null;        // category slug (existing)
  onChange: (slug: string | null, label: string) => void;  // existing
  query: string;                // new — free text
  onQueryChange: (q: string) => void; // new
};
```
```tsx
<input
  value={query}
  onChange={(e) => {
    onQueryChange(e.target.value);
    setOpen(true);
  }}
  onFocus={() => setOpen(true)}
  placeholder="Search treatments or salons"
  className="flex-1 truncate bg-transparent text-sm text-[#1F1E1D] outline-none placeholder:text-[#8A8377]"
/>
```
Selecting a category (`handleSelect`) should still work exactly as before —
it sets `categorySlug` and can mirror the category label into the input via
`onQueryChange(label)`, but typing free text should clear `categorySlug` so
the two don't fight over what's active:
```tsx
function handleSelect(slug: string | null, label: string) {
  onChange(slug, label);
  onQueryChange(slug ? label : "");
  setOpen(false);
}
```

### Task 5.3 — Wire it up in `search-bar.tsx`
```tsx
<TreatmentsDropdown
  value={categorySlug}
  onChange={(slug) => setCategorySlug(slug)}
  query={q}
  onQueryChange={setQ}
/>
```
The rest already works: `handleSubmit` already does `if (q.trim())
params.set("q", q.trim())`, and the backend
(`src/app/api/marketplace/search/route.ts`) already does a case-insensitive
`name.contains` match on `q` and combines it with `category` filtering. This
whole task is frontend-only — the backend has supported this from before you
asked for it, it just had no way to receive the text.

### Verify
On the homepage/marketplace search bar, type a real salon name — confirm the
search page returns that salon. Type a treatment word instead — confirm
category-style matching still works. Confirm picking a category from the
dropdown still functions exactly as it did before.

---

## Step 6 — Salon type taxonomy + premium badge + category tags on cards
Checked `src/app/api/marketplace/search/route.ts`'s Prisma `select` — it
already fetches `categories` and `marketplacePriority` per business and
includes them in the JSON response (used for the priority sort internally).
The frontend's `Result` type in `src/app/customer/search/page.tsx` just never
declared or rendered either field. Small, backend-free fix.

### Task 6.1 — Add the salon type list
`src/lib/categories.ts` — add alongside the existing `SERVICE_CATEGORIES`:
```ts
export const BUSINESS_TYPES = [
  { slug: "unisex", label: "Unisex" },
  { slug: "gents", label: "Gents only" },
  { slug: "ladies", label: "Ladies only" },
  { slug: "bridal", label: "Bridal & occasion" },
  { slug: "home-visits", label: "Home visits" },
  { slug: "spa-resort", label: "Spa & resort" },
  { slug: "kids", label: "Kids friendly" },
] as const;
export type BusinessTypeSlug = (typeof BUSINESS_TYPES)[number]["slug"];
```
(Final list is your call — add/remove before building. This is a starting
set based on what you listed.)

### Task 6.2 — Let owners pick their type(s)
`Business.categories` already exists as a `String[]` in
`prisma/schema.prisma` — no migration needed. In
`src/app/dashboard/settings/business/page.tsx`, add a checkbox group over
`BUSINESS_TYPES` bound to that field (same pattern the page already uses for
any existing multi-select field — check `services` or similar for the
established checkbox-group style in this codebase before inventing new
markup).

### Task 6.3 — Update the `Result` type and render both fields
`src/app/customer/search/page.tsx`:
```ts
type Result = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
  categories: string[];           // ← add
  marketplacePriority: boolean;   // ← add
};
```
In the result card JSX (same file, inside `results.map((r) => ...)`), add a
badge and tags:
```tsx
<div className="p-4">
  {r.marketplacePriority && (
    <span className="mb-1.5 inline-flex items-center rounded-full bg-[#795831] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
      Featured
    </span>
  )}
  <p className="text-sm font-semibold text-[#1F1E1D] truncate">{r.name}</p>
  <p className="mt-0.5 flex items-center gap-1 text-xs text-[#8A8377] truncate">
    <MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{r.address ?? r.city ?? "Sri Lanka"}</span>
  </p>
  {r.categories.length > 0 && (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {r.categories.slice(0, 2).map((c) => (
        <span key={c} className="rounded-full bg-[#F7F3ED] px-2 py-0.5 text-[10px] text-[#795831]">{c}</span>
      ))}
    </div>
  )}
  {r.distanceKm != null && <p className="text-xs text-[#c9a26d] mt-1">{r.distanceKm.toFixed(1)} km away</p>}
</div>
```
Repeat the badge/tag markup on any other card that lists businesses (check
`src/components/customer/home/venue-rail.tsx` if it renders its own card
markup rather than reusing this component).

### Task 6.4 — Confirm `marketplacePriority` actually follows the Premium plan
Check whichever code path handles a subscription becoming `PREMIUM` (the
admin screen from Step 9 is one of them) — set `marketplacePriority: true`
there automatically rather than leaving it a disconnected manual flag.

### Verify
As a PREMIUM-plan test business, confirm its card shows "Featured" and sorts
above non-premium salons at the same distance. Confirm a business's chosen
type tags render on both its search card and its own public page.

---

## Step 7 — Make the marketplace the homepage, move the landing page to About

### Task 7.1 — Homepage layout (design brief, section by section)
Using the Salonkee screenshot as the actual page skeleton, with booking.com/
echannelling folded in only where noted:
1. **Hero** — full-width photo background, headline, search bar overlaid.
   The search box is the one fixed in Step 5 (combined name + treatment) plus
   `LocationAutocomplete` (already built) plus a Search button. Under the
   hero, add a thin trust-indicator row (e.g. "X salons across Sri Lanka /
   Verified salons / Instant confirmation").
2. **Advance search (collapsible)** — a toggle under the hero expanding into
   Salon type (Step 6), Price range, Date, Session/time-of-day — echannelling's
   pattern, relabeled for salons.
3. **Browse by category** — photo-card grid using `SERVICE_CATEGORIES`
   (already built), visual upgrade only, no new data.
4. Skip the "Get the App" banner — no mobile app exists.
5. **How does it work** — 3 steps (Create account → Select salon & services →
   Book date/time), explainer copy over flows you already have.
6. Skip salon-owner testimonials — no real quotes to feature yet.
7. **Low-key "for salons" banner** near the bottom, linking to `/for-business`
   — present but not competing with the customer nav.
8. **Popular cities** — reuse `SRI_LANKA_LOCATIONS` from
   `src/lib/sri-lanka-locations.ts`.
9. **Footer** — already built (`site-footer.tsx`), no change needed.

### Task 7.2 — Routing changes
1. Move `src/app/customer/page.tsx`'s content into `src/app/page.tsx` (the
   real root route). Make `/customer` a thin redirect to `/` for old links,
   not the reverse.
2. Swap `SiteHeader` for `CustomerHeader` at the root layout level for `/` —
   `CustomerHeader` (`src/components/customer/customer-header.tsx`) is
   already minimal (logo, Login, a small "For business" link), it just needs
   to be the one used on `/`.
3. Update every internal link that currently points at `/customer` as "the
   marketplace" (nav, footer, onboarding success redirects) to `/`.
4. Check `src/middleware.ts` for any role-based routing logic assuming `/` is
   the marketing page and `/customer` is the app — update accordingly.

### Task 7.3 — Move the landing page into About
1. Move `(marketing)/page.tsx`'s content (hero, business types, features,
   roadmap) into `src/app/about/page.tsx` — check what's already there first
   and merge rather than overwrite.
2. Delete or redirect the old `(marketing)/page.tsx` route once `/` points at
   the marketplace — don't leave two pages competing for `/`.
3. Update anchor links that assumed the landing page was at `/` —
   `/#business-types` and `/#features` become `/about#business-types` and
   `/about#features` wherever they're referenced (check
   `customer-header.tsx` and any other nav component).
4. `site-footer.tsx` already links "About ADNAVRA" → `/about` — no change
   needed there.

### Verify
Visiting `/` shows the marketplace with the minimal header, not the old
landing page. `/about` shows the former landing page content. Old links to
`/customer` still work (redirect). Anchor links to business types/features
land on the right section of `/about`, not a blank homepage.

---

## Step 8 — Confirm the business (salon) login stays a quiet, separate entry point
Checked `customer-header.tsx` — it already has a small "For business" link
(→ `/for-business`), separate from the customer login link, and the owner
flow at `/login` and `/signup` is already structurally distinct from
`/customer/login` and `/customer/signup`. This mostly already matches what
you asked for. Only change needed:
1. Confirm `/for-business` still has a clear path to `/login` for salons who
   already have an account (not just `/signup` for new ones) — check that
   page's CTAs.
2. No changes needed to `(auth)/login`, `(auth)/signup`,
   `customer/login`, or `customer/signup` themselves.

### Verify
From the new homepage, the only way to reach the salon owner flow should be
the small "For business" link — no prominent "Sign up" competing with it in
the main header.

---

## Step 9 — Admin screen to actually assign a plan to a business
Checked this directly: `src/app/admin/subscriptions/page.tsx` is a one-line
placeholder (`"Admin Subscriptions (Task 4.2)"`), and there is no API route
anywhere under `src/app/api/` that updates a `Subscription` row's `plan`.
Today a business is auto-created at `STARTER` on onboarding and nothing ever
moves it after that except a developer manually editing the database. Since
there's no payment gateway integrated yet, the realistic flow for now is
manual: the salon pays outside the platform, someone on your team changes
their plan here.

### Task 9.1 — API route
New file `src/app/api/admin/businesses/[id]/subscription/route.ts`:
```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { plan, status } = await req.json();
  const allowedPlans = ["STARTER", "PROFESSIONAL", "PREMIUM"];
  if (!allowedPlans.includes(plan)) {
    return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  }
  const updated = await db.subscription.update({
    where: { businessId: params.id },
    data: {
      plan,
      ...(status ? { status } : {}),
      currentPeriodStart: new Date(),
    },
  });
  // Keep marketplacePriority in sync with Premium (Step 6.4)
  await db.business.update({
    where: { id: params.id },
    data: { marketplacePriority: plan === "PREMIUM" },
  });
  // Reuse whatever audit-log helper already exists in src/lib/auth.ts for auth events
  // auditLog({ actorId: session.user.id, action: "subscription.update", targetId: params.id, meta: { plan } });
  return NextResponse.json({ data: updated });
}
```
(Check `SubscriptionStatus` enum in `prisma/schema.prisma` for the exact
allowed values if you pass `status` too.)

### Task 9.2 — Admin UI
Replace `src/app/admin/subscriptions/page.tsx`'s placeholder with a real
table: every business, its current plan/status, a `<select>` to change the
plan, a save button calling the route above. Match the list-view styling
already established in `src/app/admin/businesses/page.tsx` rather than
inventing new table CSS.

### Verify
As ADMIN, change a test business from Starter to Premium in the new screen.
Log in as that business's owner and confirm every Premium-gated dashboard
section unblocks immediately, and its marketplace card shows the "Featured"
badge from Step 6 with no other change needed.

---

## Step 10 — Final login/workflow verification checklist
Static code review can't catch everything a real click-through does — once
the above is built and running, go through this:
- [ ] Salon owner: sign up at `/signup` → lands in `/dashboard/onboarding` →
      complete it → lands on `/dashboard`.
- [ ] Salon owner: log out, log back in at `/login`, session restores
      correctly, lands on `/dashboard` (not onboarding again).
- [ ] Staff member: create one from `/dashboard/team/members`, confirm they
      can log in and see a correctly scoped dashboard (their own
      bookings/schedule, not full owner settings).
- [ ] Customer: sign up at `/customer/signup`, lands somewhere sensible (not
      a salon dashboard).
- [ ] Customer: complete a booking end to end after Step 4 — blocked at
      confirm until signed in, returns to the same step afterward.
- [ ] Admin: confirm there's a working way to reach `/admin` (no separate
      `/admin/login` page exists today — admins appear to use the same
      `/login` form, since the role check is in the database, not the
      route). Confirm this is intentional.
- [ ] Cross-role: log in as Salon A staff, confirm you cannot reach Salon B's
      bookings/customers/dashboard by editing a URL.
- [ ] Click every button on every dashboard page once — Step 2 covered the
      four confirmed-dead ones, but do a full pass in case there are others
      this review didn't catch on pages with more complex interactions
      (modals, bulk actions).

---

## Suggested order of work
1. Step 1 (global header bugs) — fast, unblocks accurate testing of anything
   location-related.
2. Step 2 (dead buttons) and Step 3 (remove nearby-venues) — small, isolated,
   do these while Step 1 is being verified.
3. Step 4 (require login before booking) — self-contained.
4. Step 5 (working search box) — self-contained, needed before Step 7's
   homepage can actually demo real search.
5. Step 6 (salon types + premium badge) — depends on Step 5 existing so the
   badge/tags have somewhere to render meaningfully, but can be built in
   parallel.
6. Step 7 (homepage/About restructure) — do this after 5 and 6 so the new
   homepage launches with working search and real badges, not placeholders.
7. Step 8 (verify the quiet business-login entry) — quick check, any time.
8. Step 9 (admin plan-assignment screen) — independent, any time.
9. Step 10 — run through this checklist at the very end.
