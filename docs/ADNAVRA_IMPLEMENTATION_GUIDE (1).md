# ADNAVRA — Implementation Guide (Round 2)

This continues from your existing `ADNAVRA_IMPLEMENTATION_GUIDE.md` /
`ADNAVRA_AGENT_TASKS.md` — it does not replace them. It covers exactly the four
things you flagged: the dead "Salon type" checkboxes, the missing admin-login
link, the fact that salons can't set themselves up so your team has to do it
for them, and deploying to Vercel with a real database. Hand this file to
your coding agent (Claude Code or similar) and work top to bottom — nothing
here was run or tested (no `node_modules`/network in this environment), so
each task ends with a Verify step to click through yourself.

Quick answer first, since it's not a code task:

## Why is the zip only ~6–9 MB?
That's expected, not a problem. The zip does not contain `node_modules`
(hundreds of MB of installed packages your `package.json` describes but that
get reinstalled with `npm install`), `.next` (the build output), or `.git`
history. Source code, Prisma schema, and config for a project this size
genuinely is only a few MB — the zip is complete, nothing is missing. You can
confirm after unzipping by running `npm install` and `npm run build`; if that
succeeds, everything needed was in the zip.

---

## Task 1 — "Salon type" tags do nothing (screenshot bug)

### Root cause, verified by reading the code
`src/app/dashboard/settings/business/page.tsx` (~line 343) shares the same
4-slot array (`Business.categories`) between two *different* pickers:
onboarding's "business category" (up to 4, picked in
`src/components/onboarding/step-categories.tsx`) and this page's "Salon type"
tags (Unisex, Gents only, etc., from `BUSINESS_TYPES` in
`src/lib/categories.ts`). The label literally computes
`Math.max(0, 4 - otherCategoriesAlreadyUsed)`. Almost every salon picks 3–4
categories during onboarding, so by the time they reach Settings there are 0
slots left — every checkbox renders disabled (`opacity-40`,
`cursor-not-allowed`), which is exactly what your screenshot shows. It isn't
broken so much as designed to always be full.

### Fix — give Salon type its own column, stop sharing slots
This needs a small migration; it's the correct fix rather than a workaround.

**1. `prisma/schema.prisma`** — add a new column next to `categories` (~line 99):
```prisma
categories   String[]      @default([])
salonTypes   String[]      @default([])   // NEW — Unisex/Gents/Ladies/etc, independent of categories
```

**2. Create the migration** (agent should run this, don't hand-write the SQL):
```bash
npx prisma migrate dev --name add_salon_types_column
```

**3. `src/schemas/business.ts`** — add the field to both schemas, capped
independently of `categories`:
```ts
categories: z.array(z.string()).max(4).optional(),
salonTypes: z.array(z.string()).max(4).optional(),   // NEW
```
(do this in both `createBusinessSchema` and `updateBusinessSchema`)

**4. `src/lib/categories.ts`** — `isBusinessTypeSlug` is no longer needed for
splitting one array, but keep it (still useful for labeling); no change
required here.

**5. `src/app/dashboard/settings/business/page.tsx`** — replace the shared-slot
logic:
- Load `salonTypes` from `business.salonTypes` instead of filtering
  `business.categories` by `isBusinessTypeSlug`.
- Change the legend text to a fixed cap: `Pick up to 4.`
- `disabled` becomes `!active && salonTypes.length >= 4` (no more
  `otherCount` dependency).
- In `handleSave`, send `salonTypes` as its own field in the PATCH payload
  instead of merging it into `categories`.

**6. `src/app/api/businesses/[id]/route.ts` (PATCH)** and
**`src/app/api/businesses/route.ts` (POST)** — pass `salonTypes` through to
`db.business.update` / `db.business.create` same as `categories`.

**7. Anywhere `categories` is read to render salon-type tags publicly** —
`src/app/[businessSlug]/page.tsx` and `src/components/customer/home/venue-card.tsx`
(grep for `isBusinessTypeSlug` to find every read site) — read from
`business.salonTypes` instead of filtering `categories`.

**8. Search filtering** — `src/app/api/marketplace/search/route.ts` and
`src/components/customer/home/advanced-search.tsx`: if "Salon type" is a
filter option there, add `salonTypes: { hasSome: [...] }` to the Prisma
`where` clause alongside the existing `categories` filter.

**9. Backfill existing rows** (one-off, in the same migration or a follow-up
script): for businesses that already have type slugs sitting inside
`categories`, copy them into the new `salonTypes` column and strip them out
of `categories`, e.g.:
```sql
UPDATE "Business" SET "salonTypes" = ARRAY(
  SELECT unnest("categories") INTERSECT SELECT unnest(ARRAY['unisex','gents','ladies','bridal','home-visits','spa-resort','kids'])
);
UPDATE "Business" SET "categories" = ARRAY(
  SELECT unnest("categories") EXCEPT SELECT unnest(ARRAY['unisex','gents','ladies','bridal','home-visits','spa-resort','kids'])
);
```

### Verify (Task 1)
1. Open a salon that already has 4 onboarding categories → go to Settings →
   Business. "Salon type" should now say "Pick up to 4" and every checkbox
   should be clickable.
2. Toggle 2–3 tags, save, reload the page — they should persist.
3. Open that salon's public page and its marketplace card — the tags should
   show up, and picking 4 onboarding categories should not remove them.

---

## Task 2 — Admin login link in the footer

`src/components/marketing/site-footer.tsx` has no admin link at all right
now — there's no separate `/admin/login`, admin uses the same shared
`/login` page and gets redirected into `/admin` if their account's `role` is
`ADMIN` (see `src/app/admin/layout.tsx`). So the fix is just adding a link
that points there.

In `src/components/marketing/site-footer.tsx`, in the bottom copyright bar,
add a small link:
```tsx
<div className="max-w-[1200px] mx-auto border-t border-[#ccc6bd]/40 mt-10 pt-6 text-xs text-[#7b766f] flex items-center justify-between">
  <span>© {new Date().getFullYear()} ADNAVRA. All rights reserved. Colombo, Sri Lanka.</span>
  <Link href="/login?callbackUrl=/admin" className="hover:text-[#050504] transition-colors">
    Admin
  </Link>
</div>
```
Keep it small and unobtrusive (it's an internal tool, not a customer-facing
feature) — a plain text link in the footer's fine print row is enough; no
need for a "For business" style card.

### Verify (Task 2)
Scroll to the footer on any marketing page → click "Admin" → should land on
`/login`, and logging in with an `ADMIN`-role account should land in
`/admin`; logging in with a non-admin account should show the "Forbidden"
screen already built into `src/app/admin/layout.tsx`.

---

## Task 3 — Salons can't set themselves up; your team has to do it for them

This is the real gap, and it's bigger than a bug fix — you need an
**admin-run onboarding path**, separate from the self-serve one that already
exists for salons who *can* do it themselves. Good news: most of the backend
already supports this — it was built with `ADMIN` as a bypass role on
several endpoints, it's just missing the admin-side screens.

### What already works today (verified in the code)
- `POST /api/businesses` — an `ADMIN` session can create a business (not just
  an `OWNER` creating their own). ✅ already supports this.
- `PATCH /api/businesses/[id]` — `ADMIN` can edit *any* business, not just
  their own. ✅
- `POST /api/services` — `ADMIN` can create services for any `businessId`
  they pass in. ✅
- `src/components/admin/business-images-manager.tsx` +
  `src/app/admin/businesses/[id]/images/page.tsx` — a working admin-side
  image manager already exists, built exactly for this "manage on their
  behalf" use case ("Replace the logo, cover, or gallery for this salon
  without signing in as the owner"). This is your template to copy for
  services/prices/categories.

### What's actually missing
- `src/app/admin/businesses/page.tsx` is a placeholder —
  `return <div>Admin Businesses (Task 4.2)</div>;` — there is no list, no
  "create new salon" button, no detail page besides the images sub-page.
- There is no way for an admin to create the **salon owner's login account**
  on their behalf. `POST /api/auth/signup` only lets someone sign themselves
  up with their own email/password. Admin needs a parallel flow that: creates
  the `Business` row, creates a `User` row with `role: OWNER` and
  `businessId` set, and gives the admin a way to hand credentials to the
  salon (a generated temporary password shown once, or a password-reset link
  they can forward).
- There is no admin-side services/pricing manager (only the images one
  exists).

### Task 3.1 — Admin businesses list + "Add salon" entry point
Build out `src/app/admin/businesses/page.tsx` for real:
- Table of all businesses (`GET /api/businesses` already returns all of them
  for an `ADMIN` session — reuse it).
- Columns: name, slug, city, subscription plan, owner email, created date.
- A search box (filter client-side or add a `?q=` param to the API route).
- An "Add salon" button opening the form from Task 3.2.
- Each row links to a detail page (new: `src/app/admin/businesses/[id]/page.tsx`,
  doesn't exist yet) with tabs: Profile, Services, Images (link to the
  existing images page), Categories/Salon type.

### Task 3.2 — "Add salon" form + the missing admin-create-account API
New endpoint, `src/app/api/admin/businesses/route.ts`, `POST` only:
- Auth-gate to `role === "ADMIN"` (same pattern as
  `src/app/api/admin/businesses/[id]/subscription/route.ts` — copy its guard
  style).
- Accepts: business fields (name, slug, address, phone, categories) **plus**
  owner fields (owner name, owner email).
- Generates a random temporary password (e.g. `crypto.randomBytes(9).toString("base64url")`),
  hashes it with the existing `hashPassword` from `src/lib/password.ts`.
- In one `db.$transaction`: create the `Business` (same shape as
  `POST /api/businesses` already does, including the `Subscription` row),
  then create the `User` with `role: "OWNER"`, the hashed temp password, and
  `businessId` set to the new business.
- Returns the plaintext temp password **once**, in the API response only —
  never store it in plaintext, never log it. The admin UI should show it in a
  "copy this now, it won't be shown again" box, same UX pattern as an API-key
  reveal.
- `auditLog(...)` the creation, same as the existing business-create route.

Admin-side form (`src/components/admin/create-business-form.tsx`, new): plain
form with business fields + owner name/email, submits to the new endpoint,
then shows the generated password in a copyable box on success.

### Task 3.3 — Admin services manager (reuse the images-manager pattern)
Copy the shape of `business-images-manager.tsx` for services:
- New component `src/components/admin/business-services-manager.tsx` — same
  idea as the owner-facing service manager the salon would otherwise use at
  `src/app/dashboard/catalog/service-menu` (open that file for the exact form
  fields: name, description, duration, price, category), but parameterized
  with a `businessId` prop like the images manager is, and calling
  `POST/PATCH/DELETE /api/services` with that `businessId` instead of relying
  on the signed-in session's own business.
- New page `src/app/admin/businesses/[id]/services/page.tsx`, following the
  exact auth-guard pattern already used in
  `src/app/admin/businesses/[id]/images/page.tsx` (double-check `role === "ADMIN"`
  inside the page too, don't rely on the layout alone — that's an explicit
  rule in your `AGENTS.md`).

### Task 3.4 — Categories / Salon type, admin-side
Once Task 1's split is in place, the business detail page's "Profile" tab
should expose the same category and salon-type pickers as the owner's
Settings → Business page — literally reuse that page's picker JSX as a
shared component (`src/components/business/category-picker.tsx`, extract it)
so admin and owner always stay in sync and you never have two copies of the
same logic drifting apart.

### Verify (Task 3)
1. As admin, create a new salon with a fresh owner email → get the temp
   password back.
2. Log out, log in as that owner email with the temp password → land in
   `/dashboard`.
3. As admin, go to that salon's detail page, add 2–3 services with prices,
   upload a logo/cover via the existing images page, set salon type tags.
4. Confirm all of that shows up on the salon's public page and marketplace
   card without the owner having touched anything.

---

## Task 4 — Deploy to Vercel with a real database

Your `.env.example` already documents the exact shape needed (Postgres via
Neon or Supabase, Auth.js secret). Steps:

### 4.1 — Provision the database
Pick one:
- **Neon** (simplest — one connection string): create a project at
  neon.tech, copy the pooled connection string into both `DATABASE_URL` and
  `DIRECT_URL` (Neon's pooled string works for both with Prisma 6).
- **Supabase**: create a project, use the **pooled** connection string
  (port 6543) for `DATABASE_URL` and the **direct** one (port 5432) for
  `DIRECT_URL` — Prisma migrations need the direct connection, the app runtime
  uses the pooled one. Your `.env.example` already calls this out.

### 4.2 — Push the schema
From your local machine (or the coding agent's sandbox) with the real
`DATABASE_URL`/`DIRECT_URL` set:
```bash
npx prisma migrate deploy
```
This applies every migration in `prisma/migrations/` (including the new one
from Task 1) to the live database in order — don't use `migrate dev` against
production, that's for local schema iteration only.

### 4.3 — Create your first admin account
There's currently no seed script for this — add one, it's needed every time
you stand up a fresh database. New file `scripts/make-admin.ts`:
```ts
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] ?? "Admin";
  if (!email || !password) {
    console.error("Usage: tsx scripts/make-admin.ts <email> <password> [name]");
    process.exit(1);
  }
  const db = new PrismaClient();
  const hashed = await hashPassword(password);
  await db.user.upsert({
    where: { email },
    update: { role: "ADMIN", password: hashed },
    create: { email, password: hashed, name, role: "ADMIN" },
  });
  console.log(`Admin account ready: ${email}`);
  await db.$disconnect();
}
main();
```
Run once against the production `DATABASE_URL`:
```bash
npx tsx scripts/make-admin.ts you@adnavra.com "a-strong-password" "Founder"
```

### 4.4 — Vercel project setup
1. Push this repo to GitHub (Vercel deploys from a git provider, not a raw
   zip).
2. In Vercel: New Project → import the repo → framework auto-detects Next.js.
3. Environment variables (Project Settings → Environment Variables), add for
   **Production** (and Preview if you want staging to work too):
   - `DATABASE_URL`, `DIRECT_URL` — from step 4.1
   - `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your production URL, e.g. `https://adnavra.com`
   - `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — optional but
     recommended before real traffic; without them rate-limiting falls back
     to in-memory, which doesn't work across Vercel's serverless instances
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — only if you're turning on
     Google sign-in
4. Deploy. Vercel will run `npm run build`, which runs `next build` — Prisma
   Client generates automatically via the `postinstall` hook if one exists in
   `package.json`; if not, add `"postinstall": "prisma generate"` to
   `package.json` scripts so the client is generated on every deploy.

### Verify (Task 4)
1. Visit the deployed URL — homepage, search, and a salon's public page
   should all load with real data once businesses exist.
2. Log in with the admin account from 4.3, confirm `/admin` loads.
3. Create a salon end-to-end using Task 3's flow, confirm it appears live.
4. Check Vercel's function logs for any Prisma connection errors — if you see
   "too many connections," you're using the direct (non-pooled) URL for
   `DATABASE_URL` at runtime instead of the pooled one.

---

## Suggested order
Task 2 (5 minutes) → Task 1 (isolated, testable on its own) → Task 4 (get a
real database running so Task 3 has something real to test against) →
Task 3 (the biggest piece — build it against the live DB from Task 4 so you
can verify owner login actually works end to end).
