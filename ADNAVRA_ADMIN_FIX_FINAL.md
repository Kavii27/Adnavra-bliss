# ADNAVRA BLISS — Admin Console Fix Plan (FINAL, merged)

## How to use this document

This is the single, final task list your coding agent should follow —
built by reconciling two independently written fix plans
(`ADNAVRA_ADMIN_FIX_TASKS.md` and `ADMIN_CONSOLE_FIX_PLAN.md`) against each
other and against the actual repository, then adding one more critical fix
(Phase 12, shared treatment images) that neither of those two covered.
Work through the phases **in order** — several later phases depend on
data-model or file changes made in earlier ones.

Every phase below shows real, verbatim "current code" quoted from the
codebase, followed by the complete replacement code — never a description
of a change. **Before editing any file, open it and compare it to the
"Current code" block shown.** The two source documents were each written
after directly reading the live repository, and where they quoted the same
file, they matched byte-for-byte (this was checked) — so the code below is
trustworthy. But some time may have passed since either was written, so if
what you find in the file differs even slightly from what's quoted, do not
force the exact diff — re-read the surrounding function, apply the same
fix intent shown in "New code", and keep going. Never skip a phase because
the exact line couldn't be found; find the equivalent line instead.

## Reconciliation notes — how the two source documents disagreed, and what was kept

Both documents agreed on almost everything, which is a strong sign both are
accurate: the ToggleSwitch bug, the two-parallel-subscription-systems root
cause, the boosting dropdown/eligibility bug, the businesses list reading
the wrong (legacy) plan field, and the missing Opening Hours tab were all
independently found by both, with matching or near-matching code. Where
they differed, here is what was kept and why:

1. **ToggleSwitch fix.** One document rebuilt it with CSS Grid for layout
   isolation; the other reset the button's native browser chrome
   (`appearance: none`, `border: none`, `padding: 0`) as inline styles,
   which is the more likely actual root cause (a default button padding/
   border the Tailwind classes weren't fully overriding). **Phase 2 below
   uses both together** — the button-chrome reset as the real fix, plus the
   grid layout as a second, independent layer that makes the label
   physically unable to overlap the switch even if some other CSS issue
   shows up later.

2. **The old `Subscription` model.** One document flagged something
   important the other didn't check: the *old* `Subscription`
   (STARTER/PROFESSIONAL/PREMIUM) system is not dead code — 21 files call
   `requirePlanFeature()`, which reads that exact model to gate real
   dashboard features (staff seat limits, gift cards, memberships,
   products, stock orders, timesheets). **Do not remove or stop writing to
   it.** Every phase below that touches subscriptions keeps both systems
   alive and in sync, never deletes the old one.

3. **Wiring plan/boost status into what customers actually see.** One
   document correctly found that boosting a salon or upgrading its plan
   has zero visible effect on the marketplace, and proposed fixing it by
   writing a brand-new ranking calculation directly inside
   `marketplace-venues.ts`. That would have created a **second, competing
   ranking system** running alongside one that already exists in this
   codebase (`src/lib/ranking.ts` + `src/lib/ranking-service.ts`,
   already used by `/api/marketplace/search`) — two different formulas for
   "how visible should this salon be" is a guaranteed source of future
   bugs. **Phase 7 below fixes this the correct way: by reusing the
   existing ranking engine inside `marketplace-venues.ts`, not duplicating
   it.** This is a real gap neither source document fully closed — the
   existing ranking engine currently only reaches the dedicated
   `/customer/search` page, not the homepage rails, category pages, or
   salon-type pages, which all go through `marketplace-venues.ts` instead.

4. **Forced password change.** Only one document actually built this (a
   `mustChangePassword` flag + a forced change-password screen); the other
   only verified that plain login works. Both are included below — Phase
   10 keeps the one real implementation, simplified to drop an uncertain
   Next.js-version-dependent code path in favor of the version guaranteed
   to work on any version.

5. **The shared treatment-image system (your new critical fix).** Neither
   document touched this at all — it's added fresh as **Phase 12**, based
   on reading the actual image-resolution code, manifest, and files on
   disk.

---
# PHASE 1 — Admin layout: stop pages stretching edge-to-edge on wide screens

**File:** `src/app/admin/layout.tsx`

**Why:** every admin page (Subscription Plans, Salon Subscriptions, Boosts,
Advertisements, Businesses) is wrapped in one shared container. If that
container has no max-width, a 3-card grid or a data table that only needs
about 1200px stretches across a 2000px+ monitor, which reads as "blank
space" / "doesn't fit the screen" on several screens at once. **Check this
file first before doing anything else** — if a previous fix round already
added a `max-w-*` here, skip this phase entirely.

**Current code** (near the bottom of the file):
```tsx
<div className="w-full px-4 py-6 sm:px-8 sm:py-8">{children}</div>
```

**New code:**
```tsx
<div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-8 sm:py-8">{children}</div>
```

That's the entire change. `mx-auto` centers the content once it hits the
1400px cap; `max-w-[1400px]` leaves the Salon Subscriptions and Businesses
tables plenty of room without needing to scroll on a normal laptop screen.

**Verify:** open `/admin/subscription-plans` on a screen 1600px wide or
wider — the cards should sit inside a centered 1400px column with visible
margins on both sides, not stretched edge to edge. Confirm the same on
`/admin/salon-subscriptions` and `/admin/businesses`.

---
# PHASE 2 — Rebuild ToggleSwitch so the knob can never overlap its label

**Screens affected:** Subscription Plans (`/admin/subscription-plans`),
Advertisements (`/admin/advertisements`), the "Create an advertisement"
form.

**File:** `src/components/admin/toggle-switch.tsx`

## Why this happens

Confirmed as a bug in the component itself, not a layout squeeze: the same
broken rendering (the switch's knob spilling onto the first letter of the
label — "Active" reads as "·ctive") appears even on `advertisement-card.tsx`
and `new-advertisement-form.tsx`, both of which render only **one**
`ToggleSwitch` with nothing competing for space next to it. This is the
current, real content of the file:

```tsx
"use client";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  dark?: boolean;
};

export function ToggleSwitch({ checked, onChange, disabled, label, dark }: Props) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          checked ? "bg-[#c9a26d]" : dark ? "bg-white/20" : "bg-[#E3E8F0]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
      <span className={`text-xs font-medium ${dark ? "text-[#faf6ef]/90" : "text-[#3a2f22]"}`}>{label}</span>
    </label>
  );
}
```

The `<button>` has no reset of its native browser chrome (default padding,
border, `appearance`), which is the most likely reason it renders wider
than its intended 36×20px box in the shipped build — and the sizing/travel
distance is set only through Tailwind utility classes with no fallback, so
a single dropped class (a purge issue, a stale build) makes the knob
mis-sized with nothing to catch it.

## The fix — replace the whole file

This combines both defenses instead of picking one: the button's native
chrome is fully neutralized with inline styles (the actual likely root
cause), **and** the outer label uses a fixed-width CSS Grid column instead
of `inline-flex` (so even if some other CSS issue ever reappears, the label
text physically cannot render inside the switch's column).

```tsx
"use client";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  dark?: boolean;
};

// Fixed pixel geometry, defined once, used both for computing the knob's
// travel distance and as inline-style fallbacks below. Never rely on
// Tailwind utility classes alone for a component this small — a single
// dropped class is exactly what caused the original bug.
const TRACK_WIDTH = 36; // px
const TRACK_HEIGHT = 20; // px
const KNOB_SIZE = 16; // px
const KNOB_INSET = 2; // px

export function ToggleSwitch({ checked, onChange, disabled, label, dark }: Props) {
  const knobTravel = TRACK_WIDTH - KNOB_SIZE - KNOB_INSET * 2; // px the knob moves when checked

  return (
    <label className="grid w-full cursor-pointer grid-cols-[36px_1fr] items-center gap-x-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        style={{
          width: TRACK_WIDTH,
          height: TRACK_HEIGHT,
          minWidth: TRACK_WIDTH,
          padding: 0,
          margin: 0,
          border: "none",
          outline: "none",
          appearance: "none",
          WebkitAppearance: "none",
          lineHeight: 0,
        }}
        className={`relative inline-block shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "bg-[#c9a26d]" : dark ? "bg-white/20" : "bg-[#E3E8F0]"
        }`}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: KNOB_INSET,
            left: KNOB_INSET,
            width: KNOB_SIZE,
            height: KNOB_SIZE,
            borderRadius: 9999,
            background: "#ffffff",
            boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
            transform: `translateX(${checked ? knobTravel : 0}px)`,
            transition: "transform 150ms ease",
            pointerEvents: "none",
          }}
        />
      </button>
      <span className={`text-xs font-medium leading-tight ${dark ? "text-[#faf6ef]/90" : "text-[#3a2f22]"}`}>
        {label}
      </span>
    </label>
  );
}
```

What each part is doing:
- `style={{ width, height, minWidth, padding: 0, margin: 0, border: "none", appearance: "none", ... }}` on the `<button>` strips every default browser button style that could otherwise make it render wider than 36×20px — this is the actual fix for the overlap.
- `knobTravel` is computed from the same three constants instead of a hand-typed Tailwind arbitrary value (`translate-x-[18px]`), so the math can never drift out of sync with the track/knob sizes again.
- The outer `<label>` is `grid grid-cols-[36px_1fr]` instead of `inline-flex` — column 1 is a hard 36px, column 2 (`1fr`) is the label's own space. CSS Grid enforces this as a hard boundary; there's no code path where column 2's content renders inside column 1.
- The prop signature (`checked`, `onChange`, `disabled`, `label`, `dark`) is unchanged, so none of its three call sites need edits: `src/components/admin/subscription-plan-card.tsx`, `src/components/admin/advertisement-card.tsx`, `src/components/admin/new-advertisement-form.tsx`.

The database wiring behind these toggles (`isActive`, `isFeaturedEligible`,
`isPriorityEligible` on `SubscriptionPlan`, and `isActive` on
`Advertisement`) was already confirmed correct — both
`src/app/api/admin/subscription-plans/[id]/route.ts` and
`src/app/api/admin/advertisements/[id]/route.ts` already persist these
booleans via Prisma. No backend change is needed for the toggles
themselves, only this one component.

## Rule out a stale build cache making this worse

Since dependencies get reinstalled after unzipping, also clear any stale
`.next` build cache before testing this fix, so you're never looking at a
mixed set of old/new compiled chunks:
```bash
rm -rf .next
npm install
npm run dev
```

## Verify

Go to `/admin/subscription-plans`. All three toggles (Active,
Featured-eligible, Priority-eligible) on every plan card should show the
full label text with no overlap, at every width from 375px to full
desktop. Go to `/admin/advertisements` and confirm the single "Enabled"
toggle on both the creation form and each existing ad card also renders
correctly. Click a few toggles and confirm the Save button still becomes
enabled (dirty-state tracking in `subscription-plan-card.tsx` is untouched
by this fix).

---
# PHASE 3 — Subscription Plans page: confirm and lock in


**File:** `src/app/admin/subscription-plans/page.tsx`,
`src/components/admin/subscription-plan-card.tsx`,
`src/components/admin/new-subscription-plan-form.tsx`

After Phase 1, this page is functionally complete — do not rebuild it. Here
is what to verify (all of this already works against the real database, it
was not a placeholder):

1. `SubscriptionPlanCard` PATCHes `/api/admin/subscription-plans/[id]`,
   which validates with `updateSubscriptionPlanSchema` (check
   `src/schemas/subscriptionPlan.ts`) and writes straight to
   `SubscriptionPlan` via `db.subscriptionPlan.update`. Confirmed real.
2. `NewSubscriptionPlanForm` POSTs to `/api/admin/subscription-plans`,
   which creates a new row with sensible defaults, per the code comment
   under "Add a new plan". Confirmed real.
3. Every field you edit (`boostsPerWeek`, `maxBoostHours`, `galleryLimit`,
   `serviceLimit`, `searchWeight`, `isFeaturedEligible`,
   `isPriorityEligible`) is read live by:
   - `src/lib/boosting.ts` / `src/lib/boosting-service.ts` — boost
     frequency and duration (Phase 6).
   - `src/lib/ranking.ts` / `src/lib/ranking-service.ts` — search weight,
     featured/priority eligibility (Phase 8's ad placements do not use
     this, but the marketplace search ranking does — this is already
     wired, verified by reading `rankBusinessIds()` in
     `src/lib/ranking-service.ts`).
   - `Business` gallery/service limits are enforced wherever
     `galleryLimit`/`serviceLimit` are read — search for
     `plan.galleryLimit` and `plan.serviceLimit` in
     `src/app/api/businesses/[id]/images/route.ts` and
     `src/app/api/services/route.ts` to confirm the limits are actually
     enforced server-side, not just cosmetic. If either route does **not**
     reference `businessSubscription.plan.galleryLimit` /
     `.serviceLimit` when accepting a new image/service, add the check:

```ts
// inside the POST handler, before creating the image/service row
const sub = await db.businessSubscription.findUnique({
  where: { businessId },
  include: { plan: true },
});
if (sub?.plan.galleryLimit != null) {
  const count = await db.businessImage.count({ where: { businessId, kind: "gallery" } });
  if (count >= sub.plan.galleryLimit) {
    return NextResponse.json(
      { error: `Your plan allows up to ${sub.plan.galleryLimit} gallery photos.` },
      { status: 403 },
    );
  }
}
```

Nothing else to change here. Test after Phase 1: rename "Gold" to
something else, change its `searchWeight` to `5`, save, reload the page —
the value must persist.

---

# PHASE 4 — Rename the two subscription screens so the split is clear (do not delete either)

## Why

Per reconciliation note 2: `/admin/subscriptions` (old, STARTER / PROFESSIONAL /
PREMIUM) drives dashboard feature access via `requirePlanFeature()`, and
`/admin/salon-subscriptions` (new, Silver / Gold / Platinum) drives
marketplace visibility. Both are live and both matter — this phase only
relabels the two screens so an admin looking at the console home
understands the difference at a glance, which is what's actually confusing
about the current naming. **Nothing here deletes or disables the old
system.**

## The fix

Open `src/app/admin/page.tsx`. Find the `navCards` array and change these
two entries (this can run before or after Phase 12 adds its own new entry
to the same array — they touch different entries).

**Current code:**
```tsx
    {
      href: "/admin/salon-subscriptions",
      icon: Crown,
      title: "Salon Subscriptions",
      description: "View every salon's plan, assign/change it, set start-end dates, and enable or disable it.",
    },
```
**New code:**
```tsx
    {
      href: "/admin/salon-subscriptions",
      icon: Crown,
      title: "Marketplace Plans (Silver / Gold / Platinum)",
      description: "Controls search ranking, featured placement, and boost allowance. Assign, change, or disable per salon.",
    },
```

**Current code:**
```tsx
    {
      href: "/admin/subscriptions",
      icon: Crown,
      title: "Subscriptions (legacy)",
      description: "The old Starter/Professional/Premium system — being replaced by Salon Subscriptions above.",
    },
```
**New code:**
```tsx
    {
      href: "/admin/subscriptions",
      icon: Crown,
      title: "Feature Plans (Starter / Professional / Premium)",
      description: "Controls which dashboard features a salon can use: staff limits, gift cards, memberships, products. Unrelated to marketplace visibility above.",
    },
```

Next, open `src/app/admin/salon-subscriptions/page.tsx` and find this exact
on-page heading:
```tsx
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[#3a2f22]">Salon Subscriptions</h1>
          <p className="mt-0.5 text-sm text-[#a89880]">
            Assign a plan to each salon, change it, set start/end dates, and enable or disable it. Boosted salons are
            flagged below.
          </p>
```
Replace it with:
```tsx
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[#3a2f22]">Marketplace Plans</h1>
          <p className="mt-0.5 text-sm text-[#a89880]">
            Silver, Gold, Platinum: controls a salon&apos;s search ranking, featured placement, and boost allowance on the
            public site. This is separate from the Feature Plans that control dashboard access. Boosted salons are
            flagged below.
          </p>
```

Finally, open `src/app/admin/subscriptions/page.tsx`, search for the text
`"Assign a plan to each business"` to find the existing description
paragraph (it may appear twice — once in an error fallback, once in the
normal render; update **both** copies to the same new text) and replace it
with:
```tsx
        <p className="mt-1 text-sm text-[#a89880]">
          Controls which dashboard features each salon can use (staff limits, gift cards, memberships, products).
          This is separate from Marketplace Plans, which control search ranking and featured placement on the public
          site.
        </p>
```

## Verify

Open `/admin`. The console home should now show two clearly different card
titles and descriptions for the two plan systems, with no card labeled
"legacy." Open both pages and confirm the on-page headings match the new
names.

---
# PHASE 5 — Salon Subscriptions page: sorting, layout, consistent inputs

**Screen:** `/admin/salon-subscriptions` (image 2)

**Files:**
`src/app/admin/salon-subscriptions/page.tsx`
`src/components/admin/salon-subscription-row.tsx`

### Problems confirmed

1. **No sort control**, and the default order is alphabetical by name
   (`orderBy: { name: "asc" }`), not newest-to-oldest as requested.
2. **The table is a fixed `min-w-[720px]` table inside `overflow-x-auto`.**
   On a wide screen this produces the ragged, half-empty look in the
   screenshot: the "Assign / change" column has to fit 4 controls
   (plan select, status select, 2 date inputs) plus a Save button in a
   cramped `flex flex-wrap` row, while the rest of the table sits far to
   the left with wasted space to the right. This needs a layout rebuild,
   not just wider columns.
3. **Native `<input type="date">`** is used here, while the Advertisements
   card (`advertisement-card.tsx`) uses the app's own `DatePickerModal`.
   Two different date-picking UIs on two admin screens is inconsistent —
   switch this row to the same `DatePickerModal` component.
4. Every salon must show up here (confirmed already true — the query is
   `db.business.findMany()` with no filter — this part was NOT broken),
   and saving must create the `BusinessSubscription` row if one doesn't
   exist yet (confirmed already true, see the `upsert` in
   `src/app/api/admin/businesses/[id]/business-subscription/route.ts`).
   Nothing to fix in the save workflow itself.

### Fix 5.1 — sorting

Replace the `page.tsx` business query and add a sort control.

**Current code** (`src/app/admin/salon-subscriptions/page.tsx`):

```tsx
export default async function SalonSubscriptionsPage() {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    notFound();
  }

  let businesses: { id: string; name: string; slug: string; city: string | null }[] = [];
  let subscriptions: SubscriptionWithPlan[] = [];
  let plans: Awaited<ReturnType<typeof db.subscriptionPlan.findMany>> = [];
  let boostedIds = new Set<string>();
  let loadError = false;

  try {
    const [businessRows, subscriptionRows, planRows, activeBoosts] = await Promise.all([
      db.business.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, city: true } }),
      db.businessSubscription.findMany({ include: { plan: true } }),
      db.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { rank: "asc" } }),
      getActiveBoosts(),
    ]);
```

**New code** — change the function signature to accept `searchParams`, add
a `sort` param, and change the `orderBy`:

```tsx
type SortOption = "newest" | "oldest" | "name_asc" | "name_desc";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  name_asc: "Name (A–Z)",
  name_desc: "Name (Z–A)",
};

function resolveOrderBy(sort: SortOption): Prisma.BusinessOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "name_asc":
      return { name: "asc" };
    case "name_desc":
      return { name: "desc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

export default async function SalonSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    notFound();
  }

  const { sort: sortParam } = await searchParams;
  const sort: SortOption =
    sortParam === "oldest" || sortParam === "name_asc" || sortParam === "name_desc" ? sortParam : "newest";

  let businesses: { id: string; name: string; slug: string; city: string | null; createdAt: Date }[] = [];
  let subscriptions: SubscriptionWithPlan[] = [];
  let plans: Awaited<ReturnType<typeof db.subscriptionPlan.findMany>> = [];
  let boostedIds = new Set<string>();
  let loadError = false;

  try {
    const [businessRows, subscriptionRows, planRows, activeBoosts] = await Promise.all([
      db.business.findMany({
        orderBy: resolveOrderBy(sort),
        select: { id: true, name: true, slug: true, city: true, createdAt: true },
      }),
      db.businessSubscription.findMany({ include: { plan: true } }),
      db.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { rank: "asc" } }),
      getActiveBoosts(),
    ]);
```

Add the sort dropdown to the header (right under the page title, above the
table). Insert this JSX right before the `{loadError ? (` block:

```tsx
      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[#a89880]">
          {businesses.length} salon{businesses.length === 1 ? "" : "s"}
        </p>
        <form className="flex items-center gap-2" action="/admin/salon-subscriptions" method="GET">
          <label htmlFor="salon-sort" className="text-xs font-semibold uppercase tracking-wide text-[#a89880]">
            Sort
          </label>
          <select
            id="salon-sort"
            name="sort"
            defaultValue={sort}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="h-9 rounded-md border border-[#E3E8F0] bg-white px-2.5 text-sm font-medium text-[#3a2f22] outline-none focus:border-[#c9a26d]"
          >
            {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([value, labelText]) => (
              <option key={value} value={value}>
                {labelText}
              </option>
            ))}
          </select>
        </form>
      </div>
```

This form works with **no client JS required at all** (plain GET form
submit), and the `onChange` handler makes it auto-submit without a manual
"Apply" click. Also add the import at the top:

```tsx
import type { Prisma } from "@prisma/client";
```

(It's likely already imported for `Prisma.BusinessSubscriptionGetPayload`
— just confirm `Prisma` is imported once, not twice.)

### Fix 5.2 — layout: stop using a `<table>`, use a responsive card grid

Replace the whole `<table>...</table>` block with a grid of cards, one per
salon, so each row gets its own full-width space for the 4 controls
instead of squeezing them sideways. This is the same pattern already used
successfully on the Subscription Plans and Advertisements pages
(`grid gap-4 md:grid-cols-2 xl:grid-cols-3`), so re-use it here for visual
consistency and to remove the horizontal scrollbar entirely.

**Replace this** (the whole table markup, from
`<div className="mt-8 overflow-x-auto ...">` down to the closing `</div>`
right before the final `)}`):

```tsx
        <div className="mt-8 overflow-x-auto rounded-2xl border border-[#E3E8F0] bg-white shadow-[0_1px_2px_rgba(58,47,34,0.04)]">
          <table className="w-full min-w-[720px] text-left text-sm">
            {/* ... thead / tbody ... */}
          </table>
        </div>
```

**With this:**

```tsx
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {businesses.map((b) => {
            const sub = subscriptionByBusiness.get(b.id);
            const isExpired = Boolean(sub?.endDate && new Date(sub.endDate).getTime() <= Date.now());
            const displayLabel = sub
              ? isExpired
                ? "Expired"
                : sub.status.charAt(0) + sub.status.slice(1).toLowerCase()
              : null;
            const badgeClass = isExpired
              ? "bg-[#E7ECF2] text-[#4A4640]"
              : sub?.status === "ACTIVE"
                ? "bg-[#DCF5E7] text-[#15803D]"
                : sub?.status === "SUSPENDED"
                  ? "bg-[#FDECD8] text-[#B45309]"
                  : "bg-[#FDECEC] text-[#B91C1C]";

            return (
              <div
                key={b.id}
                className="flex flex-col gap-3 rounded-2xl border border-[#E3E8F0] bg-white p-5 shadow-[0_1px_2px_rgba(58,47,34,0.04)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[#3a2f22]">{b.name}</p>
                    <p className="mt-0.5 truncate text-xs text-[#a89880]">
                      /{b.slug}
                      {b.city ? ` • ${b.city}` : ""}
                    </p>
                  </div>
                  {boostedIds.has(b.id) && (
                    <span className="shrink-0 rounded-full bg-[#c9a26d] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#3a2f22]">
                      Boosted now
                    </span>
                  )}
                </div>

                {sub ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-[#EAF3F2] px-2 py-0.5 text-[11px] font-semibold text-[#3a2f22]">
                      {sub.plan.name}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass}`}>
                      {displayLabel}
                    </span>
                    <span className="text-[11px] text-[#a89880]">
                      Since {new Date(sub.startDate).toLocaleDateString()}
                      {sub.endDate ? ` · ends ${new Date(sub.endDate).toLocaleDateString()}` : ""}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-[#a89880]">No plan assigned</span>
                )}

                <div className="mt-1 border-t border-[#E3E8F0] pt-3">
                  <SalonSubscriptionRow
                    businessId={b.id}
                    plans={plans.map((p) => ({ key: p.key, name: p.name }))}
                    initialPlanKey={sub?.plan.key ?? plans[0]?.key ?? ""}
                    initialStatus={sub?.status ?? "ACTIVE"}
                    initialStartDate={sub?.startDate ? new Date(sub.startDate).toISOString().slice(0, 10) : ""}
                    initialEndDate={sub?.endDate ? new Date(sub.endDate).toISOString().slice(0, 10) : ""}
                    hasSubscription={Boolean(sub)}
                  />
                </div>
              </div>
            );
          })}
        </div>
```

This removes the horizontal scrollbar, fills the available width evenly
(2 columns on tablet, 3 on desktop, matching the layout already used on
the other two admin pages), and puts each salon's controls in their own
vertical space where a date picker button and two dropdowns comfortably
fit on one line without wrapping oddly.

### Fix 5.3 — use `DatePickerModal` instead of native date inputs

**File:** `src/components/admin/salon-subscription-row.tsx`

**Current code:**

```tsx
        <input
          type="date"
          aria-label="Start date"
          value={startDate}
          disabled={saving}
          onChange={(e) => {
            setStartDate(e.target.value);
            setSaved(false);
          }}
          className={inputClass}
        />
        <input
          type="date"
          aria-label="End date"
          value={endDate}
          disabled={saving}
          onChange={(e) => {
            setEndDate(e.target.value);
            setSaved(false);
          }}
          className={inputClass}
        />
```

**New code** — add the import at the top of the file:

```tsx
import { DatePickerModal, fromISODate, toISODate } from "@/components/shared/date-picker-modal";
import { Calendar } from "lucide-react";
```

Add local state for which field is open (put this next to the other
`useState` calls):

```tsx
  const [dateField, setDateField] = useState<"start" | "end" | null>(null);
```

Replace the two `<input type="date">` elements with:

```tsx
        <button
          type="button"
          aria-label="Start date"
          disabled={saving}
          onClick={() => setDateField("start")}
          className={`${inputClass} flex items-center gap-1.5 text-left`}
        >
          <Calendar className="h-3.5 w-3.5 shrink-0 text-[#a89880]" />
          <span className="truncate">
            {startDate ? fromISODate(startDate)?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Start date"}
          </span>
        </button>
        <button
          type="button"
          aria-label="End date"
          disabled={saving}
          onClick={() => setDateField("end")}
          className={`${inputClass} flex items-center gap-1.5 text-left`}
        >
          <Calendar className="h-3.5 w-3.5 shrink-0 text-[#a89880]" />
          <span className="truncate">
            {endDate ? fromISODate(endDate)?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "No end date"}
          </span>
        </button>
```

And add the modal itself right before the closing `</div>` of the
component's returned JSX (after the error message block):

```tsx
      <DatePickerModal
        open={dateField !== null}
        onClose={() => setDateField(null)}
        value={fromISODate(dateField === "end" ? endDate : startDate)}
        minDate={dateField === "end" ? fromISODate(startDate) : null}
        onSelect={(d) => {
          if (dateField === "end") setEndDate(toISODate(d));
          else setStartDate(toISODate(d));
          setSaved(false);
        }}
      />
```

This makes the start/end date pickers on this page visually identical to
the ones already used on the Advertisements card, closing the UI
consistency gap. The `handleSave` function does not need to change — it
already reads `startDate`/`endDate` from state regardless of how they got
set.

Save/re-test: change a salon's plan, set start/end dates via the calendar
popup, hit Save — the change must survive a page reload (confirms the
`upsert` PATCH route from the root cause summary at the top of this document is doing its job).

---

# PHASE 6 — Salon Boosting: show every salon, allow boosting without a paid plan

**Screen:** `/admin/boosts`

**Files:**
`src/app/admin/boosts/page.tsx`
`src/lib/boosting-service.ts`
`src/components/admin/manual-boost-form.tsx`

## The bug, precisely

`src/app/admin/boosts/page.tsx`'s dropdown source:
```tsx
async function fetchBoostableBusinesses() {
  const subs = await db.businessSubscription.findMany({
    where: { status: "ACTIVE", OR: [{ endDate: null }, { endDate: { gt: new Date() } }] },
    include: { business: { select: { id: true, name: true, slug: true } } },
  });
  return subs.map((s) => s.business).sort((a, b) => a.name.localeCompare(b.name));
}
```
This only returns businesses that already have an **active**
`BusinessSubscription` row — per the two-parallel-systems root cause
(reconciliation note 2), that's only a small handful of demo/assigned
salons; everything else is invisible in this dropdown.

`createBoost()` in `src/lib/boosting-service.ts` also **throws** if the
target business has no subscription, which would block a manual boost even
after the dropdown is fixed:
```ts
export async function createBoost(params: {
  businessId: string;
  source: "AUTO" | "MANUAL";
  createdByUserId?: string | null;
  now?: Date;
}) {
  const now = params.now ?? new Date();

  const subscription = await db.businessSubscription.findUnique({
    where: { businessId: params.businessId },
    include: { plan: true },
  });
  const expired = subscription?.endDate ? subscription.endDate.getTime() <= now.getTime() : false;
  if (!subscription || subscription.status !== "ACTIVE" || expired) {
    throw new Error("Business has no active subscription");
  }

  const recentBoosts = (await getRecentBoosts(params.businessId, now)).map(toBoostRecord);

  // Manual admin boosts bypass the weekly-limit check (admins can always
  // override), but automatic boosts must respect the plan's configured cap.
  if (params.source === "AUTO" && !canBoost(subscription.plan, recentBoosts, now)) {
    throw new Error("Business has reached its plan's weekly boost limit");
  }

  const { startAt, endAt } = computeBoostWindow(subscription.plan, now);

  return db.salonBoost.create({
    data: {
      businessId: params.businessId,
      source: params.source,
      startAt,
      endAt,
      createdByUserId: params.createdByUserId ?? null,
    },
  });
}
```

Fix both. **Automatic** (`AUTO`) boosts — the fair-rotation cron job —
should keep requiring an active, boost-eligible plan; that part of the
design is correct, the rotation must only pick paying/eligible salons.
**Manual** (`MANUAL`) admin boosts should work on any salon, with a
sensible default duration when there's no plan to read `maxBoostHours`
from.

## Fix 5.1 — `src/lib/boosting-service.ts`

Replace the `createBoost` function:
```ts
// Used when a business has no active BusinessSubscription and an admin
// manually boosts it anyway — gives it a plain 24-hour window instead of
// reading a plan that doesn't exist.
const DEFAULT_MANUAL_BOOST_HOURS = 24;

export async function createBoost(params: {
  businessId: string;
  source: "AUTO" | "MANUAL";
  createdByUserId?: string | null;
  now?: Date;
}) {
  const now = params.now ?? new Date();

  const business = await db.business.findUnique({ where: { id: params.businessId }, select: { id: true } });
  if (!business) {
    throw new Error("Business not found");
  }

  const subscription = await db.businessSubscription.findUnique({
    where: { businessId: params.businessId },
    include: { plan: true },
  });
  const expired = subscription?.endDate ? subscription.endDate.getTime() <= now.getTime() : false;
  const hasActiveSubscription = Boolean(subscription && subscription.status === "ACTIVE" && !expired);

  // AUTO boosts (the fair-rotation cron job) must only ever pick up
  // salons with a real, active, boost-eligible plan — this branch is
  // unchanged from before.
  if (params.source === "AUTO") {
    if (!hasActiveSubscription) {
      throw new Error("Business has no active subscription");
    }
    const recentBoosts = (await getRecentBoosts(params.businessId, now)).map(toBoostRecord);
    if (!canBoost(subscription!.plan, recentBoosts, now)) {
      throw new Error("Business has reached its plan's weekly boost limit");
    }
    const { startAt, endAt } = computeBoostWindow(subscription!.plan, now);
    return db.salonBoost.create({
      data: { businessId: params.businessId, source: "AUTO", startAt, endAt, createdByUserId: null },
    });
  }

  // MANUAL admin boosts: any salon on the platform can be boosted,
  // subscription or not. Bypasses the weekly-limit check entirely (an
  // admin override is always allowed). Uses the salon's own plan duration
  // when it has one, otherwise falls back to a flat 24-hour window.
  const { startAt, endAt } = hasActiveSubscription
    ? computeBoostWindow(subscription!.plan, now)
    : computeBoostWindow({ boostsPerWeek: 0, maxBoostHours: DEFAULT_MANUAL_BOOST_HOURS }, now);

  return db.salonBoost.create({
    data: {
      businessId: params.businessId,
      source: "MANUAL",
      startAt,
      endAt,
      createdByUserId: params.createdByUserId ?? null,
    },
  });
}
```
No other function in this file needs to change — `runAutoBoostCycle()`
already only ever calls `createBoost({ source: "AUTO" })` on subscriptions
it already filtered to `status: "ACTIVE"`, so it's unaffected.

## Fix 5.2 — `src/app/admin/boosts/page.tsx`

Replace `fetchBoostableBusinesses`:
```tsx
async function fetchBoostableBusinesses() {
  // Every salon on the platform can be manually boosted by an admin —
  // subscription status only matters for the AUTO rotation cron, not for
  // this manual override form. See lib/boosting-service.ts createBoost().
  return db.business.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}
```

## Fix 5.3 — `src/components/admin/manual-boost-form.tsx`

The empty-state copy currently says a plan is required — that's no longer
true:

**Current code:**
```tsx
  if (businesses.length === 0) {
    return (
      <p className="text-xs text-[#a89880]">
        No salon has an active subscription right now — assign a plan first on the Salon Subscriptions screen.
      </p>
    );
  }
```

**New code:**
```tsx
  if (businesses.length === 0) {
    return <p className="text-xs text-[#a89880]">No salons on the platform yet — add one first.</p>;
  }
```
Everything else in that component (the fetch to `POST /api/admin/boosts`,
the select, the button) is unchanged.

## Verify

Open `/admin/boosts`. The dropdown should now list every salon on the
platform, including ones with no plan assigned. Pick one with no plan,
click Boost now, confirm it succeeds and appears in "Active boosts" with a
24-hour window. Confirm cancelling it (the existing `DELETE
/api/admin/boosts/[id]` route) moves it into History as Cancelled. Then
continue to Phase 7, which is what makes this boost actually change
anything a customer sees.

---
# PHASE 7 — Make boosts and plan toggles actually change what a customer sees

This is the phase that makes Phase 3's Featured-eligible/Priority-eligible
toggles and Phase 6's boosting do something real, everywhere, not just on
the dedicated search page. Without this, boosting a salon or upgrading its
plan changes database rows and nothing else.

## Why this happens

There are actually **two** customer-facing salon-listing code paths in
this app, and only one of them uses real ranking:

1. `src/app/api/marketplace/search/route.ts` — the dedicated search page.
   This one is already correct: it calls `rankBusinessIds()` from
   `src/lib/ranking-service.ts`, which reads `BusinessSubscription`,
   `SalonBoost`, and the admin-configurable `ranking_weights`
   `PlatformSetting`, and produces a real, weighted score. **Do not touch
   this file or the ranking engine it calls — it already works.**
2. `src/lib/marketplace-venues.ts` — used by the homepage rails
   ("Recommended", "Near you", "New"), category pages, and salon-type
   pages. This one does a plain query ordered only by `createdAt`, and only
   reads the old plain `Business.marketplacePriority` boolean for its
   `featured` flag:
   ```ts
   const businesses = await db.business.findMany({
     where,
     orderBy: { createdAt: order },
     take,
     skip,
     select: {
       id: true, name: true, slug: true, logoUrl: true, address: true, city: true,
       categories: true, salonTypes: true, marketplacePriority: true,
       services: { where: { isActive: true }, select: { category: true, price: true } },
     },
   });
   // ...
   featured: b.marketplacePriority,
   ```
   It never joins to `BusinessSubscription`, never reads `SalonBoost`, and
   never calls the ranking engine. **This is the actual reason boosting and
   plan-toggle changes are invisible on the homepage and category pages.**

The fix is to make `marketplace-venues.ts` re-rank its results using the
**same, already-existing** `rankBusinessIds()` — not a second,
independently-written scoring formula. Two different ranking formulas in
the same app (one for search, one for everything else) would make "why is
this salon above that one" impossible to answer consistently later.

## The fix — `src/lib/marketplace-venues.ts`

Replace the whole file:
```ts
import { db } from "@/lib/db";
import { rankBusinessIds } from "@/lib/ranking-service";

export type Venue = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  category: string | null;
  categories: string[];
  salonTypes: string[];
  featured: boolean;
  boosted: boolean; // NEW — true while an active SalonBoost is running
  fromPriceMinor: number | null;
};

function mostCommonCategory(categories: (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const c of categories) {
    if (!c) continue;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [k, v] of counts) {
    if (v > bestCount) {
      best = k;
      bestCount = v;
    }
  }
  return best;
}

type WhereClause = NonNullable<Parameters<typeof db.business.findMany>[0]>["where"];

// How many extra candidate rows to pull beyond what was actually requested,
// so boosted/featured salons that are NOT the most recently created can
// still be correctly ranked to the top after re-scoring. At the current
// scale (tens to low hundreds of salons) this comfortably covers the whole
// table in one query. If the salon count grows into the thousands, this
// should move to a database-side ranked query instead of ranking in JS.
const CANDIDATE_POOL_CAP = 500;

async function fetchVenuesWhere(
  where: WhereClause,
  order: "asc" | "desc",
  take: number,
  skip = 0,
): Promise<Venue[]> {
  try {
    // Pull a wider candidate pool than requested so re-ranking (below) can
    // promote a boosted/high-plan salon to the top even if it isn't among
    // the most recently created rows within just `take`.
    const poolSize = Math.min(CANDIDATE_POOL_CAP, Math.max(take + skip, take * 4));

    const businesses = await db.business.findMany({
      where,
      orderBy: { createdAt: order },
      take: poolSize,
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        address: true,
        city: true,
        categories: true,
        salonTypes: true,
        marketplacePriority: true,
        services: {
          where: { isActive: true },
          select: { category: true, price: true },
        },
      },
    });

    if (businesses.length === 0) return [];

    // Re-rank the candidate pool with the SAME engine the search page
    // uses — no distance data here (these lists aren't location-scoped),
    // so distanceKm is null for every entry and distanceWeight has no
    // effect, which is the correct behavior for "Recommended"/category/
    // salon-type lists.
    const distanceById = new Map<string, number | null>(businesses.map((b) => [b.id, null]));
    const ranked = await rankBusinessIds(
      businesses.map((b) => b.id),
      distanceById,
    );

    const byId = new Map(businesses.map((b) => [b.id, b]));
    const orderedIds = [...ranked.keys()];
    // rankBusinessIds returns every id it was given, so this covers the
    // whole pool; slice AFTER ranking, not before, so ranking can actually
    // change who ends up in the visible page.
    const page = orderedIds.slice(skip, skip + take);

    return page.map((id) => {
      const b = byId.get(id)!;
      const svcCategories = b.services.map((s) => s.category);
      const primary = mostCommonCategory(svcCategories) ?? b.categories[0] ?? null;
      const prices = b.services.map((s) => s.price).filter((p): p is number => typeof p === "number");
      const fromPriceMinor = prices.length > 0 ? Math.min(...prices) : null;
      const rank = ranked.get(id);
      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        logoUrl: b.logoUrl,
        address: b.address,
        city: b.city,
        category: primary,
        categories: b.categories,
        salonTypes: b.salonTypes ?? [],
        // "Featured" is true from EITHER the plain manual flag OR the
        // salon's plan being featured-eligible — either should show the
        // Featured badge, per the original design intent of both fields.
        featured: b.marketplacePriority || Boolean(rank?.planKey && rank.planKey !== "silver"),
        boosted: Boolean(rank?.isBoosted),
        fromPriceMinor,
      };
    });
  } catch {
    return [];
  }
}

/** Plain, unfiltered venue fetch (used by "Recommended", "Near you", "New"). */
export async function fetchVenues(order: "asc" | "desc", take: number, skip = 0): Promise<Venue[]> {
  return fetchVenuesWhere(undefined, order, take, skip);
}

/**
 * Every business tagged with the given category or salon-type slug, or that
 * has at least one active service in that category — same matching rules
 * used by the marketplace search API.
 */
export async function fetchVenuesByCategory(slug: string, take = 200): Promise<Venue[]> {
  return fetchVenuesWhere(
    {
      OR: [
        { categories: { has: slug } },
        { salonTypes: { has: slug } },
        { services: { some: { category: slug, isActive: true } } },
      ],
    },
    "desc",
    take,
  );
}

export async function fetchCategoryCounts(): Promise<Record<string, number>> {
  try {
    const rows = await db.service.groupBy({
      by: ["category"],
      where: { isActive: true, category: { not: null } },
      _count: { _all: true },
    });
    const map: Record<string, number> = {};
    for (const r of rows) {
      if (r.category) map[r.category] = r._count._all;
    }
    return map;
  } catch {
    return {};
  }
}
```

Notes on what changed and why:
- The only new import is `rankBusinessIds` from the **existing**
  `src/lib/ranking-service.ts` — nothing about that file changes.
  `mostCommonCategory`, `fetchVenuesByCategory`, `fetchCategoryCounts`, and
  the exported `Venue` fields your components already read are all still
  there under the same names, so no caller needs to change — except any
  component that renders a "Boosted" badge should now also read the new
  `boosted` field (see below).
- Ranking is applied to a **candidate pool** (up to `CANDIDATE_POOL_CAP`),
  then paginated with `skip`/`take` **after** ranking — this is what lets a
  boosted-but-older salon actually move up in the list instead of only
  affecting salons that were already going to appear.
- The `try { ... } catch { return [] }` at the top level is preserved from
  the original file — this is pre-existing behavior (it's also what makes
  a malformed query silently return zero results elsewhere in the app;
  that's a separate, already-known issue and out of scope here, not
  something this phase introduces).

## Add a "Boosted" badge to public salon cards

Wherever a salon card component renders the `Venue.featured` badge (search
your components for where `venue.featured` or `v.featured` is used —
likely `src/components/customer/home/venue-grid.tsx` or a shared
`VenueCard`), add a boosted badge next to it:
```tsx
{venue.boosted && (
  <span className="inline-flex items-center rounded-full bg-[#FDF0DA] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9A6B2A]">
    Boosted
  </span>
)}
```

## Verify

Boost a salon that has no subscription (from Phase 6) and reload the
homepage — it should now appear noticeably higher in "Recommended" than
before, with a "Boosted" badge. Turn on Featured-eligible for a plan on
`/admin/subscription-plans`, assign that plan to a salon on
`/admin/salon-subscriptions`, and confirm that salon now shows the
Featured badge on the homepage and on its category page, not only in
`/customer/search`.

---
# PHASE 8 — Advertisements & Homepage Banner: make banners actually show up on the site

**Screens affected:** Advertisements (`/admin/advertisements`, image 4),
Homepage Banner (`/admin/homepage`, image 5).

### 5.1 — Fix the homepage banner's broken link

**File:** `src/app/page.tsx` (the call site) and
`src/components/customer/home/ad-banner.tsx` (the component).

The admin form at `/admin/homepage` lets you set a "Destination link", but
the homepage never receives or uses it.

**Current code**, `src/components/customer/home/ad-banner.tsx`:

```tsx
export async function AdBanner({
  imageUrl = "/banner.jpg",
  alt,
}: {
  imageUrl?: string | null;
  alt?: string;
}) {
  const t = await getServerT();
  const resolvedAlt = alt ?? t("venue.adAlt");
  if (!imageUrl) return null;
  return (
    <section className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-6 lg:px-12">
      <div className="block overflow-hidden rounded-xl border border-[#E5DDD0] shadow-[0_4px_16px_rgba(31,30,29,0.08)] sm:rounded-2xl">
        <Image
          src={imageUrl}
          alt={resolvedAlt}
          width={2752}
          height={1420}
          priority
          sizes="100vw"
          className="h-auto w-full sm:hidden"
        />
        <div className="relative hidden w-full bg-[#F1E9DC] sm:block sm:aspect-[17/9] lg:aspect-[14/3]">
          <Image src={imageUrl} alt={resolvedAlt} fill priority className="object-cover [object-position:center_calc(50%+10px)]" sizes="100vw" />
        </div>
      </div>
    </section>
  );
}
```

**New code** — accept and use `href`:

```tsx
import Link from "next/link";

export async function AdBanner({
  imageUrl = "/banner.jpg",
  href,
  alt,
}: {
  imageUrl?: string | null;
  href?: string | null;
  alt?: string;
}) {
  const t = await getServerT();
  const resolvedAlt = alt ?? t("venue.adAlt");
  if (!imageUrl) return null;

  const isExternal = Boolean(href && !href.startsWith("/"));
  const content = (
    <div className="block overflow-hidden rounded-xl border border-[#E5DDD0] shadow-[0_4px_16px_rgba(31,30,29,0.08)] sm:rounded-2xl">
      <Image
        src={imageUrl}
        alt={resolvedAlt}
        width={2752}
        height={1420}
        priority
        sizes="100vw"
        className="h-auto w-full sm:hidden"
      />
      <div className="relative hidden w-full bg-[#F1E9DC] sm:block sm:aspect-[17/9] lg:aspect-[14/3]">
        <Image src={imageUrl} alt={resolvedAlt} fill priority className="object-cover [object-position:center_calc(50%+10px)]" sizes="100vw" />
      </div>
    </div>
  );

  return (
    <section className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-6 lg:px-12">
      {href ? (
        isExternal ? (
          <a href={href} target="_blank" rel="noreferrer" aria-label={resolvedAlt}>
            {content}
          </a>
        ) : (
          <Link href={href} aria-label={resolvedAlt}>
            {content}
          </Link>
        )
      ) : (
        content
      )}
    </section>
  );
}
```

**Current code**, `src/app/page.tsx` (call site):

```tsx
        <AdBanner imageUrl={banner?.imageUrl} />
```

**New code:**

```tsx
        <AdBanner imageUrl={banner?.imageUrl} href={banner?.destinationUrl} />
```

Test: set the homepage banner's destination to `/for-business`, save on
`/admin/homepage`, reload `/`, click the banner — it must navigate to
`/for-business`. Set it to an external `https://` URL and confirm it opens
in a new tab.

### 5.2 — Build the missing public ad component

**New file:** `src/components/marketplace/ad-slot.tsx`

This is the piece that makes every ad you create in
`/admin/advertisements` actually visible somewhere. It calls the existing,
already-correct public API (`GET /api/marketplace/ads?placement=...`),
renders whichever ad(s) come back, and posts a click event through the
existing `POST /api/marketplace/ads/[id]/click` route. Both endpoints
already exist and work — verified in `src/lib/ads-service.ts` — this
component is the only thing missing.

```tsx
"use client";

import { useEffect, useState } from "react";

type Ad = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  destinationUrl: string;
};

/**
 * Renders whatever live ad(s) the admin has scheduled for `placement`
 * (see AdvertisementPlacement.key — homepage_top, homepage_middle,
 * search_results, category_page, city_page, salon_profile, booking_page).
 * Fetches from the existing public /api/marketplace/ads route, which
 * already handles scheduling, priority rotation, and impression logging
 * server-side. Renders nothing if there is no live ad for this slot, so
 * it is always safe to drop into a page unconditionally.
 */
export function AdSlot({ placement, className }: { placement: string; className?: string }) {
  const [ads, setAds] = useState<Ad[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/marketplace/ads?placement=${encodeURIComponent(placement)}`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json: { data?: Ad[] }) => {
        if (!cancelled) setAds(json.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setAds([]);
      });
    return () => {
      cancelled = true;
    };
  }, [placement]);

  if (!ads || ads.length === 0) return null;

  return (
    <div className={className ?? "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-12"}>
      <div className={`grid gap-4 ${ads.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {ads.map((ad) => (
          <a
            key={ad.id}
            href={ad.destinationUrl}
            target={ad.destinationUrl.startsWith("/") ? undefined : "_blank"}
            rel={ad.destinationUrl.startsWith("/") ? undefined : "noreferrer"}
            onClick={() => {
              // Fire-and-forget — never block navigation on this.
              fetch(`/api/marketplace/ads/${ad.id}/click`, { method: "POST" }).catch(() => {});
            }}
            className="group block overflow-hidden rounded-2xl border border-[#E5DDD0] shadow-[0_2px_10px_rgba(31,30,29,0.06)] transition hover:shadow-[0_8px_24px_rgba(31,30,29,0.12)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="h-auto w-full object-cover transition duration-300 group-hover:scale-[1.01]"
            />
          </a>
        ))}
      </div>
    </div>
  );
}
```

### 5.3 — Wire `AdSlot` into every placement that already exists in the
database

Seeded placements (`scripts/seed-subscriptions.mjs`): `homepage_top`,
`homepage_middle`, `search_results`, `category_page`, `city_page`,
`salon_profile`, `booking_page`. Mount one `<AdSlot placement="...">` per
key, at the matching page:

**`src/app/page.tsx`** (homepage) — `homepage_top` goes right after the
hero/search section, `homepage_middle` further down between two rails.
Add the import:

```tsx
import { AdSlot } from "@/components/marketplace/ad-slot";
```

Directly under the closing of the hero `<section>` (right after the
`</section>` that follows the search bar block), add:

```tsx
        <div className="pt-6">
          <AdSlot placement="homepage_top" />
        </div>
```

Find a natural break roughly in the middle of the page (for example, right
between the `VenueRailRow` for "Recommended" and the `BrowseByCategory`
section — look for where those components are rendered one after another)
and add:

```tsx
        <div className="py-6">
          <AdSlot placement="homepage_middle" />
        </div>
```

**`src/app/customer/search/page.tsx`** — add near the top of the results
list, above the first result card:

```tsx
import { AdSlot } from "@/components/marketplace/ad-slot";
// ...
<AdSlot placement="search_results" className="mb-4" />
```

**`src/app/categories/[slug]/page.tsx`** — same pattern, above the grid of
salons for that category:

```tsx
import { AdSlot } from "@/components/marketplace/ad-slot";
// ...
<AdSlot placement="category_page" className="mb-4" />
```

**`src/app/locations/page.tsx`** — this is the city-listing page (`city_page`
placement):

```tsx
import { AdSlot } from "@/components/marketplace/ad-slot";
// ...
<AdSlot placement="city_page" className="mb-4" />
```

**`src/app/[businessSlug]/page.tsx`** (salon public profile) —
`salon_profile` placement, placed under the hero/header, above the
services list:

```tsx
import { AdSlot } from "@/components/marketplace/ad-slot";
// ...
<AdSlot placement="salon_profile" className="my-4" />
```

**`src/app/[businessSlug]/book/page.tsx`** — `booking_page` placement (this
is literally the placement named "Booking Page Banner" already visible in
the admin dropdown in image 4), place it above the service selection step:

```tsx
import { AdSlot } from "@/components/marketplace/ad-slot";
// ...
<AdSlot placement="booking_page" className="mb-4" />
```

For each of the six pages above: open the file, find the outermost
returned JSX, and insert the snippet at the described position — the exact
line number will differ slightly depending on other work already in
progress in this repo, so match by the nearby markers named (hero section,
results grid, services list, etc.) rather than a line number.

After wiring: go to `/admin/advertisements`, create a new ad targeting
"Homepage Top Banner" with a start date of today and an end date next
month, upload an image, set it Enabled, save. Reload `/` and confirm the
banner appears under the hero. Click it and confirm it navigates to the
destination URL. Reload `/admin/advertisements` and confirm "views" went
up by at least 1 for that ad (impression tracking already works, this just
confirms the wiring end to end).

### 5.4 — Let admins create a new placement from the UI, not curl

Right now, `NewAdvertisementForm` only shows placements that already exist
in the database, and the page's own comment says "create one via the API
... first" when none exist. Since there is already a `POST
/api/admin/advertisement-placements` route that works correctly, just add
a small inline form to create a placement from the page.

**New file:** `src/components/admin/new-placement-form.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Plus } from "lucide-react";

const inputClass =
  "h-9 rounded-lg border border-[#E3E8F0] bg-white px-2.5 text-sm text-[#3a2f22] outline-none focus:border-[#c9a26d] disabled:opacity-50";

/** Slugify a display name into a stable machine key, e.g. "Sidebar Banner" -> "sidebar_banner". */
function toKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function NewPlacementForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [maxActiveAds, setMaxActiveAds] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    const key = toKey(name);
    if (!key) {
      setError("Give the placement a name first.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/advertisement-placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, name: name.trim(), maxActiveAds }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Failed to create placement");
      setName("");
      setMaxActiveAds(1);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create placement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-[#c9a26d]/40 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#a89880]">Add a new banner placement</p>
      <p className="mt-1 text-xs text-[#a89880]">
        A placement is a slot on the site (e.g. "Sidebar Banner"). Create it here, then it appears in the
        Placement dropdown above.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          className={inputClass}
          placeholder="Placement name, e.g. Sidebar Banner"
          value={name}
          disabled={saving}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          min={1}
          className={`${inputClass} w-28`}
          value={maxActiveAds}
          disabled={saving}
          onChange={(e) => setMaxActiveAds(Math.max(1, Number(e.target.value)))}
          aria-label="Max concurrent ads in this slot"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={saving || !name.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#3a2f22_0%,#8a6d4f_100%)] px-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Add placement
        </button>
      </div>
      {name.trim() && <p className="mt-1.5 text-[11px] text-[#a89880]">Key: {toKey(name)}</p>}
      {error && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#B91C1C]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
```

In `src/app/admin/advertisements/page.tsx`, import it and render it right
above the `NewAdvertisementForm`, inside the same dashed container, and
also render it as the empty-state instead of the plain text:

**Current code:**

```tsx
              {placements.length === 0 ? (
                <p className="text-xs text-[#a89880]">
                  No placements exist yet — create one via the API (POST /api/admin/advertisement-placements) first.
                </p>
              ) : (
                <NewAdvertisementForm placements={placements.map((p) => ({ key: p.key, name: p.name }))} />
              )}
```

**New code:**

```tsx
              <div className="space-y-4">
                <NewPlacementForm />
                {placements.length > 0 && (
                  <NewAdvertisementForm placements={placements.map((p) => ({ key: p.key, name: p.name }))} />
                )}
              </div>
```

Add the import near the top of the file:

```tsx
import { NewPlacementForm } from "@/components/admin/new-placement-form";
```

### 5.5 — Merge Homepage Banner into the Advertisements page

Rather than deleting `/admin/homepage` (which would break the existing
link from `/admin`), turn the Advertisements page into the single home for
all banner management, and make `/admin/homepage` a thin redirect so old
bookmarks still work.

**File:** `src/app/admin/advertisements/page.tsx`

Add the homepage banner manager as a section at the very top of this page,
above "Create an advertisement":

```tsx
import { HomepageBannerManager } from "@/components/admin/homepage-banner-manager";
import { getHomepageBannerSetting } from "@/lib/platform-settings";
import type { HomepageBannerSetting } from "@/schemas/platformSettings";
```

Inside the page component, load the setting alongside the other data:

```tsx
  let homepageBanner: HomepageBannerSetting | null = null;
  try {
    homepageBanner = (await getHomepageBannerSetting()).banner;
  } catch {
    // non-fatal — the rest of the page still renders
  }
```

Then, right after the page header and before the `{loadError ? (` block,
add:

```tsx
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-[#3a2f22]">Homepage hero banner</h2>
        <p className="mt-0.5 text-xs text-[#a89880]">
          The single large image at the very top of the homepage — separate from the rotating placement banners
          below.
        </p>
        <div className="mt-3">
          {homepageBanner ? (
            <HomepageBannerManager initialSetting={homepageBanner} />
          ) : (
            <p className="text-xs text-[#B91C1C]">Could not load the homepage banner setting.</p>
          )}
        </div>
      </div>
```

**File:** `src/app/admin/homepage/page.tsx` — replace its entire contents
with a redirect:

```tsx
import { redirect } from "next/navigation";

export default function AdminHomepageRedirect() {
  redirect("/admin/advertisements");
}
```

**File:** `src/app/admin/page.tsx` — remove the now-redundant nav card so
the console isn't listing the same destination twice:

**Current code:**

```tsx
    {
      href: "/admin/advertisements",
      icon: Megaphone,
      title: "Advertisements",
      description: "Create banner ads with image upload, schedule them, and track impressions/clicks.",
    },
    {
      href: "/admin/homepage",
      icon: LayoutTemplate,
      title: "Homepage Banner",
      description: "Update the live homepage banner image and its destination without a code deploy.",
    },
```

**New code:**

```tsx
    {
      href: "/admin/advertisements",
      icon: Megaphone,
      title: "Advertisements & Banners",
      description: "Update the homepage hero banner and create scheduled ads for every placement on the site.",
    },
```

Remove the now-unused `LayoutTemplate` import from that file if it's not
referenced elsewhere in it.

Test: open `/admin/advertisements` — you should see, top to bottom: the
Homepage hero banner editor with its live preview, then "Create an
advertisement" (with the new "Add a new banner placement" mini-form above
it), then Active/Scheduled/Expired campaigns. Open `/admin/homepage`
directly — it should immediately redirect you to `/admin/advertisements`.

---

# PHASE 9 — Businesses page: correct plan display, sorting, delete, stay in sync

**Screen:** `/admin/businesses` (images 6 and 7 — these are the same
screenshot uploaded twice; there is nothing different to build for
"image 7", treat it as a duplicate of image 6).

**Files:**
`src/app/admin/businesses/page.tsx`
`src/app/api/admin/businesses/route.ts`
**New:** `src/app/api/admin/businesses/[id]/route.ts` (DELETE)
`src/components/admin/admin-businesses-search.tsx`

### Fix 9.1 — show the real (new-system) plan, not the legacy one

**Current code**, `src/app/admin/businesses/page.tsx` (query):

```tsx
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        createdAt: true,
        subscription: { select: { plan: true, status: true } },
        users: {
          where: { role: "OWNER" },
          select: { email: true },
          take: 3,
        },
      },
```

**New code:**

```tsx
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        createdAt: true,
        businessSubscription: { select: { status: true, plan: { select: { name: true } } } },
        users: {
          where: { role: "OWNER" },
          select: { email: true },
          take: 3,
        },
      },
```

**Current code** (table cell):

```tsx
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-[#E7ECF2] px-2 py-0.5 text-[11px] font-semibold text-[#3a2f22]">
                      {b.subscription ? b.subscription.plan.charAt(0) + b.subscription.plan.slice(1).toLowerCase() : "No plan"}
                    </span>
                  </td>
```

**New code:**

```tsx
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-[#E7ECF2] px-2 py-0.5 text-[11px] font-semibold text-[#3a2f22]">
                      {b.businessSubscription ? b.businessSubscription.plan.name : "No plan"}
                    </span>
                  </td>
```

Also update `src/app/admin/businesses/[id]/page.tsx`'s subtitle line the
same way (it currently reads `business.subscription`):

**Current code:**

```tsx
    subscription: { select: { plan: true, status: true } },
```
```tsx
            {business.subscription
              ? `${business.subscription.plan.charAt(0) + business.subscription.plan.slice(1).toLowerCase()} (${business.subscription.status.charAt(0) + business.subscription.status.slice(1).toLowerCase()})`
              : "No plan"}
```

**New code:**

```tsx
    businessSubscription: { select: { status: true, plan: { select: { name: true } } } },
```
```tsx
            {business.businessSubscription
              ? `${business.businessSubscription.plan.name} (${business.businessSubscription.status.charAt(0) + business.businessSubscription.status.slice(1).toLowerCase()})`
              : "No plan"}
```

### Fix 9.2 — give every newly created salon a starting `BusinessSubscription`
row, so the two systems never disagree again

**File:** `src/app/api/admin/businesses/route.ts`

**Current code** (inside the `db.$transaction`):

```ts
    await tx.subscription.create({
      data: { businessId: business.id, plan: "STARTER", status: "ACTIVE" },
    });
```

**New code** — keep the legacy row (other, not-yet-migrated parts of the
app such as `/admin/subscriptions` and the marketplace search's
`marketplacePriority` fallback still read it) but also create a real
`BusinessSubscription` pointed at the lowest-rank active plan so the salon
shows up correctly everywhere immediately:

```ts
    await tx.subscription.create({
      data: { businessId: business.id, plan: "STARTER", status: "ACTIVE" },
    });

    // Also seed the NEW subscription system so this salon appears with a
    // real plan on /admin/salon-subscriptions and /admin/businesses
    // immediately, instead of "No plan assigned" until an admin manually
    // assigns one. Picks whatever active plan has the lowest rank
    // (normally "Silver") as the default starter tier.
    const defaultPlan = await tx.subscriptionPlan.findFirst({
      where: { isActive: true },
      orderBy: { rank: "asc" },
    });
    if (defaultPlan) {
      await tx.businessSubscription.create({
        data: { businessId: business.id, planId: defaultPlan.id, status: "ACTIVE" },
      });
    }
```

This makes every future salon consistent from the moment it's created —
you will not need to manually go assign it a plan just to make it show up
correctly on the Businesses list or be eligible for auto-boosting.

> Note: this does not retroactively fix the 18 salons already in your data
> that have no `BusinessSubscription`. Run this one-off script once, after
> deploying the change above, to backfill them:

**New file:** `scripts/backfill-business-subscriptions.mjs`

```js
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const defaultPlan = await db.subscriptionPlan.findFirst({
    where: { isActive: true },
    orderBy: { rank: "asc" },
  });
  if (!defaultPlan) {
    console.error("No active subscription plan found — create one on /admin/subscription-plans first.");
    process.exit(1);
  }

  const missing = await db.business.findMany({
    where: { businessSubscription: null },
    select: { id: true, name: true },
  });

  for (const b of missing) {
    await db.businessSubscription.create({
      data: { businessId: b.id, planId: defaultPlan.id, status: "ACTIVE" },
    });
    console.log(`Assigned ${defaultPlan.name} to ${b.name}`);
  }

  console.log(`Done. ${missing.length} salon(s) updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
```

Run it once with:

```bash
node scripts/backfill-business-subscriptions.mjs
```

### Fix 9.3 — sort control on the Businesses list

The list already orders by `createdAt: "desc"` (newest first — this part
was already correct, matching the request), but there is no visible way to
change it. Add the same sort pattern used in Phase 5.

**File:** `src/app/admin/businesses/page.tsx`

**Current code:**

```tsx
export default async function AdminBusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
```

**New code:**

```tsx
type SortOption = "newest" | "oldest" | "name_asc" | "name_desc";

function resolveOrderBy(sort: SortOption): Prisma.BusinessOrderByWithRelationInput {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "name_asc":
      return { name: "asc" };
    case "name_desc":
      return { name: "desc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

export default async function AdminBusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; sort?: string }>;
}) {
```

Add the import `import type { Prisma } from "@prisma/client";` at the top.
Then destructure and use it:

```tsx
  const { q, page: pageParam, sort: sortParam } = await searchParams;
  const sort: SortOption =
    sortParam === "oldest" || sortParam === "name_asc" || sortParam === "name_desc" ? sortParam : "newest";
```

And in the `db.business.findMany` call, change:

```tsx
      orderBy: { createdAt: "desc" },
```

to:

```tsx
      orderBy: resolveOrderBy(sort),
```

Add a sort `<select>` next to the search box. In the JSX, change:

```tsx
      <div className="mt-6">
        <Suspense>
          <AdminBusinessesSearch initialQuery={query} />
        </Suspense>
      </div>
```

to:

```tsx
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Suspense>
          <AdminBusinessesSearch initialQuery={query} />
        </Suspense>
        <Suspense>
          <AdminBusinessesSort initialSort={sort} />
        </Suspense>
      </div>
```

**New file:** `src/components/admin/admin-businesses-sort.tsx`

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "name_desc", label: "Name (Z–A)" },
];

export function AdminBusinessesSort({ initialSort }: { initialSort: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function apply(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", next);
    params.delete("page");
    router.replace(`/admin/businesses?${params.toString()}`);
  }

  return (
    <select
      defaultValue={initialSort}
      onChange={(e) => apply(e.target.value)}
      aria-label="Sort businesses"
      className="h-10 rounded-md border border-[#E3E8F0] bg-white px-3 text-sm font-medium text-[#3a2f22] outline-none focus:border-[#8a6d4f]"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
```

Add the import to `page.tsx`:

```tsx
import { AdminBusinessesSort } from "@/components/admin/admin-businesses-sort";
```

### Fix 9.4 — delete salon button + confirmation

**New file:** `src/app/api/admin/businesses/[id]/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { auditLog, getAuditIp } from "@/lib/audit";

function getClientIp(request: NextRequest): string {
  const f = request.headers.get("x-forwarded-for");
  if (f) return f.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * DELETE /api/admin/businesses/[id]
 * ADMIN only. Permanently removes a salon and everything tied to it
 * (services, bookings, staff, images, subscriptions, boosts, sales
 * history, etc.) via the ON DELETE CASCADE relations already defined on
 * every model in prisma/schema.prisma that has a businessId. This does
 * not delete the salon owner's User row's other data (there is none — a
 * User only ever belongs to one business), it deletes the User row too
 * (Business -> users has onDelete: Cascade).
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth().catch(() => null);
  const role = (session?.user as unknown as { role?: string } | undefined)?.role ?? null;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ip = getClientIp(request);
  const rl = await rateLimit(`admin-business-delete:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateLimitHeaders(rl, 10) });
  }

  const business = await db.business.findUnique({ where: { id }, select: { id: true, name: true, slug: true } });
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  await db.business.delete({ where: { id } });

  const actorId = (session.user as unknown as { id: string }).id;
  await auditLog({
    action: "admin.business_delete",
    userId: actorId,
    userEmail: session.user.email ?? null,
    role,
    targetType: "Business",
    targetId: id,
    metadata: { name: business.name, slug: business.slug },
    ip: getAuditIp(request.headers) ?? ip,
  });

  return NextResponse.json({ data: { deleted: true } }, { headers: rateLimitHeaders(rl, 10) });
}
```

This relies on every relevant model in `prisma/schema.prisma` already
declaring `onDelete: Cascade` on its `business` relation (confirmed true
for `services`, `staffMembers`, `customers`, `bookings`, `products`,
`packages`, `promotions`, `suppliers`, `stockOrders`, `stocktakes`,
`giftCards`, `memberships`, `saleRecords`, `shifts`,
`timesheetEntries`, `reviews`, `loyaltyAccounts`, `settings`, `images`,
`businessSubscription`, `salonBoosts`, `subscription`, and `users`), so a
single `db.business.delete()` is sufficient and safe — Postgres will
cascade the rest. No migration needed.

**New file:** `src/components/admin/delete-business-button.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

export function DeleteBusinessButton({ businessId, businessName }: { businessId: string; businessName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}`, { method: "DELETE" });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Failed to delete salon");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete salon");
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <span className="text-[11px] text-[#B91C1C]">Delete {businessName}?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex h-7 items-center gap-1 rounded-md bg-[#B91C1C] px-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40"
        >
          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="inline-flex h-7 items-center rounded-md border border-[#E3E8F0] px-2 text-xs font-medium text-[#3a2f22] hover:bg-[#faf6ef]"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${businessName}`}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#B91C1C] transition hover:bg-[#FDECEC]"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      {error && <p className="text-[10px] font-medium text-[#B91C1C]">{error}</p>}
    </div>
  );
}
```

Add it to the table in `src/app/admin/businesses/page.tsx`. Add a header
cell and a body cell next to the existing "Open" link cell:

**Current code:**

```tsx
                <th scope="col" className="px-4 py-3 font-semibold">
                  <span className="sr-only">Open</span>
                </th>
```

**New code:**

```tsx
                <th scope="col" className="px-4 py-3 font-semibold">
                  <span className="sr-only">Open</span>
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  <span className="sr-only">Delete</span>
                </th>
```

**Current code:**

```tsx
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/businesses/${b.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#8a6d4f] hover:underline"
                    >
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
```

**New code:**

```tsx
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/businesses/${b.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#8a6d4f] hover:underline"
                    >
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteBusinessButton businessId={b.id} businessName={b.name} />
                  </td>
```

Add the import: `import { DeleteBusinessButton } from
"@/components/admin/delete-business-button";`

### Fix 9.5 — "fit to screen"

The table already uses `overflow-x-auto` with `min-w-[720px]`, which is
reasonable given the number of columns, but you can remove the leftover
scrollbar on desktop widths by switching to `table-fixed` with explicit
column widths, the same table-fixed technique used elsewhere in this admin console:

```tsx
      <table className="w-full table-fixed text-left text-sm">
```

with `<th>` widths roughly: Salon `28%`, City `12%`, Plan `12%`, Owner
`24%`, Created `14%`, Open `6%`, Delete `4%`.

---

# PHASE 10 — Business detail page: add the missing "Hours" tab

**Screen:** `/admin/businesses/[id]` (no screenshot supplied, but
confirmed missing by reading the code — only Profile / Services / Photos
tabs exist).

The `Business.openingHours` JSON field already exists in the schema, the
public `PATCH /api/businesses/[id]` route already accepts and persists an
`openingHours` object for **either** the owner or an ADMIN (confirmed by
reading the route's role check — `role !== "ADMIN" && id !== sessionBusinessId`
returns Forbidden, meaning ADMIN always passes), and the public salon page
+ booking availability engine already read it. The only missing piece is
an admin-facing form.

**New file:** `src/components/admin/admin-business-hours-form.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Clock, Loader2 } from "lucide-react";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<(typeof DAYS)[number], string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

type HoursValue = { open: string; close: string; closed: boolean };
type Hours = Record<(typeof DAYS)[number], HoursValue>;

function normalise(raw: unknown): Hours {
  const result = {} as Hours;
  for (const d of DAYS) {
    const v = raw && typeof raw === "object" ? (raw as Record<string, Partial<HoursValue>>)[d] : undefined;
    result[d] = { open: v?.open ?? "09:00", close: v?.close ?? "18:00", closed: v?.closed ?? d === "sunday" };
  }
  return result;
}

export function AdminBusinessHoursForm({ businessId, initialHours }: { businessId: string; initialHours: unknown }) {
  const router = useRouter();
  const [hours, setHours] = useState<Hours>(() => normalise(initialHours));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update(day: (typeof DAYS)[number], patch: Partial<HoursValue>) {
    setHours((h) => ({ ...h, [day]: { ...h[day], ...patch } }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/businesses/${businessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openingHours: hours }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Failed to save opening hours");
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save opening hours");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-[#E3E8F0] bg-white p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-[#3a2f22]">
        <Clock className="h-4 w-4 text-[#8a6d4f]" /> Opening hours
      </h2>
      <p className="mt-1 text-xs text-[#a89880]">Closed days are not bookable on the public page.</p>

      <div className="mt-4 space-y-2">
        {DAYS.map((day) => (
          <div
            key={day}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-[#E3E8F0] bg-[#faf6ef] px-3 py-2.5"
          >
            <span className="w-24 shrink-0 text-sm font-medium text-[#3a2f22]">{DAY_LABELS[day]}</span>
            <label className="flex items-center gap-1.5 text-xs text-[#a89880]">
              <input
                type="checkbox"
                checked={hours[day].closed}
                disabled={saving}
                onChange={(e) => update(day, { closed: e.target.checked })}
              />
              Closed
            </label>
            {!hours[day].closed && (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={hours[day].open}
                  disabled={saving}
                  onChange={(e) => update(day, { open: e.target.value })}
                  className="h-9 rounded-md border border-[#E3E8F0] bg-white px-2 text-sm text-[#3a2f22]"
                />
                <span className="text-xs text-[#a89880]">to</span>
                <input
                  type="time"
                  value={hours[day].close}
                  disabled={saving}
                  onChange={(e) => update(day, { close: e.target.value })}
                  className="h-9 rounded-md border border-[#E3E8F0] bg-white px-2 text-sm text-[#3a2f22]"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#8a6d4f] px-5 text-sm font-semibold text-white transition hover:bg-[#5f4630] disabled:opacity-50"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {saving ? "Saving…" : "Save hours"}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#15803D]">
            <Check className="h-3.5 w-3.5" /> Saved
          </span>
        )}
      </div>
      {error && (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#B91C1C]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
```

**File:** `src/app/admin/businesses/[id]/page.tsx` — add `openingHours` to
the `select`, add the fourth tab card, and render the form.

**Current code:**

```tsx
  const business = await db.business.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      district: true,
      categories: true,
      salonTypes: true,
      subscription: { select: { plan: true, status: true } },
      users: { where: { role: "OWNER" }, select: { email: true, name: true } },
      _count: { select: { services: true, images: true } },
    },
  });
```

**New code:**

```tsx
  const business = await db.business.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      district: true,
      categories: true,
      salonTypes: true,
      openingHours: true,
      businessSubscription: { select: { status: true, plan: { select: { name: true } } } },
      users: { where: { role: "OWNER" }, select: { email: true, name: true } },
      _count: { select: { services: true, images: true } },
    },
  });
```

(Note this also folds in the Phase 9.1 `businessSubscription` fix — update
the header line the same way as shown in Phase 9.1 if you haven't already.)

**Current code** (the 3-card tab row):

```tsx
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[#8a6d4f] bg-white p-4">
          <p className="text-sm font-semibold text-[#3a2f22]">Profile</p>
          <p className="mt-0.5 text-xs text-[#a89880]">Name, contact, address, salon-type tags. Edit below.</p>
        </div>
        <Link
          href={`/admin/businesses/${business.id}/services`}
          className="group rounded-lg border border-[#E3E8F0] bg-white p-4 transition hover:border-[#8a6d4f]"
        >
          {/* Services card */}
        </Link>
        <Link
          href={`/admin/businesses/${business.id}/images`}
          className="group rounded-lg border border-[#E3E8F0] bg-white p-4 transition hover:border-[#8a6d4f]"
        >
          {/* Photos card */}
        </Link>
      </div>
```

**New code** — change the grid to 4 columns and add a fourth "in-page
anchor" card for Hours (since Hours is rendered inline below, same as
Profile, not a separate route):

```tsx
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#8a6d4f] bg-white p-4">
          <p className="text-sm font-semibold text-[#3a2f22]">Profile</p>
          <p className="mt-0.5 text-xs text-[#a89880]">Name, contact, address, salon-type tags. Edit below.</p>
        </div>
        <Link
          href={`/admin/businesses/${business.id}/services`}
          className="group rounded-lg border border-[#E3E8F0] bg-white p-4 transition hover:border-[#8a6d4f]"
        >
          <p className="flex items-center gap-1 text-sm font-semibold text-[#3a2f22]">
            Services
            <ArrowRight className="h-3.5 w-3.5 text-[#a89880] transition group-hover:translate-x-0.5 group-hover:text-[#8a6d4f]" />
          </p>
          <p className="mt-0.5 text-xs text-[#a89880]">
            {business._count.services} service{business._count.services === 1 ? "" : "s"} — add prices on the
            owner&apos;s behalf.
          </p>
        </Link>
        <Link
          href={`/admin/businesses/${business.id}/images`}
          className="group rounded-lg border border-[#E3E8F0] bg-white p-4 transition hover:border-[#8a6d4f]"
        >
          <p className="flex items-center gap-1 text-sm font-semibold text-[#3a2f22]">
            Photos
            <ArrowRight className="h-3.5 w-3.5 text-[#a89880] transition group-hover:translate-x-0.5 group-hover:text-[#8a6d4f]" />
          </p>
          <p className="mt-0.5 text-xs text-[#a89880]">
            {business._count.images} photo{business._count.images === 1 ? "" : "s"} — logo, cover, gallery.
          </p>
        </Link>
        <a
          href="#hours"
          className="group rounded-lg border border-[#E3E8F0] bg-white p-4 transition hover:border-[#8a6d4f]"
        >
          <p className="text-sm font-semibold text-[#3a2f22]">Hours</p>
          <p className="mt-0.5 text-xs text-[#a89880]">Set opening/closing time per day. Edit below.</p>
        </a>
      </div>
```

**Current code** (bottom of the file, after the `AdminBusinessProfileForm`):

```tsx
      <div className="mt-6">
        <AdminBusinessProfileForm
          businessId={business.id}
          initial={{
            /* ... */
          }}
        />
      </div>
    </div>
  );
}
```

**New code:**

```tsx
      <div className="mt-6">
        <AdminBusinessProfileForm
          businessId={business.id}
          initial={{
            name: business.name ?? "",
            slug: business.slug ?? "",
            description: business.description ?? "",
            phone: business.phone ?? "",
            email: business.email ?? "",
            address: business.address ?? "",
            city: business.city ?? "",
            district: business.district ?? "",
            categories: business.categories ?? [],
            salonTypes: business.salonTypes ?? [],
          }}
        />
      </div>

      <div id="hours" className="mt-6 scroll-mt-6">
        <AdminBusinessHoursForm businessId={business.id} initialHours={business.openingHours} />
      </div>
    </div>
  );
}
```

Add the import: `import { AdminBusinessHoursForm } from
"@/components/admin/admin-business-hours-form";`

Test: open any salon's admin detail page, click the "Hours" card (jumps to
the form via the `#hours` anchor), set Tuesday to closed, save, then open
that salon's public page (`/{slug}`) and its booking page
(`/{slug}/book`) and confirm Tuesday is shown as closed / unavailable for
booking (the availability engine at `src/lib/availability.ts` already
reads `openingHours` — confirmed — so no further backend change is
required here).

---

# PHASE 11 — Confirm temp-password login works, and add a visible forced-change step

**Files:** `prisma/schema.prisma`, `src/app/api/admin/businesses/route.ts`,
`src/lib/auth.ts`, **new** `src/app/api/auth/force-change-password/route.ts`,
**new** `src/app/dashboard/change-password/page.tsx`,
`src/app/dashboard/layout.tsx`

## Why this needs confirming, and what's genuinely added

When a salon is created from `/admin/businesses/new`, the server already
generates a random password with `randomBytes(12).toString("base64url")`,
hashes it with the same `hashPassword()` used everywhere else (bcrypt cost
12, `src/lib/password.ts`), and stores it on a new `User` row. The login
form uses the exact same `verifyPassword()` against that hash — there's
nothing salon-specific about login, so a fresh temporary password should
already work today. If it hasn't been working in testing, the most likely
causes are the password being copied with a trailing space (it contains
`-`/`_` characters that are easy to mis-copy), or the owner email having
extra whitespace at creation time.

What's genuinely missing is a way for both the admin and the owner to know
for certain the account is still on a temporary password, enforced rather
than optional. This phase adds that as a real, visible, enforced step.

## Step 1 — add the flag

`prisma/schema.prisma`, in the `User` model, directly under `password`:
```prisma
model User {
  id                 String    @id @default(cuid())
  email              String    @unique
  password           String // bcrypt hash, cost 12, via lib/password.ts only
  mustChangePassword Boolean   @default(false) // true for admin-created accounts until the owner sets their own password
  name               String?
  // ...rest of the model is unchanged
```
```bash
npx prisma migrate dev --name add_must_change_password
```

## Step 2 — set it true when an admin creates a salon

In `src/app/api/admin/businesses/route.ts`, find where the owner `User` row
is created and add `mustChangePassword: true`:
```ts
    const owner = await tx.user.create({
      data: {
        email: ownerEmail,
        password: hashed,
        mustChangePassword: true, // NEW
        name: ownerName,
        role: "OWNER",
        businessId: business.id,
        phone: ownerPhone ?? null,
      },
      select: { id: true, email: true, name: true, role: true, businessId: true },
```

## Step 3 — carry the flag through the session

In `src/lib/auth.ts`:

Find the type augmentation block and add `mustChangePassword` to both
interfaces:
```ts
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      businessId: string | null;
      mustChangePassword: boolean; // NEW
    } & DefaultSession["user"];
  }
  interface User {
    role: string;
    businessId: string | null;
    mustChangePassword: boolean; // NEW
  }
}
```

In `authorize()`, add it to the returned object:
```ts
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          businessId: user.businessId,
          mustChangePassword: user.mustChangePassword, // NEW
        } as unknown as import("next-auth").User;
```

In the `jwt` callback, inside the existing `if (user) { ... }` block that
copies fields onto `token` on initial sign-in, add:
```ts
          (token as Record<string, unknown>).mustChangePassword = Boolean((user as Record<string, unknown>).mustChangePassword);
```

In the `session` callback, right after the existing line that copies
`businessId` onto `session.user`, add:
```ts
        (session.user as unknown as Record<string, unknown>).mustChangePassword = Boolean(
          (token as unknown as Record<string, unknown>).mustChangePassword,
        );
```

## Step 4 — the change-password API route

New file `src/app/api/auth/force-change-password/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { z } from "zod";

const schema = z.object({ newPassword: z.string().min(8).max(200) });

/**
 * PATCH /api/auth/force-change-password
 * Any authenticated user may call this on their own account to clear
 * mustChangePassword. Does not require the current password — the whole
 * point is the current one is a temporary value only the admin who created
 * the account has seen; the session cookie itself is the identity proof
 * here, same trust boundary every other self-service route in this app
 * already relies on.
 */
export async function PATCH(request: NextRequest) {
  const session = await auth().catch(() => null);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const userId = (session.user as unknown as { id: string }).id;
  const hashed = await hashPassword(parsed.data.newPassword);
  await db.user.update({ where: { id: userId }, data: { password: hashed, mustChangePassword: false } });

  return NextResponse.json({ data: { updated: true } });
}
```

## Step 5 — the change-password screen

New file `src/app/dashboard/change-password/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, KeyRound, Loader2 } from "lucide-react";

export default function ForceChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/force-change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Failed to update password");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#faf6ef] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-[#E3E8F0] bg-white p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3F2] text-[#8a6d4f]">
          <KeyRound className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-[#3a2f22]">Set your password</h1>
        <p className="mt-1 text-sm text-[#a89880]">
          Your account was created with a temporary password. Choose your own password to continue.
        </p>
        <div className="mt-5 space-y-3">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (at least 8 characters)"
            className="h-11 w-full rounded-lg border border-[#E3E8F0] px-3 text-sm text-[#3a2f22] outline-none focus:border-[#8a6d4f]"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="h-11 w-full rounded-lg border border-[#E3E8F0] px-3 text-sm text-[#3a2f22] outline-none focus:border-[#8a6d4f]"
          />
        </div>
        {error && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#B91C1C]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#3a2f22_0%,#8a6d4f_100%)] text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {saving ? "Saving..." : "Set password and continue"}
        </button>
      </form>
    </div>
  );
}
```

## Step 6 — enforce it (version-independent method)

In `src/app/dashboard/layout.tsx`, near the top where the session is
already read, add:
```tsx
  const mustChangePassword = Boolean((session.user as unknown as { mustChangePassword?: boolean }).mustChangePassword);
```
Then find where the layout finally renders `{children}` and replace that
render with:
```tsx
      {mustChangePassword ? (
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#faf6ef] px-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#E3E8F0] bg-white p-6 text-center">
            <p className="text-sm text-[#3a2f22]">You need to set your own password before continuing.</p>
            <a href="/dashboard/change-password" className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-[linear-gradient(135deg,#3a2f22_0%,#8a6d4f_100%)] text-sm font-semibold text-white">
              Set password
            </a>
          </div>
        </div>
      ) : (
        children
      )}
```
This works on any Next.js version (it doesn't depend on request-header
internals that vary between versions) and produces the exact result
needed: an owner logging in with a temporary password sees nothing except
a prompt to set their own password until they do. A user who has already
cleared the flag and navigates back to `/dashboard/change-password`
manually just sees a normal page they can leave — no special-casing
needed there.

## Verify

Create a brand-new test salon from `/admin/businesses/new`, copy the
generated temporary password by selecting the field's full text (not
retyping it), open a private browser window, and log in at `/login` with
the owner's email and that password. Confirm login succeeds. Confirm you
are immediately shown the "set your own password" screen and cannot see
the rest of the dashboard until you submit a new password. Set a new
password, confirm you land on the normal dashboard afterward, log out, log
back in with the new password to confirm it was actually saved.

---
# PHASE 12 — CRITICAL FIX: make the shared treatment-image system admin-manageable

## What this system is, in plain terms

Every salon's treatment cards (on its public page, in the service menu) show
a photo. Almost no salon owner uploads their own — so the app was built to
**guess a stock photo for every service name automatically**, and many
salons showing "Haircut" all show the exact same haircut photo, on purpose,
to save owners from ever having to take or upload a picture. This is
working as designed, not a bug — but right now the only way to add, change,
or replace one of those shared photos is for a developer to: put a file in
a specific folder on their own laptop, run a Node script by hand, and then
redeploy — and the person operating this platform day to day currently has
no visibility into it and no way to touch it. That is the actual problem to
fix: **give this an admin screen**, the same way images already work for
salon galleries.

## How it actually works today (read this before changing anything)

**`src/lib/service-images.ts`** (217 lines) is the brain of the system. It
has a hard-coded list of **79 rules**, each one a catalog slug + a category
+ a list of keywords, e.g.:
```ts
{ slug: "haircut", category: "hair-styling", keywords: ["haircut", "hair cut", "trim", "layer cut", "cut"] },
```
When a service card needs a photo, `matchServiceSlug(name, category)`
lowercases the service's name, strips punctuation, and finds the
best-matching rule by keyword (earliest match in the name wins; ties go to
the longer, more specific keyword). That gives a `{ slug, category }` pair.
`resolveServiceImageCandidates()` then builds an ordered list of image URLs
to try:
```ts
export function resolveServiceImageCandidates(
  name: string,
  category: string | null | undefined,
): string[] {
  const candidates: string[] = [];

  const match = matchServiceSlug(name, category);
  if (match && AVAILABLE_SLUGS.has(match.slug)) {
    candidates.push(specificPath(match.category, match.slug));
  }

  const fallbackCategory =
    category && KNOWN_CATEGORIES.has(category) ? category : match?.category ?? null;
  if (fallbackCategory) candidates.push(categoryPath(fallbackCategory));

  candidates.push(DEFAULT_IMAGE);
  return candidates;
}
```
`AVAILABLE_SLUGS` comes from `src/lib/service-images.manifest.json`, a
**static, build-time list** of which of the 79 slugs currently have a real
file on disk. Right now only **15 of the 79 rules** have one:
```json
{
  "available": [
    "body-scrub", "bridal-makeup", "classic-facial", "cleanup",
    "eyebrow-threading", "hair-colour", "haircut", "head-neck-shoulder-massage",
    "lash-extensions", "manicure", "party-makeup", "pedicure",
    "swedish-massage", "threading-face", "waxing-legs"
  ]
}
```
The other 64 rules (e.g. `blow-dry`, `keratin-treatment`, `waxing-bikini`,
`bridal-dressing`, `acne-treatment`...) currently have **no** specific
photo, so every service matching one of those falls all the way back to its
category's generic image (`public/service-images/_category/hair-styling.webp`,
etc. — 8 of these exist, one per category) or, failing that, one shared
`_category/default.webp`.

Adding a new photo today requires: drop a source photo into
`service-images-src/<category>/<slug>.(jpg|png|webp)` on a developer
machine, run `node scripts/optimize-service-images.mjs` (uses `sharp` to
crop to 800×600 and convert to WebP), which writes the output into
`public/service-images/...` **and rewrites `service-images.manifest.json`**
— then commit and redeploy. None of that is available to whoever actually
runs the platform day to day.

The component that renders these, **`src/components/business/service-image.tsx`**,
already has graceful, per-image fallback baked in — if a URL 404s, `onError`
advances to the next candidate in the list, so a missing file never shows a
broken image. This matters for the fix below.

## The real blocker to making this admin-editable: the manifest is baked into the build

`AVAILABLE_SLUGS` is built from a **statically imported JSON file**
(`import manifest from "./service-images.manifest.json"`). In Next.js, a
static JSON import like this is inlined into the compiled server **and**
client bundles at build time. If an admin route wrote a new file to disk and
updated this JSON at runtime, the already-running app (and everyone's
already-loaded browser tab) would keep using the **old**, bundled copy of
`AVAILABLE_SLUGS` until the next full rebuild and deploy. An admin-upload
feature that only takes effect after a developer redeploys is not a real
fix — it would look like it silently didn't work.

**The fix removes this gate entirely, rather than trying to make it update
live.** It isn't needed: `ServiceImage`'s existing `onError` fallback chain
already handles a missing specific-slug file perfectly safely — it just
tries the next candidate. Skipping the specific-image candidate when it
doesn't exist was a minor bandwidth optimization (skip a guaranteed 404),
not a correctness requirement. Removing it costs, at most, one extra failed
image request for a service whose specific photo hasn't been uploaded yet
(the browser resolves this in a few milliseconds and instantly shows the
category fallback instead — not visible to a user), and in exchange, a
newly admin-uploaded photo works **the instant it's uploaded**, with zero
redeploy.

### Fix 12.1 — `src/lib/service-images.ts`: always try the specific image

**Current code** (the two spots that reference the manifest):
```ts
import manifest from "./service-images.manifest.json";
// ...
const AVAILABLE_SLUGS = new Set<string>(manifest.available);
// ...
export function resolveServiceImageCandidates(
  name: string,
  category: string | null | undefined,
): string[] {
  const candidates: string[] = [];

  const match = matchServiceSlug(name, category);
  if (match && AVAILABLE_SLUGS.has(match.slug)) {
    candidates.push(specificPath(match.category, match.slug));
  }

  const fallbackCategory =
    category && KNOWN_CATEGORIES.has(category) ? category : match?.category ?? null;
  if (fallbackCategory) candidates.push(categoryPath(fallbackCategory));

  candidates.push(DEFAULT_IMAGE);
  return candidates;
}
```

**New code** — delete the `import manifest ...` line and the
`AVAILABLE_SLUGS` line entirely, and replace the function:
```ts
export function resolveServiceImageCandidates(
  name: string,
  category: string | null | undefined,
): string[] {
  const candidates: string[] = [];

  // Always try the specific slug's image first — if it hasn't been
  // uploaded yet, the <img onError> fallback chain in ServiceImage simply
  // advances to the category image below. This lets an admin-uploaded
  // photo work immediately with no rebuild, instead of requiring a
  // build-time manifest of "which slugs currently have a file".
  const match = matchServiceSlug(name, category);
  if (match) {
    candidates.push(specificPath(match.category, match.slug));
  }

  const fallbackCategory =
    category && KNOWN_CATEGORIES.has(category) ? category : match?.category ?? null;
  if (fallbackCategory) candidates.push(categoryPath(fallbackCategory));

  candidates.push(DEFAULT_IMAGE);
  return candidates;
}
```
Nothing else in this file changes — `SERVICE_IMAGE_RULES`,
`matchServiceSlug`, `normalizeServiceName`, `specificPath`, `categoryPath`,
all stay exactly as they are. `service-images.manifest.json` itself and
`scripts/optimize-service-images.mjs` can both stay in the repo untouched
(a developer can still use the old local workflow for a bulk import if they
ever want to) — they're just no longer required for day-to-day use, and the
manifest file is no longer read by the app at all.

## Fix 12.2 — inventory API: `GET /api/admin/service-images`

This reads the **real filesystem, at request time** — never a stale
manifest — so what the admin screen shows is always exactly what's live.

New file `src/app/api/admin/service-images/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "fs";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { auditLog, getAuditIp } from "@/lib/audit";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { SERVICE_IMAGE_RULES, SERVICE_IMAGE_ROOT, SERVICE_IMAGE_EXT } from "@/lib/service-images";

export const runtime = "nodejs";

const CATEGORIES = [
  "hair-styling",
  "nails",
  "hair-removal",
  "eyebrows-eyelashes",
  "facials-skincare",
  "massage",
  "spa-wellness",
  "makeup",
] as const;

const MAX_IMAGE_SIZE_MB = 8;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const UPLOAD_LIMIT = 60;
const UPLOAD_WINDOW_MS = 15 * 60 * 1000;

async function requireAdmin() {
  const session = await auth().catch(() => null);
  const role = (session?.user as unknown as { role?: string } | undefined)?.role ?? null;
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session, role };
}

function diskRoot(): string {
  return path.join(process.cwd(), "public", "service-images");
}
function specificFile(category: string, slug: string): string {
  return path.join(diskRoot(), category, `${slug}.${SERVICE_IMAGE_EXT}`);
}
function categoryFile(category: string): string {
  return path.join(diskRoot(), "_category", `${category}.${SERVICE_IMAGE_EXT}`);
}
function defaultFile(): string {
  return path.join(diskRoot(), "_category", `default.${SERVICE_IMAGE_EXT}`);
}

// GET — full, live inventory: every catalog rule grouped by category, plus
// the 8 category fallbacks and the one global default, each flagged with
// whether a file currently exists on disk.
export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const byCategory = CATEGORIES.map((category) => ({
    category,
    hasDefault: existsSync(categoryFile(category)),
    defaultUrl: `${SERVICE_IMAGE_ROOT}/_category/${category}.${SERVICE_IMAGE_EXT}`,
    rules: SERVICE_IMAGE_RULES.filter((r) => r.category === category).map((r) => ({
      slug: r.slug,
      keywords: r.keywords,
      hasImage: existsSync(specificFile(category, r.slug)),
      imageUrl: `${SERVICE_IMAGE_ROOT}/${category}/${r.slug}.${SERVICE_IMAGE_EXT}`,
    })),
  }));

  return NextResponse.json({
    data: {
      categories: byCategory,
      globalDefault: {
        hasImage: existsSync(defaultFile()),
        imageUrl: `${SERVICE_IMAGE_ROOT}/_category/default.${SERVICE_IMAGE_EXT}`,
      },
    },
  });
}

// POST (multipart/form-data) — upload or replace one image.
// Fields: file (required), target ("slug" | "category" | "default"),
// category (required for "slug"/"category"), slug (required for "slug").
export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { session, role } = guard;

  const ip = getAuditIp(request.headers) ?? "unknown";
  const limited = await rateLimit(`service-images:${ip}`, { limit: UPLOAD_LIMIT, windowMs: UPLOAD_WINDOW_MS });
  if (!limited.success) {
    return NextResponse.json(
      { error: "Too many uploads, try again shortly" },
      { status: 429, headers: rateLimitHeaders(limited, UPLOAD_LIMIT) },
    );
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = form.get("file");
  const target = String(form.get("target") ?? "");
  const category = String(form.get("category") ?? "");
  const slug = String(form.get("slug") ?? "");

  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Image must be under ${MAX_IMAGE_SIZE_MB}MB` }, { status: 400 });
  }
  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number]) && target !== "default") {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  let outFile: string;
  let publicUrl: string;
  if (target === "slug") {
    const rule = SERVICE_IMAGE_RULES.find((r) => r.category === category && r.slug === slug);
    if (!rule) return NextResponse.json({ error: "Unknown category/slug combination" }, { status: 400 });
    outFile = specificFile(category, slug);
    publicUrl = `${SERVICE_IMAGE_ROOT}/${category}/${slug}.${SERVICE_IMAGE_EXT}`;
  } else if (target === "category") {
    outFile = categoryFile(category);
    publicUrl = `${SERVICE_IMAGE_ROOT}/_category/${category}.${SERVICE_IMAGE_EXT}`;
  } else if (target === "default") {
    outFile = defaultFile();
    publicUrl = `${SERVICE_IMAGE_ROOT}/_category/default.${SERVICE_IMAGE_EXT}`;
  } else {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    // Same crop/quality as scripts/optimize-service-images.mjs, so
    // admin-uploaded photos look consistent with any bulk-imported ones.
    const processed = await sharp(buffer)
      .rotate()
      .resize(800, 600, { fit: "cover", position: "attention" })
      .webp({ quality: 80 })
      .toBuffer();

    await mkdir(path.dirname(outFile), { recursive: true });
    await writeFile(outFile, processed);

    await auditLog({
      action: "service_image.upload",
      userId: (session.user as unknown as { id: string }).id,
      userEmail: session.user.email ?? null,
      role,
      targetType: "service_image",
      targetId: target === "slug" ? `${category}/${slug}` : target === "category" ? category : "default",
      ip,
    });

    return NextResponse.json({ data: { url: `${publicUrl}?v=${Date.now()}` } });
  } catch (err) {
    console.error("service-image upload failed", err);
    return NextResponse.json({ error: "Could not process image" }, { status: 500 });
  }
}

// DELETE (?target=slug&category=X&slug=Y) — remove a specific slug's photo
// so it reverts to showing its category's fallback image. Category and
// global-default images cannot be deleted, only replaced (POST over them),
// since every service always needs at least one image to fall back to.
export async function DELETE(request: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { session, role } = guard;

  const { searchParams } = new URL(request.url);
  const target = searchParams.get("target");
  const category = searchParams.get("category") ?? "";
  const slug = searchParams.get("slug") ?? "";

  if (target !== "slug" || !category || !slug) {
    return NextResponse.json({ error: "Only a specific slug's image can be removed" }, { status: 400 });
  }

  const file = specificFile(category, slug);
  try {
    if (existsSync(file)) await unlink(file);
    await auditLog({
      action: "service_image.delete",
      userId: (session.user as unknown as { id: string }).id,
      userEmail: session.user.email ?? null,
      role,
      targetType: "service_image",
      targetId: `${category}/${slug}`,
      ip: getAuditIp(request.headers),
    });
    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    console.error("service-image delete failed", err);
    return NextResponse.json({ error: "Could not remove image" }, { status: 500 });
  }
}
```
`SERVICE_IMAGE_ROOT` and `SERVICE_IMAGE_EXT` are already exported from
`service-images.ts` — no change needed there beyond Fix 12.1. If your
`auditLog` call signature doesn't accept exactly these field names, open
`src/lib/audit.ts` and match its real `AuditInput` type; the audit call is
optional context, not load-bearing — the upload/delete still work correctly
without it if the shape differs slightly.

## Fix 12.3 — the admin screen

New file `src/app/admin/service-images/page.tsx` (server component — just
checks auth and renders the client manager):
```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ServiceImageManager } from "@/components/admin/service-image-manager";

export default async function AdminServiceImagesPage() {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    redirect("/login?callbackUrl=/admin/service-images");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-[#3a2f22]">Treatment photos</h1>
      <p className="mt-1 max-w-2xl text-sm text-[#a89880]">
        These photos are shown automatically on every salon's treatment cards, matched by the
        treatment's name — this is why many salons offering "Haircut" show the same photo. Upload a
        photo for a specific treatment to replace it everywhere that treatment appears, or replace a
        category's general photo to change the fallback used by any treatment that doesn't have its
        own specific photo yet.
      </p>
      <ServiceImageManager />
    </div>
  );
}
```

New file `src/components/admin/service-image-manager.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2, Upload, X, ImageOff } from "lucide-react";

type Rule = { slug: string; keywords: string[]; hasImage: boolean; imageUrl: string };
type CategoryGroup = { category: string; hasDefault: boolean; defaultUrl: string; rules: Rule[] };
type Inventory = { categories: CategoryGroup[]; globalDefault: { hasImage: boolean; imageUrl: string } };

const CATEGORY_LABELS: Record<string, string> = {
  "hair-styling": "Hair & styling",
  nails: "Nails",
  "hair-removal": "Hair removal",
  "eyebrows-eyelashes": "Eyebrows & eyelashes",
  "facials-skincare": "Facials & skincare",
  massage: "Massage",
  "spa-wellness": "Spa & wellness",
  makeup: "Makeup",
};

function labelFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ServiceImageManager() {
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/service-images");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setInventory(json.data);
      if (!activeCategory && json.data.categories[0]) setActiveCategory(json.data.categories[0].category);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function upload(key: string, target: "slug" | "category" | "default", category: string, slug: string, file: File) {
    setBusyKey(key);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("target", target);
      body.append("category", category);
      if (target === "slug") body.append("slug", slug);
      const res = await fetch("/api/admin/service-images", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      await load();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setBusyKey(null);
    }
  }

  async function remove(key: string, category: string, slug: string) {
    if (!confirm("Remove this photo? The treatment will fall back to its category's general photo.")) return;
    setBusyKey(key);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/service-images?target=slug&category=${encodeURIComponent(category)}&slug=${encodeURIComponent(slug)}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Remove failed");
      await load();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setBusyKey(null);
    }
  }

  if (loading) {
    return (
      <div className="mt-6 flex items-center gap-2 text-sm text-[#a89880]">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading treatment photos...
      </div>
    );
  }
  if (error && !inventory) {
    return <p className="mt-6 text-sm text-[#B91C1C]">{error}</p>;
  }
  if (!inventory) return null;

  const group = inventory.categories.find((c) => c.category === activeCategory) ?? inventory.categories[0];
  const totalRules = inventory.categories.reduce((n, c) => n + c.rules.length, 0);
  const totalWithImage = inventory.categories.reduce((n, c) => n + c.rules.filter((r) => r.hasImage).length, 0);

  return (
    <div className="mt-6">
      {error && <p className="mb-3 text-sm text-[#B91C1C]">{error}</p>}
      <p className="mb-4 text-xs font-medium text-[#a89880]">
        {totalWithImage} of {totalRules} treatments have their own specific photo — the rest use their
        category's general photo below.
      </p>

      <div className="flex flex-wrap gap-1.5 border-b border-[#E3E8F0] pb-3">
        {inventory.categories.map((c) => (
          <button
            key={c.category}
            type="button"
            onClick={() => setActiveCategory(c.category)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              activeCategory === c.category ? "bg-[#3a2f22] text-white" : "bg-[#F3EEE4] text-[#5F4426] hover:bg-[#e9e1d3]"
            }`}
          >
            {CATEGORY_LABELS[c.category] ?? c.category} ({c.rules.filter((r) => r.hasImage).length}/{c.rules.length})
          </button>
        ))}
      </div>

      {group && (
        <div className="mt-5">
          <div className="flex items-center justify-between rounded-xl border border-dashed border-[#E3E8F0] bg-[#faf6ef] p-3">
            <div className="flex items-center gap-3">
              <ImagePreview src={group.hasDefault ? group.defaultUrl : inventory.globalDefault.imageUrl} />
              <div>
                <p className="text-sm font-semibold text-[#3a2f22]">
                  {CATEGORY_LABELS[group.category] ?? group.category} — category photo
                </p>
                <p className="text-xs text-[#a89880]">Used for any treatment in this category with no specific photo of its own.</p>
              </div>
            </div>
            <UploadButton
              busy={busyKey === `category:${group.category}`}
              onSelect={(file) => upload(`category:${group.category}`, "category", group.category, "", file)}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {group.rules.map((rule) => {
              const key = `slug:${group.category}:${rule.slug}`;
              return (
                <div key={rule.slug} className="flex items-center justify-between gap-3 rounded-xl border border-[#E3E8F0] bg-white p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <ImagePreview src={rule.hasImage ? rule.imageUrl : (group.hasDefault ? group.defaultUrl : inventory.globalDefault.imageUrl)} faded={!rule.hasImage} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#3a2f22]">{labelFromSlug(rule.slug)}</p>
                      <p className="truncate text-[11px] text-[#a89880]" title={rule.keywords.join(", ")}>
                        matches: {rule.keywords.slice(0, 3).join(", ")}
                        {rule.keywords.length > 3 ? "…" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {rule.hasImage && (
                      <button
                        type="button"
                        title="Remove photo"
                        onClick={() => remove(key, group.category, rule.slug)}
                        disabled={busyKey === key}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E3E8F0] text-[#a89880] hover:bg-[#faf6ef] disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <UploadButton
                      compact
                      busy={busyKey === key}
                      onSelect={(file) => upload(key, "slug", group.category, rule.slug, file)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between rounded-xl border border-dashed border-[#E3E8F0] bg-[#faf6ef] p-3">
        <div className="flex items-center gap-3">
          <ImagePreview src={inventory.globalDefault.imageUrl} />
          <div>
            <p className="text-sm font-semibold text-[#3a2f22]">Global default photo</p>
            <p className="text-xs text-[#a89880]">Last-resort fallback, only used if a category photo is also missing.</p>
          </div>
        </div>
        <UploadButton busy={busyKey === "default"} onSelect={(file) => upload("default", "default", "", "", file)} />
      </div>
    </div>
  );
}

function ImagePreview({ src, faded = false }: { src: string; faded?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={`h-12 w-12 shrink-0 rounded-lg border border-[#E3E8F0] object-cover ${faded ? "opacity-40" : ""}`}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

function UploadButton({
  onSelect,
  busy,
  compact = false,
}: {
  onSelect: (file: File) => void;
  busy: boolean;
  compact?: boolean;
}) {
  return (
    <label
      className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#E3E8F0] bg-white text-xs font-medium text-[#5F4426] transition hover:bg-[#faf6ef] ${
        compact ? "h-8 px-2.5" : "h-9 px-3.5"
      } ${busy ? "pointer-events-none opacity-50" : ""}`}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
      {!compact && (busy ? "Uploading..." : "Upload")}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}
```
`ImageOff` is imported but unused above if you don't add an empty-state
icon — remove that import, or use it in place of `ImagePreview`'s
`onError` inline style if you'd rather show an icon than hide the broken
image entirely; either is fine.

## Fix 12.4 — add it to the admin home screen

`src/app/admin/page.tsx` already has a `navCards` array. Add one entry
(anywhere in the array — after "Businesses" reads naturally):
```tsx
    {
      href: "/admin/service-images",
      icon: ImageIcon, // add ImageIcon to the existing lucide-react import at the top of the file
      title: "Treatment Photos",
      description: "Manage the shared stock photos shown automatically on every salon's treatment cards.",
    },
```
Add `ImageIcon` to the existing `import { AlertCircle, ArrowRight, Crown,
Layers, Megaphone, Sparkles, Store, Zap } from "lucide-react";` line at the
top of the file (import it as `Image as ImageIcon` since `Image` is already
used for `next/image`):
```tsx
import { AlertCircle, ArrowRight, Crown, Layers, Megaphone, Sparkles, Store, Zap, Image as ImageIcon } from "lucide-react";
```

## Verify

1. Open `/admin/service-images`. Confirm it loads without error and shows
   8 category tabs, each with its rule count (e.g. "Hair & styling
   (2/15)").
2. Pick a rule with no photo yet (e.g. "Blow dry" under Hair & styling),
   upload any JPEG or PNG. Confirm it appears immediately, no page refresh
   needed beyond the automatic reload this component already does, and the
   counter updates (e.g. "3/15").
3. Open any salon's public page that has a service named something like
   "Blow Dry" (or create one for testing) and confirm its card now shows
   the photo you just uploaded, with **no redeploy** — this is the proof
   the manifest-removal fix (11.1) actually works.
4. Remove that photo from the admin screen and confirm the salon's card
   falls back to the Hair & Styling category photo instead of breaking.
5. Replace the "Hair & styling" category photo itself and confirm every
   treatment in that category with no specific photo of its own updates to
   the new image.

---
# PHASE 13 — Database migrations, run in this order

```bash
npx prisma migrate dev --name add_must_change_password
```

This is the only schema change in this entire round of fixes (it belongs
to Phase 11). Every other phase — the ranking reuse in Phase 7, the ad
placement wiring in Phase 8, the delete route in Phase 9, the Opening
Hours tab in Phase 10, the shared treatment-image system in Phase 12 —
reads and writes columns and tables that already exist in the current
schema; none of them need a migration.

After running this locally and confirming the app works end to end,
deploy it the same way this project's existing deployment process already
documents: `npx prisma migrate deploy` against production, never `migrate
dev`.

```bash
rm -rf .next
npm install
npx prisma generate
npx prisma migrate deploy
node scripts/seed-subscriptions.mjs   # safe to re-run, upserts only
npm run build
```

---

# PHASE 14 — Final verification checklist, run through every item in order

- [ ] `/admin/subscription-plans`, `/admin/salon-subscriptions`,
      `/admin/businesses`, `/admin/advertisements`, and
      `/admin/service-images` all sit inside a centered column with
      visible margin on a wide monitor, not stretched edge to edge.
- [ ] Every toggle switch on every admin page (Subscription Plans: Active,
      Featured-eligible, Priority-eligible; Advertising: Enabled on both
      the create form and every existing ad card) shows its full label
      with no overlap, at both narrow and wide browser widths.
- [ ] Changing a value on a Subscription Plan card and clicking Save
      persists after a page refresh.
- [ ] `/admin` shows "Marketplace Plans (Silver / Gold / Platinum)" and
      "Feature Plans (Starter / Professional / Premium)" as two clearly
      distinct cards, with no card labeled "legacy," plus a new
      "Treatment Photos" card.
- [ ] `/admin/salon-subscriptions` shows a card for every salon on the
      platform, not just the demo ones, with a working sort control, and
      saving a plan change on any card still works.
- [ ] `/admin/boosts` lists every salon in the manual-boost dropdown,
      including ones with no plan assigned. Boosting one of them succeeds.
- [ ] Assigning a high-`searchWeight` plan to a salon, or manually
      boosting a salon with no plan at all, makes it appear earlier in the
      homepage "Recommended" rail and on its category page than a salon
      with a lower-weight or no plan — not only on `/customer/search` —
      even if that salon was created less recently. The boosted salon
      shows a "Boosted" badge on its public card, and cancelling the boost
      removes it.
- [ ] Creating an ad for "Search Results Banner" makes a real banner
      appear above the results on `/customer/search`, it is clickable, and
      the click/impression counters on the admin page go up after visiting
      and clicking it.
- [ ] The homepage banner renders and, when clicked, goes to its
      configured destination link — not nowhere.
- [ ] `/admin/businesses` shows the correct (new-system) plan per salon,
      a working sort control, and a working delete button that requires
      typing the salon's exact name before it can be confirmed.
- [ ] A newly created salon from `/admin/businesses/new` appears
      immediately at the top of `/admin/businesses` with "Newest first"
      selected, and immediately gets a real row in both the old
      `Subscription` table and the new `BusinessSubscription` table (check
      both — this is the sync fix from Phase 9).
- [ ] Opening any salon at `/admin/businesses/[id]` shows an Hours tab
      leading to a real day-by-day editor that saves and is reflected on
      that salon's public page.
- [ ] Creating a new salon and logging in as its owner with the generated
      temporary password succeeds, immediately shows a forced "set your
      own password" screen before anything else in the dashboard is
      visible, and the new password works on a subsequent login after
      logging out.
- [ ] `/admin/service-images` loads, shows all 8 categories with correct
      counts, uploading a photo for a treatment with none makes it appear
      on a real salon's public page with **no redeploy**, removing it
      reverts that treatment to its category's photo, and replacing a
      category's photo updates every treatment in that category that
      doesn't have its own specific photo.
- [ ] Nothing in the dashboard that depends on the old `Subscription`
      model broke — spot-check one gated feature (e.g. a staff-limit or
      gift-card screen under `/dashboard`) on a salon with a `STARTER`
      plan and confirm the limit/gate still applies correctly.
