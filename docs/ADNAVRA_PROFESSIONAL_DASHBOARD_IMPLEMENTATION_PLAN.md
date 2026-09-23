# ADNAVRA — Professional Dashboard Rebuild & Onboarding→QR Fix

This file is written for an AI coding agent (Claude Code, Cursor, etc.) working directly inside the
`adnavra-platform-dev` repository. It is a follow-up to `ADNAVRA_UI_UX_IMPLEMENTATION_PLAN.md` and
`ADNAVRA_CUSTOMER_BOOKING_IMPLEMENTATION_PLAN.md` (both already executed — onboarding wizard, customer
marketplace, and booking wizard already exist and work). This plan covers two things only:

1. **A real bug** in the onboarding → QR code handoff (Phase 0 — fix this first, it is small and breaks
   the exact flow you described).
2. **A visual/IA rebuild** of the professional dashboard (everything after sign-in) to match the dark,
   sidebar-based Fresha "for professionals" reference screenshots you supplied (Phases 1–9).

Follow tasks in order. Each task names exact files. Do not skip tasks.

## 0. Ground rules (same as the previous two plans, repeated because they still apply)

1. Never touch core business logic: `prisma/schema.prisma` fields that already exist, booking overlap
   logic in `src/app/api/bookings/route.ts`, `src/lib/availability.ts`, `src/middleware.ts` auth checks,
   `tests/**`. Additive-only schema changes are called out explicitly where needed.
2. No fabricated numbers. The reference screenshots show real Fresha data ("Activate your plan... trial
   ends in 7 days", client sales figures, 56 reports, etc.). ADNAVRA does not have a trial system, a
   payments module, gift cards, memberships, or a reporting engine yet. Every section below says exactly
   which sub-items are real (wire them to the database) versus which are visual-parity placeholders that
   must say "Coming soon" rather than show invented numbers. This is not optional polish — it is the same
   honesty rule the last two plans used throughout.
3. No emoji in the UI. No em dashes in copy. LKR only.
4. After every phase: `npm run lint && npm run test && npm run build` must pass before moving on.
5. **Do not break the QR / booking chain.** `src/lib/qr.ts`'s `publicBusinessUrl(slug)` encodes
   `/{slug}`, the public profile page's "Book now" already goes to `/{slug}/book`, and that wizard already
   posts to `POST /api/bookings`, protected by the Postgres `EXCLUDE` constraint. None of that logic
   changes in this plan — Phase 0 only fixes *when the QR page becomes reachable*, and Phases 1–9 only
   restyle the shell around existing pages.

---

## PHASE 0 — Fix the onboarding → QR code handoff (do this first)

### The bug

`src/app/dashboard/onboarding/page.tsx`'s `handleFinish()` calls `POST /api/businesses`, then
`router.push("/dashboard/qr-code")`. But `src/app/dashboard/layout.tsx` decides whether to redirect back
to onboarding using `session.user.businessId`, which comes from the **JWT session cookie**, not a fresh
database read. `src/lib/auth.ts`'s `jwt` callback only sets `businessId` on the token at initial sign-in
and never refreshes it afterward (no `trigger === "update"` handling exists). So immediately after
`POST /api/businesses` succeeds and creates the business, the signed-in user's session token still says
`businessId: null` for the rest of that 30-day session.

The result: `router.push("/dashboard/qr-code")` lands on a layout that reads the stale `businessId: null`
from the cookie, and since `/dashboard/qr-code` is **not** in the guardrail's exclusion list (only
`/dashboard/settings` and `/dashboard/onboarding` are excluded — see the `if` in `DashboardLayout`), it
immediately redirects the owner straight back to `/dashboard/onboarding`. The wizard appears to loop or
the QR page never appears. Every dashboard page has the same stale-`businessId` problem until the user
logs out and back in, which is also why bookings/services/staff pages could silently misbehave right after
onboarding.

### Task 0.1 — Make the JWT session updatable

**File: `src/lib/auth.ts`** — in the `jwt` callback, add a `trigger`/`session` parameter and handle
`trigger === "update"` by trusting the businessId the client explicitly asks to set (only that one field,
never role, to avoid a client being able to escalate itself):

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async jwt({ token, user, account, profile, trigger, session }: any) {
  // NEW: explicit session update, called right after onboarding creates a business.
  // Only businessId may be pushed this way — role changes must never be client-driven.
  if (trigger === "update" && session?.businessId) {
    (token as Record<string, unknown>).businessId = session.businessId as string;
    return token;
  }

  if (user) {
    // ...unchanged, existing branches below...
```

(Insert this block as the very first thing inside the existing `jwt` callback, before the `if (user)`
branch. Do not otherwise modify the existing branches.)

### Task 0.2 — Push the update from the onboarding page

**File: `src/app/dashboard/onboarding/page.tsx`** — import `useSession` from `next-auth/react` and call its
`update()` after a successful business creation, before navigating:

```tsx
"use client";
import { useSession } from "next-auth/react";
// ...existing imports...

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  // ...existing state...

  async function handleFinish() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/businesses", { /* unchanged */ });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not create business");
      // NEW — push the fresh businessId into the JWT before navigating, so the dashboard
      // layout's guardrail (and every other page that reads session.user.businessId) sees it
      // immediately instead of on next login.
      await update({ businessId: json.data.id });
      router.push("/dashboard/qr-code");
      router.refresh();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  // ...
}
```

Check the exact response shape of `POST /api/businesses` in `src/app/api/businesses/route.ts` (it returns
`{ data: business, ... }` or similar — match whatever field actually holds the created business's `id`;
do not guess blindly, read the route's final `NextResponse.json(...)` call before wiring this).

`useSession` requires a `SessionProvider` ancestor. Confirm one already wraps the app (check
`src/app/layout.tsx` and any `providers.tsx`); if none exists yet, add a small client component
`src/components/providers/session-provider.tsx` wrapping `{children}` in `<SessionProvider>`, and use it in
`src/app/layout.tsx`'s `<body>`. This is additive and does not change any existing page's behavior since
`useSession()` only affects components that call it.

### Task 0.3 — Also exclude `/dashboard/qr-code` from the guardrail, as defense in depth

**File: `src/app/dashboard/layout.tsx`** — even with Task 0.1/0.2 fixed, keep a second safety net in case
the client-side `update()` call fails (slow network, etc.):

```ts
if (
  !pathname.startsWith("/dashboard/settings") &&
  !pathname.startsWith("/dashboard/onboarding") &&
  !pathname.startsWith("/dashboard/qr-code")
) {
  redirect("/dashboard/onboarding");
}
```

This alone would only mask the symptom (Task 0.1/0.2 are the real fix, since every other dashboard page
still needs the correct `businessId`), so do not skip Task 0.1/0.2 and rely on this alone.

### Task 0.4 — Verify the rest of the chain (no code change, just confirm while testing)

1. `/dashboard/qr-code` calls `GET /api/businesses` (no id) → returns the signed-in owner's own business
   → `<QrCard businessId={...} />` → `GET /api/businesses/{id}/qr` → `src/lib/qr.ts`'s
   `generateQrDataUrl(publicBusinessUrl(slug))` → PNG data URL encoding `https://.../{slug}`.
2. Scan it (or open the encoded URL) → lands on `src/app/[businessSlug]/page.tsx` → "Book now" →
   `src/app/[businessSlug]/book/page.tsx` → `BookingWizard` → `POST /api/bookings`.
3. This is already correct and must not be re-implemented — Phase 0 only makes step 1 reachable
   immediately after onboarding instead of after a re-login.

---

## PHASE 1 — Dark dashboard shell (sidebar + top bar)

The reference screenshots (10, 11, 12, 13, 14, 15, 16) show one consistent shell: a narrow dark left icon
rail, a dark top bar, and a content area that is either a two-column "section list + detail" layout (Sales,
Clients, Catalog, Team, Reports) or a full-width page (Calendar, Settings). Build this shell once and reuse
it for every dashboard route — do not restyle each page independently.

The dark tokens already exist in `src/app/globals.css` / `DESIGN.md` from the earlier redesign
(`--color-surface-dark: #0b1220`, and `surface-dark-elevated`, `on-dark`, `on-dark-soft` in `DESIGN.md`) —
reuse them, do not invent new hex values.

### Task 1.1 — Icon sidebar

**File: `src/components/dashboard/sidebar.tsx` (new)**

Top-to-bottom icon rail matching screenshots 10–16 exactly, one icon per top-level section:

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Calendar, Tag, Smile, BookOpen, Megaphone, Users, LineChart, Grid3x3, Settings, HelpCircle,
} from "lucide-react";

const SECTIONS = [
  { href: "/dashboard", label: "Home", icon: Home, exact: true },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/sales", label: "Sales", icon: Tag },
  { href: "/dashboard/clients", label: "Clients", icon: Smile },
  { href: "/dashboard/catalog", label: "Catalog", icon: BookOpen },
  { href: "/dashboard/marketing", label: "Marketing", icon: Megaphone },
  { href: "/dashboard/team", label: "Team", icon: Users },
  { href: "/dashboard/reports", label: "Reports", icon: LineChart },
  { href: "/dashboard/apps", label: "Apps", icon: Grid3x3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-16 shrink-0 flex-col items-center border-r border-white/10 bg-[#0B1220] py-4">
      <nav className="flex flex-1 flex-col items-center gap-1">
        {SECTIONS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              aria-label={label}
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                active ? "bg-[#6C5CE7] text-white" : "text-[#A9B4C4] hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>
      <Link
        href="/help"
        title="Help"
        aria-label="Help"
        className="flex h-11 w-11 items-center justify-center rounded-xl text-[#A9B4C4] hover:bg-white/5 hover:text-white"
      >
        <HelpCircle className="h-5 w-5" />
      </Link>
    </aside>
  );
}
```

`#6C5CE7` is the active-icon purple from the reference; if you want a single source of truth instead of a
one-off hex, add it to `DESIGN.md`/`globals.css` as `--color-sidebar-active: #6C5CE7` in the same pass and
reference that token instead — do not scatter the raw hex across multiple files.

### Task 1.2 — Top bar

**File: `src/components/dashboard/topbar.tsx` (new)**

```tsx
"use client";
import Link from "next/link";
import { Search, BarChart3, Bell, MessageCircle } from "lucide-react";
import { ContinueSetupPill } from "./continue-setup-pill";
import { AccountMenu } from "./account-menu";

export function DashboardTopbar({
  businessName,
  userName,
  userInitials,
}: {
  businessName: string;
  userName: string;
  userInitials: string;
}) {
  return (
    <header className="flex h-16 items-center gap-4 border-b border-white/10 bg-[#0B1220] px-4 md:px-6">
      <Link href="/dashboard" className="text-lg font-semibold text-white shrink-0">
        ADNAVRA
      </Link>
      <span className="hidden lg:inline text-sm text-[#A9B4C4] truncate">{businessName}</span>
      <div className="ml-auto flex items-center gap-1.5">
        <ContinueSetupPill />
        <button aria-label="Search" className="flex h-9 w-9 items-center justify-center rounded-full text-[#A9B4C4] hover:bg-white/5 hover:text-white">
          <Search className="h-4 w-4" />
        </button>
        <Link href="/dashboard/reports" aria-label="Reports" className="flex h-9 w-9 items-center justify-center rounded-full text-[#A9B4C4] hover:bg-white/5 hover:text-white">
          <BarChart3 className="h-4 w-4" />
        </Link>
        <button aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#A9B4C4] hover:bg-white/5 hover:text-white">
          <Bell className="h-4 w-4" />
          {/* NEW notification badge only renders when there is a real unread count — see Task 9.2. Never hardcode a number here. */}
        </button>
        <Link href="/help" aria-label="Help chat" className="flex h-9 w-9 items-center justify-center rounded-full text-[#A9B4C4] hover:bg-white/5 hover:text-white">
          <MessageCircle className="h-4 w-4" />
        </Link>
        <AccountMenu userName={userName} userInitials={userInitials} />
      </div>
    </header>
  );
}
```

Notes on honesty (Ground rule 2):
- The reference chat icon opens Fresha's real messaging inbox. ADNAVRA has no messaging system, so this
  button links to `/help` instead of opening a fake inbox — never render an empty "Messages" panel that
  implies a working feature.
- The notification bell must never show a hardcoded badge (the reference shows "2"). Task 9.2 wires a real
  count or the badge simply never renders.

### Task 1.3 — `ContinueSetupPill` (honest replacement for the fake "trial" banner)

**File: `src/components/dashboard/continue-setup-pill.tsx` (new)** — a small client component that fetches
the current business (reuse `GET /api/businesses`) plus its services/staff counts, and shows the pill only
while onboarding is genuinely incomplete:

```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Rocket, ChevronRight } from "lucide-react";

export function ContinueSetupPill() {
  const [incomplete, setIncomplete] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const bRes = await fetch("/api/businesses");
        const bJson = await bRes.json();
        const business = bJson.data?.[0];
        if (!business) return;
        const [sRes, stRes] = await Promise.all([
          fetch(`/api/services?businessId=${business.id}&limit=1`),
          fetch(`/api/staff?businessId=${business.id}&limit=1`),
        ]);
        const [sJson, stJson] = await Promise.all([sRes.json(), stRes.json()]);
        const hasServices = (sJson.data ?? []).length > 0;
        const hasHours = Boolean(business.openingHours);
        // Only nudge when something real is still missing — never a fabricated countdown.
        setIncomplete(!hasServices || !hasHours || (stJson.data ?? []).length === 0);
      } catch {
        // fail silent, do not show a broken pill
      }
    }
    check();
  }, []);

  if (!incomplete) return null;
  return (
    <Link
      href="/dashboard/settings"
      className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#6C5CE7] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
    >
      <Rocket className="h-3.5 w-3.5" /> Continue setup <ChevronRight className="h-3.5 w-3.5" />
    </Link>
  );
}
```

This replaces the reference's "Activate your plan... free trial ends in 7 days" banner (screenshot 14)
with something ADNAVRA can actually back up: it disappears once the owner has added at least one service,
set opening hours, and added at least one team member, and it never claims a trial countdown that does not
exist in `Subscription` (`currentPeriodEnd` is nullable and unused for trials today).

### Task 1.4 — `AccountMenu`

**File: `src/components/dashboard/account-menu.tsx` (new)** — avatar circle with initials (reuse the same
`"AA"`-style two-letter initials logic from the owner's name), opening a small dropdown with: business
name (read-only), "Settings" link, "Sign out" (reuse the existing server-action pattern from the current
`src/app/dashboard/layout.tsx`, moved here). Mirrors screenshots 10–16's top-right avatar.

### Task 1.5 — Wire the new shell into the layout

**File: `src/app/dashboard/layout.tsx`** — replace the current light `<nav>` + `<DashboardNav />` markup
with:

```tsx
return (
  <div className="flex min-h-screen bg-[#0B1220]">
    <DashboardSidebar />
    <div className="flex min-w-0 flex-1 flex-col">
      <DashboardTopbar
        businessName={/* fetch or pass through, see note below */ "Your business"}
        userName={userName}
        userInitials={userName.slice(0, 2).toUpperCase()}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  </div>
);
```

`businessName` needs a real value: since `DashboardLayout` is already a Server Component with access to
`session`, do a light `db.business.findUnique({ where: { id: businessId }, select: { name: true } })`
right there (it already conditionally queries nothing else) and pass `business?.name ?? "Your business"`
down. Keep the existing guardrail logic (Task 0.3's updated exclusion list) above this return.

Delete `src/components/dashboard/nav.tsx` only after every page below has a working top-of-content
sub-navigation, so there is no in-between state with no navigation at all.

### Task 1.6 — Content area convention

Every dashboard page from Phase 2 onward that has a "section list + detail" layout (Sales, Clients,
Catalog, Team, Reports) shares one wrapper:

**File: `src/components/dashboard/section-shell.tsx` (new)**

```tsx
export function SectionShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full">
      <aside className="hidden lg:block w-64 shrink-0 border-r border-white/10 bg-[#0B1220] px-4 py-6">
        {sidebar}
      </aside>
      <div className="min-w-0 flex-1 bg-[#0F1729] px-6 py-8 text-white">{children}</div>
    </div>
  );
}
```

Use `#0F1729` (a hair lighter than `#0B1220`) for the content panel so it reads as a distinct surface from
the rail, matching the reference's subtle two-tone. Add this as `--color-surface-dark-elevated` if it is
not already the value assigned to that token in `globals.css` (check first — Task 1.4 of the earlier UI/UX
plan may already have set `surface-dark-elevated` to a different hex; if so, reuse that token's existing
value instead of introducing a second dark surface color).

---

## PHASE 2 — Home / Calendar (screenshot 10)

### Task 2.1 — `/dashboard` becomes "Home"

**File: `src/app/dashboard/page.tsx`** — this currently renders the bookings table (see Phase 4, it moves
to `/dashboard/sales/appointments`). Replace its content with a simple day-at-a-glance home screen: today's
upcoming bookings (reuse the existing `GET /api/bookings?date=today` query already used elsewhere), a
"Today's appointments" count, and quick links to Calendar/Sales/Clients. Restyle text colors to the dark
palette (`text-white`, `text-[#A9B4C4]` for secondary, `bg-white/5` for cards) — do not keep the light
`#101828`/`#F7F9FC` classes anywhere under `/dashboard/**` after this phase.

### Task 2.2 — Calendar page restyle

**File: `src/app/dashboard/calendar/page.tsx`** — this already implements a day-view calendar (per the
existing 105-line file). Keep its data logic exactly as-is; only change the Tailwind classes:
- Page background → `bg-[#0F1729]`, text → `text-white`/`text-[#A9B4C4]`.
- The header row shown in screenshot 10 ("Today ‹ Fri, Aug 28 › — Scheduled team ⌄ — filter icon") plus a
  "Day ⌄" view switcher and an "Add ⌄" button on the right, matching the reference's control row.
- Each staff member gets a column with their avatar-initials circle at the top (reuse `StaffMember.name`
  initials, same pattern as `AccountMenu`), and existing bookings render as colored blocks
  (`bg-[#7DD3E8]`-style light blue, dark text) inside that staff member's column, positioned by time exactly
  as the current logic already computes — only the block's color/typography changes, not its position math.
- If there is only one staff member (or none), still render a single "Unassigned" column so the page never
  looks broken for a Starter-plan solo owner (staff assignment is a Professional/Premium feature per the
  proposal — the calendar itself must work for every plan).

---

## PHASE 3 — Sales (screenshot 11)

### Task 3.1 — Route restructure

Create a nested layout so every Sales page shares the same left sub-nav:

```
src/app/dashboard/sales/layout.tsx     // renders SectionShell with the Sales sub-nav
src/app/dashboard/sales/page.tsx       // redirect to /dashboard/sales/daily-summary
src/app/dashboard/sales/daily-summary/page.tsx
src/app/dashboard/sales/appointments/page.tsx   // this IS the old src/app/dashboard/page.tsx content
src/app/dashboard/sales/sales/page.tsx          // "Sales" sub-item — placeholder, see below
src/app/dashboard/sales/payments/page.tsx       // placeholder
src/app/dashboard/sales/gift-cards/page.tsx     // placeholder
src/app/dashboard/sales/packages/page.tsx       // placeholder
src/app/dashboard/sales/memberships/page.tsx    // placeholder
```

**File: `src/app/dashboard/sales/layout.tsx`** sub-nav content (matches screenshot 11's left list exactly):

```tsx
const SALES_LINKS = [
  { href: "/dashboard/sales/daily-summary", label: "Daily sales summary" },
  { href: "/dashboard/sales/appointments", label: "Appointments" },
  { href: "/dashboard/sales/sales", label: "Sales" },
  { href: "/dashboard/sales/payments", label: "Payments" },
  { href: "/dashboard/sales/gift-cards", label: "Gift cards sold" },
  { href: "/dashboard/sales/packages", label: "Packages sold" },
  { href: "/dashboard/sales/memberships", label: "Memberships sold" },
];
```

Render `<p className="text-xs uppercase tracking-wide text-[#A9B4C4] mb-2">Sales</p>` above the list, same
active/inactive link styling pattern as the old `DashboardNav` but vertical instead of horizontal pills.

### Task 3.2 — Daily sales summary (real data only)

**File: `src/app/dashboard/sales/daily-summary/page.tsx`** — matches screenshot 11's two-panel layout
("Transaction summary" / "Cash movement summary") but only the rows ADNAVRA can actually compute:

- **Transaction summary → Services row**: real. `Sales qty` = count of `Booking` rows for the selected
  business/day with `status: "COMPLETED"` (or `CONFIRMED`, pick one consistent definition and say so in a
  code comment); `Gross total` = `sum(service.price)` for those bookings, formatted as LKR.
- Every other row the reference shows (`Service add-ons`, `Products`, `Shipping`, `Gift cards`, `Packages`,
  `Memberships`, `Late cancellation fees`, `No-show fees`, `Refund amount`) has no backing data model —
  render them with `Sales qty: —` and `Gross total: —` (an em-dash placeholder is fine here since it is
  visibly "not tracked", unlike a fake `0` which implies the system checked and found none) OR simply omit
  those rows entirely and add one line beneath the table: "Product sales, packages, and memberships are not
  yet tracked in ADNAVRA." **Prefer omitting the rows** over showing `—` in eight rows, it reads cleaner.
- **Cash movement summary**: there is no payments integration (per the proposal's roadmap: "Online
  payments" is a future feature). Do not render this panel at all yet — replace it with a small note: "Cash
  and payment tracking is on the ADNAVRA roadmap." Do not show `LKR 0.00` rows that imply a working, empty
  ledger; that is a fabricated-precision problem, not an empty-state problem.
- Date navigation (`‹ Today Friday, 28 Aug 2026 ›`) uses `new Date()`, never a hardcoded date, exactly like
  the date-time picker built in the customer plan.

### Task 3.3 — Appointments

**File: `src/app/dashboard/sales/appointments/page.tsx`** — move the existing bookings-table logic from
the old `src/app/dashboard/page.tsx` here verbatim (same `GET /api/bookings` calls, same status filters,
same pagination), only restyled to the dark palette. Add a redirect from the old route:

**File: `src/app/dashboard/page.tsx`** (after Task 2.1 replaces it with the Home screen) — Home's
"Today's appointments" quick link points to `/dashboard/sales/appointments`.

### Task 3.4 — Remaining Sales sub-pages (honest placeholders)

**Files: `sales/page.tsx`, `payments/page.tsx`, `gift-cards/page.tsx`, `packages/page.tsx`,
`memberships/page.tsx`** — each renders the same small "Coming soon" pattern: heading matching the sub-nav
label, one sentence pulled from the SaaS proposal's roadmap section (e.g. for Payments: "Online payments
are on the ADNAVRA roadmap. Once available, transactions taken through the platform will appear here."),
no fake table, no fake numbers. Reuse a single shared component so the copy stays consistent:

**File: `src/components/dashboard/coming-soon.tsx` (new)**

```tsx
import { Sparkles } from "lucide-react";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 px-8 py-16 text-center">
      <Sparkles className="h-8 w-8 text-[#A9B4C4]" />
      <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-[#A9B4C4]">{description}</p>
    </div>
  );
}
```

Use this same component everywhere else in this plan a roadmap item needs a stub (Marketing, Apps,
several Reports rows, several Settings cards) so there is exactly one honest "not built yet" pattern in the
whole codebase instead of several different ad hoc ones.

---

## PHASE 4 — Clients (screenshot 12)

### Task 4.1 — Route restructure

```
src/app/dashboard/clients/layout.tsx      // SectionShell, sub-nav: Clients list / Client segments, then "Engage": Client loyalty / Online reputation
src/app/dashboard/clients/page.tsx        // redirect to /dashboard/clients/list
src/app/dashboard/clients/list/page.tsx   // old src/app/dashboard/customers/page.tsx content, restyled
src/app/dashboard/clients/segments/page.tsx     // ComingSoon
src/app/dashboard/clients/loyalty/page.tsx      // ComingSoon (roadmap: "Loyalty programs")
src/app/dashboard/clients/reputation/page.tsx   // ComingSoon
```

### Task 4.2 — Clients list

**File: `src/app/dashboard/clients/list/page.tsx`** — move the existing `src/app/dashboard/customers/page.tsx`
logic here verbatim (it already lists real `Customer` rows scoped by `businessId`). Add, matching screenshot
12's table columns: Client name (with initials avatar), Mobile number, **Reviews** (there is no review
system — render `—` for every row, not a fake `0`, and do not add a numeric column that implies a rating
exists), Sales (same honesty rule as Task 3.2 — either compute a real lifetime total from completed
bookings' service prices, since that data does exist per customer via `Booking.customerId`, or render `—`
if you decide not to compute it this pass; computing it is preferred since the data is genuinely available:
`sum(booking.service.price) where booking.customerId = c.id and booking.status = 'COMPLETED'`), Created at
(`Customer.createdAt`, real).

### Task 4.3 — The promotional banner

Screenshot 12 shows a purple "Attract new clients with online bookings — Join the world's largest beauty
and wellness marketplace" banner. ADNAVRA is not the world's largest marketplace — do not copy that claim.
Replace with an honest, still-motivating version that points at a real, already-built feature (the
marketplace search built in the customer plan):

```tsx
<div className="rounded-xl bg-gradient-to-br from-[#1B2E6F] via-[#17879A] to-[#22C08C] p-6 text-white">
  <h3 className="text-lg font-semibold">Get discovered on the ADNAVRA marketplace</h3>
  <p className="mt-1 max-w-lg text-sm text-white/85">
    Your salon already appears in ADNAVRA customer search results. Complete your profile and add photos to
    stand out.
  </p>
  <Link href="/dashboard/settings" className="mt-3 inline-flex rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#101828]">
    Complete your profile
  </Link>
</div>
```

Make it dismissible (local component state, `useState`, no persistence needed) with the same `X` affordance
as the reference.

---

## PHASE 5 — Catalog (screenshot 13)

### Task 5.1 — Route restructure

```
src/app/dashboard/catalog/layout.tsx        // sub-nav: Service menu / Packages / Products, then "Inventory": Stocktakes / Stock orders / Suppliers
src/app/dashboard/catalog/page.tsx          // redirect to /dashboard/catalog/service-menu
src/app/dashboard/catalog/service-menu/page.tsx   // old src/app/dashboard/services/page.tsx content
src/app/dashboard/catalog/packages/page.tsx       // ComingSoon
src/app/dashboard/catalog/products/page.tsx       // ComingSoon
src/app/dashboard/catalog/stocktakes/page.tsx     // ComingSoon
src/app/dashboard/catalog/stock-orders/page.tsx   // ComingSoon
src/app/dashboard/catalog/suppliers/page.tsx      // ComingSoon
```

### Task 5.2 — Service menu

**File: `src/app/dashboard/catalog/service-menu/page.tsx`** — move the existing services CRUD page here.
It already supports `category` (added in the earlier customer plan). Add the left "Categories" mini-panel
from screenshot 13: "All categories (count)" plus one row per distinct category actually in use by this
business's services (derived from the already-fetched services list, `Array.from(new Set(services.map(s
=> s.category).filter(Boolean)))`, each with a live count), plus "Add category" — since `Service.category`
is a free-form string field (not a separate table), "Add category" just means typing a new value into the
existing category `<select>`/input when creating or editing a service; do not build a separate Category
model for this pass, that would be new business logic outside this plan's scope. If the founder later wants
true category management (rename/delete across services at once), that is a follow-up, not part of this
plan.

---

## PHASE 6 — Team (screenshot 14)

### Task 6.1 — Route restructure

```
src/app/dashboard/team/layout.tsx        // sub-nav: Team members / Scheduled shifts / Timesheets / Pay runs
src/app/dashboard/team/page.tsx          // redirect to /dashboard/team/members
src/app/dashboard/team/members/page.tsx  // old src/app/dashboard/staff/page.tsx content
src/app/dashboard/team/shifts/page.tsx      // ComingSoon (roadmap: "Staff management enhancements")
src/app/dashboard/team/timesheets/page.tsx  // ComingSoon
src/app/dashboard/team/pay-runs/page.tsx    // ComingSoon (payroll was never in the proposal at all — keep this honestly minimal, one line, do not oversell it as "coming soon" if there is no roadmap commitment; phrase it as "Not currently available.")
```

### Task 6.2 — Team members table

**File: `src/app/dashboard/team/members/page.tsx`** — move the existing staff CRUD page here, restyled.
Match screenshot 14's columns (Name with avatar initials, Contact = email/phone stacked, Permission role).
`StaffMember` has no `role`/`title` field distinct from the linked `User.role` — if a staff row has a
linked `User`, show that user's `role` (`STAFF`/`OWNER`); if it is a contact-only staff member with no
`userId`, show "Team member" rather than inventing a permission label like "Workspace owner" that implies
account-level access they do not have.

---

## PHASE 7 — Reports (screenshot 15)

### Task 7.1 — Route restructure

```
src/app/dashboard/reports/layout.tsx      // sub-nav: All reports / Favourites / Dashboards / Standard / Premium / Custom, then "Folders": Add folder (disabled) / Data connector (disabled)
src/app/dashboard/reports/page.tsx        // "All reports" grid
```

### Task 7.2 — Report catalog (real vs locked)

There is no reporting engine. Build a small static catalog array, each entry either `available: true`
(wired to a real query) or `available: false` (renders with a lock icon and "Requires more booking data" /
"Coming soon" tag instead of Fresha's `Premium` pill, since ADNAVRA has no premium report tier yet — do not
reuse the word "Premium" here, it collides with the actual Premium subscription plan from the proposal and
would misleadingly suggest upgrading unlocks it):

```ts
const REPORTS = [
  { id: "bookings-summary", title: "Bookings summary", description: "Bookings by status for the selected period.", available: true },
  { id: "services-summary", title: "Top services", description: "Most booked services for the selected period.", available: true },
  { id: "revenue-summary", title: "Revenue summary", description: "Completed-booking revenue by day.", available: true },
  { id: "team-performance", title: "Team performance", description: "Bookings and revenue by team member.", available: true },
  { id: "client-retention", title: "Client retention", description: "Repeat vs first-time clients.", available: false },
  { id: "online-presence", title: "Online presence", description: "Marketplace views and search appearances.", available: false },
];
```

Only build the four `available: true` reports for real this pass (simple server-side aggregation queries
against `Booking`/`Service`/`StaffMember`, each rendered as a `chart_display_v0`-style bar/line chart or a
plain table — reuse whatever charting approach the rest of the dashboard already uses, do not introduce a
new charting library if one is not already a dependency). The other two stay locked with a short honest
reason, not a fake "Premium" badge.

---

## PHASE 8 — Settings hub (screenshot 16)

### Task 8.1 — Restructure into a card grid

**File: `src/app/dashboard/settings/page.tsx`** — currently this file *is* the business-details form.
Rename that form's content to a new sub-route and make `settings/page.tsx` the hub grid instead:

```
src/app/dashboard/settings/page.tsx              // NEW: card grid hub (screenshot 16)
src/app/dashboard/settings/business/page.tsx     // the OLD settings/page.tsx form, moved here verbatim
src/app/dashboard/settings/scheduling/page.tsx   // opening-hours portion, split out (see Task 8.3)
src/app/dashboard/settings/sales/page.tsx        // ComingSoon
src/app/dashboard/settings/clients/page.tsx      // ComingSoon
src/app/dashboard/settings/billing/page.tsx      // real: show the Subscription plan/status already in the DB
src/app/dashboard/settings/team/page.tsx         // redirect to /dashboard/team/members (do not duplicate the page)
src/app/dashboard/settings/forms/page.tsx        // ComingSoon (matches the customer-side "Forms" placeholder from the earlier plan)
src/app/dashboard/settings/payments/page.tsx     // ComingSoon
```

Hub grid content (screenshot 16's tabs `Settings / Online presence / Marketing / Other` plus the 8 cards):
only build the `Settings` tab's 8 cards for real navigation; `Online presence`, `Marketing`, `Other` tabs
can each show a couple of `ComingSoon` cards (Online presence → link to `/dashboard/qr-code` as its one
real, already-built item, since that genuinely *is* "online presence"; Marketing → `ComingSoon`, matches
the sidebar's Marketing section from Task 1.1 which is itself a `ComingSoon` page for now).

### Task 8.2 — Business setup card → existing form

**File: `src/app/dashboard/settings/business/page.tsx`** — the current 208-line settings form (name, slug,
description, phone, email, address, logo, opening hours) moves here unchanged in logic, restyled dark. Keep
`/dashboard/settings` in the onboarding guardrail's exclusion list (Task 0.3) pointed at the **hub**, and
add `/dashboard/settings/business` to that same exclusion list too, since that is now the actual page an
incomplete-onboarding owner should be able to reach without a redirect loop.

### Task 8.3 — Split Scheduling out (optional but matches the reference split)

If time allows, move just the opening-hours editor portion of the existing form into
`src/app/dashboard/settings/scheduling/page.tsx` (same API calls, same `PUT /api/businesses/{id}` shape,
just a different form on a different page) so "Business setup" only holds identity fields and "Scheduling"
only holds hours, matching the reference's card split. This is a UI-only split of one existing form into
two; it must still submit to the same route with the same payload shape, just triggered from two places.
If time is tight, skip this task and keep opening hours inside "Business setup" — do not let this optional
split block shipping the rest of the plan.

### Task 8.4 — Billing card (real, small)

**File: `src/app/dashboard/settings/billing/page.tsx`** — fetch the business's `Subscription` (already a
real relation: `plan`, `status`, `currentPeriodStart`, `currentPeriodEnd`) and show it plainly: current
plan name, status, period dates if set. Add the three plan cards from the proposal's Section 6
(Starter/Professional/Premium) as read-only reference info with their real LKR prices from the PDF, and a
note "Contact ADNAVRA to change your plan" (there is no self-serve billing/payment flow yet — do not build
a fake "Upgrade" button that goes nowhere).

---

## PHASE 9 — Top bar functional wiring

### Task 9.1 — Search (honest scope)

The reference's top-bar search searches across the entire Fresha workspace (clients, appointments,
services). Building true global search is out of scope for this pass. Wire the search icon
(`src/components/dashboard/topbar.tsx`) to open a small popover with **one** working search: client name
lookup against `GET /api/customers?businessId=...&q=...` (confirm this route already supports a `q` filter;
if not, that is a small additive query-param addition, same pattern as the marketplace search's `q` param
from the earlier plan). Do not present it as searching "everything" if it only searches clients — label the
placeholder accurately: `"Search clients..."`.

### Task 9.2 — Real notification badge (or no badge)

There is no notification system. The most honest, still-useful version: count of `Booking` rows with
`status: "PENDING"` for this business (appointments awaiting the owner's confirmation, if the business uses
that status — check whether `POST /api/bookings` ever creates `PENDING` vs always `CONFIRMED`; per the
`bookings/route.ts` code already reviewed, public bookings are created as `CONFIRMED` directly, so today
there may be no natural `PENDING` state a professional needs to act on. In that case, **do not fabricate a
badge count** — leave the bell with no badge until there is a real actionable-notification concept (e.g. a
new-booking-just-came-in feed), and note this as a roadmap gap rather than shipping a fake "2".

### Task 9.3 — Reports shortcut icon

The bar chart icon in the top bar (`src/components/dashboard/topbar.tsx`) already links to
`/dashboard/reports` in Task 1.2's snippet — confirm this stays true after Phase 7 ships.

---

## PHASE 10 — QA checklist

1. `npm run lint && npm run test && npm run build` pass.
2. **The exact flow the founder described**: sign up as a new business owner → complete onboarding
   (business name → categories → team size → location type → physical location + address autocomplete +
   map pin + edit-location modal) → land on `/dashboard/qr-code` **without any redirect loop back to
   onboarding** → QR image renders → decode/open it → lands on the correct `/{slug}` public profile →
   "Book now" → full booking wizard → confirmed booking → booking appears in
   `/dashboard/sales/appointments` and on `/dashboard` Home.
3. Log out and back in as that same owner → dashboard still works identically (confirms the fix was the
   session-update push, not something that only works within the same tab session).
4. Every new dark-themed dashboard page renders with no leftover light-theme classes (`text-[#101828]`,
   `bg-white`, `bg-[#F7F9FC]`) — grep for these under `src/app/dashboard/**` and `src/components/dashboard/**`
   after the rebuild and confirm zero matches outside intentionally-white elements like button labels on a
   white pill.
5. Every `ComingSoon` page is reachable from its sidebar link and shows no fabricated numbers, no fake
   tables, no invented review counts or ratings.
6. `/dashboard/settings/billing` shows the real `Subscription` row for the test business, not a hardcoded
   plan name.
7. Deleting `src/components/dashboard/nav.tsx` (Task 1.5's last step) does not leave any page importing it
   — grep for `DashboardNav` across `src/` and confirm zero remaining imports before deleting the file.
8. A `STAFF`-role account (not `OWNER`) can reach the dashboard shell and see Calendar/Sales/Clients but
   confirm existing role-based restrictions (if any exist elsewhere in the API layer) are not weakened by
   the new routes — the new pages are presentation-only wrappers around existing, already-guarded API
   calls, so this should already hold, but verify by testing as a `STAFF` user once.

---

## Summary of every new/changed/deleted file

**New files**
```
src/components/providers/session-provider.tsx
src/components/dashboard/sidebar.tsx
src/components/dashboard/topbar.tsx
src/components/dashboard/continue-setup-pill.tsx
src/components/dashboard/account-menu.tsx
src/components/dashboard/section-shell.tsx
src/components/dashboard/coming-soon.tsx
src/app/dashboard/sales/layout.tsx
src/app/dashboard/sales/page.tsx
src/app/dashboard/sales/daily-summary/page.tsx
src/app/dashboard/sales/appointments/page.tsx
src/app/dashboard/sales/sales/page.tsx
src/app/dashboard/sales/payments/page.tsx
src/app/dashboard/sales/gift-cards/page.tsx
src/app/dashboard/sales/packages/page.tsx
src/app/dashboard/sales/memberships/page.tsx
src/app/dashboard/clients/layout.tsx
src/app/dashboard/clients/page.tsx
src/app/dashboard/clients/list/page.tsx
src/app/dashboard/clients/segments/page.tsx
src/app/dashboard/clients/loyalty/page.tsx
src/app/dashboard/clients/reputation/page.tsx
src/app/dashboard/catalog/layout.tsx
src/app/dashboard/catalog/page.tsx
src/app/dashboard/catalog/service-menu/page.tsx
src/app/dashboard/catalog/packages/page.tsx
src/app/dashboard/catalog/products/page.tsx
src/app/dashboard/catalog/stocktakes/page.tsx
src/app/dashboard/catalog/stock-orders/page.tsx
src/app/dashboard/catalog/suppliers/page.tsx
src/app/dashboard/team/layout.tsx
src/app/dashboard/team/page.tsx
src/app/dashboard/team/members/page.tsx
src/app/dashboard/team/shifts/page.tsx
src/app/dashboard/team/timesheets/page.tsx
src/app/dashboard/team/pay-runs/page.tsx
src/app/dashboard/reports/layout.tsx
src/app/dashboard/reports/page.tsx
src/app/dashboard/marketing/page.tsx
src/app/dashboard/apps/page.tsx
src/app/dashboard/settings/business/page.tsx
src/app/dashboard/settings/scheduling/page.tsx   (optional, Task 8.3)
src/app/dashboard/settings/sales/page.tsx
src/app/dashboard/settings/clients/page.tsx
src/app/dashboard/settings/billing/page.tsx
src/app/dashboard/settings/team/page.tsx
src/app/dashboard/settings/forms/page.tsx
src/app/dashboard/settings/payments/page.tsx
```

**Edited files**
```
src/lib/auth.ts                          (Task 0.1 — jwt trigger:"update" handling)
src/app/dashboard/onboarding/page.tsx    (Task 0.2 — push session update before redirect)
src/app/dashboard/layout.tsx             (Task 0.3 exclusion list, Task 1.5 new shell, business name fetch)
src/app/layout.tsx                       (wrap in SessionProvider if not already present)
src/app/dashboard/page.tsx               (Task 2.1 — becomes Home, old content moves to sales/appointments)
src/app/dashboard/calendar/page.tsx      (Task 2.2 — dark restyle only, logic unchanged)
src/app/dashboard/settings/page.tsx      (Task 8.1 — becomes the hub grid; old form moves to settings/business)
```

**Deleted files**
```
src/components/dashboard/nav.tsx   (delete only after Task 10.7's grep confirms no remaining imports)
src/app/dashboard/customers/page.tsx   (content moved to clients/list/page.tsx — delete after confirming
                                         the new route works, or leave as a `redirect("/dashboard/clients/list")`
                                         if any external link/bookmark to the old path needs to keep working)
src/app/dashboard/services/page.tsx    (content moved to catalog/service-menu/page.tsx — same redirect note)
src/app/dashboard/staff/page.tsx       (content moved to team/members/page.tsx — same redirect note)
```

Prefer turning the three "old path" files into one-line `redirect(...)` server components rather than
deleting them outright, so any QR code, bookmark, or dashboard link a real business owner already saved
(e.g. `/dashboard/services`) keeps working instead of 404ing after this rebuild.
