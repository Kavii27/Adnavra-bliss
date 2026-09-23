# ADNAVRA — Audit Results & Next Steps

I read through the actual code your agent produced — not just the file names, the real
logic inside `auth.ts`, the Prisma schema, the migration SQL, the API routes — and ran
`npm install` + a production build against it. Here's the honest state of things.

## The good news first

Your agent did **genuinely professional work** on the backend. Specifically, confirmed
by reading the actual code (not assumed):

- ✅ `AGENTS.md` and `DESIGN.md` both exist and the file structure matches the plan almost exactly
- ✅ Every tenant table has a `businessId` + index, per the multi-tenancy rule
- ✅ Password hashing is bcrypt, cost 12, via a shared helper — never inline
- ✅ Login uses **timing-safe comparison** (a dummy bcrypt hash is compared even when the
  user doesn't exist) so an attacker can't tell valid emails from invalid ones by
  response time — this is a detail most junior implementations miss entirely
- ✅ Rate limiting is applied on login, signup, forgot-password, reset-password, and the
  public booking-creation endpoint
- ✅ Password reset tokens are hashed before storage, single-use, and time-limited
- ✅ Session cookies are `httpOnly`, `sameSite=lax`, and `secure` in production
- ✅ Middleware **and** every API route independently re-check role + `businessId` —
  real defense in depth, not just a single gate
- ✅ Security headers are set in `next.config.js` (CSP, HSTS, X-Frame-Options, etc.)
- ✅ `env.ts` validates all environment variables at boot with Zod
- ✅ **The double-booking protection is done properly** — a real Postgres `EXCLUDE`
  constraint using `btree_gist` on a `tstzrange`, so even two simultaneous requests at
  the database level can't both succeed. This is the correct way to solve this problem
  and most builds get it wrong.
- ✅ Audit logging exists and sanitizes sensitive fields before writing
- ✅ Bookings list endpoint is paginated, not unbounded
- ✅ Signup atomically creates the User + Business in one transaction

None of this is decorative — I read the actual SQL and logic to confirm each point.

## The gaps — in priority order

### 🔴 Priority 1 — this is very likely your "no frontend" problem

`src/app/layout.tsx` uses `next/font/google` to fetch the Inter font live from Google's
servers at build/dev time. I reproduced this exact failure running a production build —
if that network request fails or times out (flaky connection, restrictive network,
Hostinger's build environment not reaching Google), **the entire app fails to compile**,
which looks exactly like "there's no frontend." Fix: stop fetching the font over the
network and use the system font stack your `DESIGN.md`/`globals.css` already defines as
a fallback.

### 🟡 Priority 2 — real, but not blocking

- No test runner is installed. `tests/availability.test.ts` and
  `tests/booking-race.test.ts` exist but there's no `vitest`/`jest` in `package.json` and
  no `npm test` script — so those tests, including the double-booking race test the
  build plan required, have never actually been run.
- The `EXCLUDE` constraint only protects bookings **with a staff member assigned**
  (`WHERE staffMemberId IS NOT NULL`). Unassigned bookings currently rely only on an
  application-level check before insert, which still has a race-condition window.
- `npm audit` has never been run against the installed dependencies.
- The DESIGN.md palette currently implemented is a warm terracotta theme — but earlier
  in our planning you chose "clean, precise, professional, minimal" (the Cal.com-style
  direction). Worth a quick decision: keep terracotta, or have the agent switch to the
  more restrained palette you originally picked.

### 🟢 Priority 3 — later, not urgent

- CSP allows `'unsafe-inline'` and `'unsafe-eval'` in `script-src` — normal for Next.js
  dev/build tooling, but can be tightened with nonces once you're closer to production.
- No staff-management UI yet (the `StaffMember` model exists in the schema but has no
  dashboard page) — this was always a Phase 2 item, not a bug.

---

## Task-by-task fix plan

Work through these in order. Each has a copy-pasteable prompt for your AI agent, the
exact file involved, and a Definition of Done.

### Task 1 — Fix the font fetch (do this first)

**File:** `src/app/layout.tsx`

Prompt for your agent:
```
In src/app/layout.tsx, remove the next/font/google import for Inter — it fetches over
the network at build time and is failing. Replace it with the system font stack already
defined in globals.css (--font-sans). Keep the rest of the layout unchanged.
```

Expected result — `src/app/layout.tsx` should end up close to:
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ADNAVRA — Salon Booking Platform",
  description:
    "ADNAVRA is a Sri Lankan salon-booking SaaS. Warm, premium, and calm — bookings made simple for beauty professionals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#FFFBF8] text-[#1E1C1A]">{children}</body>
    </html>
  );
}
```
`globals.css` already declares `--font-sans: Inter, ui-sans-serif, system-ui, sans-serif;`
— the browser will use Inter if the visitor's device has it installed, and fall back
cleanly to a system font if not. No network dependency, no build failure.

**DoD:**
- [ ] `npm run build` completes with no font-related error
- [ ] `npm run dev` loads `localhost:3000` and you actually see the marketing page

*(Optional, later: if you want Inter guaranteed everywhere regardless of the visitor's
system fonts, download the Inter font files and use `next/font/local` instead — that
self-hosts it with zero runtime network dependency. Not urgent — ask me when you want it.)*

---

### Task 2 — Add a test runner and actually run the existing tests

**Files:** `package.json`, new `vitest.config.ts`

Prompt for your agent:
```
Add Vitest as the test runner. Install vitest as a dev dependency, add a vitest.config.ts
for a Node environment (no browser needed — these are pure function tests), and add a
"test": "vitest run" script to package.json. Then run the existing tests in tests/
and fix anything that fails.
```

**DoD:**
- [ ] `npm test` runs and shows real pass/fail results, not "command not found"
- [ ] `tests/availability.test.ts` passes
- [ ] `tests/booking-race.test.ts` passes — this is the one proving the double-booking
      protection actually works, so don't skip reading its output

---

### Task 3 — Close the unassigned-booking race condition

**Files:** new Prisma migration, `src/app/api/bookings/route.ts`

Prompt for your agent:
```
The current EXCLUDE constraint on bookings only prevents overlap when staffMemberId is
set. Add a second migration with a business-level EXCLUDE constraint that prevents
overlapping bookings for the same businessId when staffMemberId IS NULL (treat
unassigned bookings as competing for a single shared resource). Use the same
tstzrange/gist approach as the existing constraint. Update the POST /api/bookings error
handler to catch this new constraint's violation the same way it catches the existing one.
```

Expected new migration, roughly:
```sql
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_overlap_unassigned"
  EXCLUDE USING gist (
    "businessId" WITH =,
    tstzrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE ("staffMemberId" IS NULL AND "status" != 'CANCELLED');
```

**DoD:**
- [ ] Migration applies cleanly against your Supabase dev database
- [ ] Manually test: create two unassigned bookings for the same business at the same
      time via the API — the second must be rejected with a 409, not succeed

---

### Task 4 — Run a dependency audit

Prompt for your agent:
```
Run npm audit. Fix any "high" or "critical" severity issues by updating the affected
packages, and tell me what changed.
```

**DoD:**
- [ ] `npm audit` shows no unresolved high/critical issues (moderate/low is generally fine to note and revisit later)

---

### Task 5 — Decide the design direction, then apply it

You need to make a call here, not the agent. Reminder: you originally chose "clean,
precise, professional, minimal" (Cal.com-style), but the shipped `globals.css` currently
implements a warm terracotta palette instead.

**If you want to keep terracotta:** no action needed, just confirming the mismatch was
intentional.

**If you want the original clean/minimal direction:** prompt your agent with:
```
Re-read DESIGN.md's structural rules but replace the current warm terracotta palette in
globals.css with a clean, minimal, professional palette in the spirit of Cal.com's
design-md reference — restrained neutrals with a single muted accent color (e.g. a deep
teal or slate blue), not warm/orange tones. Update globals.css, DESIGN.md, and any
hardcoded hex colors currently in components (e.g. the marketing page) to use the new
tokens instead of inline hex values.
```

**DoD:**
- [ ] One conscious decision made and applied consistently — not half-terracotta, half-teal
- [ ] No more raw hex colors hardcoded inline in components — everything pulls from the
      tokens in `globals.css`/`DESIGN.md`

---

## What to do after these five tasks

Once Task 1 is done, actually run `npm run dev`, open `localhost:3000`, and click
through every page yourself: marketing page → sign up → create a business → add a
service → open the public booking page in an incognito window → book a slot → check it
shows up in your dashboard. That manual walkthrough will surface anything this audit
couldn't catch just by reading code (broken links, a form that doesn't submit, a page
that renders blank for a reason unrelated to the font issue).

After that walkthrough, come back and tell me what you find — broken pages, missing
buttons, anything confusing — and we'll turn that into the next task-by-task file. Given
your earlier note that hosting isn't your responsibility, Section 7 of the original
build plan (Hostinger deployment) stays skipped for now; the environment-variable and
security-checklist responsibilities from that section still apply once you're ready to
hand this off.
