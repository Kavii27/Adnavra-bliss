# ADNAVRA — Build Plan for VS Code + AI Agent

This is a task-by-task execution plan. Work top to bottom. Don't skip ahead to Phase 3
because a feature sounds fun — an AI agent left unsupervised will happily build the
marketplace before the login system works, and you'll end up with a pile of disconnected
screens instead of a product. Each task below has:

- **Prompt** — copy this into your AI agent almost verbatim
- **Definition of Done (DoD)** — do not accept the task as finished until every line is true
- **Security note** — non-negotiable, baked into the task itself, not bolted on later

Security is not a phase at the end. It's a line item on every task from Day 1, because
retrofitting security into a working app is how breaches happen.

> **Note on the two reference files this plan creates:** `AGENTS.md`'s full content is
> written out below in Task 1.3 — you copy it directly into a new file. `DESIGN.md` is
> **not** written out below — it comes from the `awesome-design-md` repo you downloaded
> (Task 1.1), then gets adapted by your AI agent in Task 1.2. Neither file exists until
> you create them following those two tasks.

---

## 0. Before you open VS Code — install these

| Tool | Why |
|---|---|
| **Node.js 20 LTS** | Runtime for Next.js |
| **Git** | Version control — non-negotiable, even solo |
| **VS Code** | Your editor |
| **VS Code AI agent** (Claude Code, Cursor, or GitHub Copilot Chat in agent mode) | Executes the tasks below |
| **A free Neon or Supabase account** | Hosted Postgres for development — no local database install needed |
| **GitHub account** | Where your code lives; also how you'll deploy |
| **A password manager** (Bitwarden/1Password) | You're about to generate a lot of secrets — don't put them in Notes app |

Create a **private** GitHub repo now, called `adnavra-platform`. Clone it locally. Everything
below happens inside this repo.

---

## 1. Get the design system in place first (before any app code)

You uploaded `awesome-design-md`. Here's what it actually is and how to use it correctly —
this is the single biggest lever against your "looks AI-generated" concern.

**What DESIGN.md solves:** AI coding agents left to their own devices default to the same
visual patterns every time — purple-to-blue gradients, glassmorphism cards, generic
Inter-font hero sections, emoji as icons, `bg-gradient-to-r from-purple-500 to-pink-500`.
That's the "vibe coded" look you're trying to avoid. A DESIGN.md file is a locked design
token spec — exact colors, type scale, spacing, border radii — that the agent must obey
instead of inventing.

**Task 1.1 — Bring in a base design system**

1. Copy the repo you downloaded into `design-reference/` in your project (don't commit the
   whole zip, just the one file you'll use).
2. Best starting points for a booking platform, ranked:
   - `design-md/cal/DESIGN.md` — closest analog (scheduling software), clean neutral UI
   - `design-md/linear.app/DESIGN.md` — if you want a more premium, dark, precise feel
   - `design-md/notion/DESIGN.md` — if you want warm, approachable, salon/beauty-appropriate
3. Copy your chosen file to the project root as `DESIGN.md`.

**Task 1.2 — Make it actually ADNAVRA's, not a copy of someone else's brand**

Prompt for your agent:
```
Read DESIGN.md. I want you to adapt it into a new design system for a Sri Lankan
salon-booking SaaS called ADNAVRA. Keep the structural rules (spacing scale, radius
scale, type scale, shadow system) but replace the color palette with a new one built
around [pick: warm terracotta / deep teal / muted rose — pick ONE, salon-appropriate,
not generic AI purple]. Do not use purple-to-pink gradients anywhere. Do not use emoji
as icons — use a proper icon set (lucide-react). Rewrite the `description` field to
describe ADNAVRA specifically. Output the result as an updated DESIGN.md.
```

**DoD:**
- [ ] `DESIGN.md` exists at project root with ADNAVRA's own color palette (not a copy-pasted brand's colors)
- [ ] No purple/pink gradient anywhere in the token file
- [ ] A real icon library is specified (lucide-react), not emoji
- [ ] You've picked one accent color and one neutral scale — not five competing colors

**Task 1.3 — Write AGENTS.md (the build-rules file, separate from the design-rules file)**

This is the file your coding agent reads on every session to know *how* to build, not
*how it should look*. Create `AGENTS.md` at project root with this content (edit the
bracketed parts, keep the rest):

```markdown
# AGENTS.md — ADNAVRA build rules

## Stack (do not deviate without asking me first)
- Next.js 15 (App Router), TypeScript strict mode
- PostgreSQL via Prisma ORM
- Auth.js (NextAuth v5) with Credentials provider
- Tailwind CSS, shadcn/ui as component primitives, styled per DESIGN.md tokens
- Zod for all input validation
- Deployed on a Hostinger VPS via PM2 + Nginx

## Non-negotiable rules
- Never invent your own color, spacing, or font values — read DESIGN.md and use its tokens.
- Never use `any` in TypeScript. Never disable strict null checks.
- Every database table with tenant data MUST include a `businessId` column, and every
  query MUST filter by it. No exceptions, no "I'll add it later."
- Never hash passwords yourself — use bcrypt via a shared `hashPassword()`/`verifyPassword()`
  utility, cost factor 12.
- Never build raw SQL strings from user input. Prisma only.
- Every mutating API route (POST/PATCH/DELETE) must validate its input with a Zod schema
  before touching the database.
- Every public-facing form submission endpoint must be rate-limited.
- Never log passwords, tokens, or full card numbers, even in debug output.
- Every new feature must include the loading state and the error state, not just the happy path.
- Do not add comments like "AI-generated" or leave placeholder lorem ipsum text in
  anything that reaches a real user-facing screen.
- No inline `style={{}}` — use Tailwind classes and DESIGN.md tokens.
- Ask before adding a new npm dependency. Do not casually pull in 10 packages for one feature.
```

**DoD:**
- [ ] `AGENTS.md` and `DESIGN.md` both committed to git before any feature code is written
- [ ] You've actually read both files yourself once — don't just generate and forget them

---

## 2. Project scaffold

**Task 2.1 — Initialize the project**

Before this task: go to [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com),
create a free account, and create one project. Copy the connection string it gives you —
you'll paste it into `.env` in a moment. This is your development database; no local
install needed. (You'll create a **separate** project there for production later — never
develop against your live production database.)

Prompt:
```
Create a new Next.js 15 project with TypeScript, App Router, Tailwind CSS, and ESLint.
Set up Prisma with a PostgreSQL datasource, reading the connection string from
DATABASE_URL. Add .env.example listing every environment variable needed so far
(DATABASE_URL, NEXTAUTH_SECRET, etc.), and add .env to .gitignore. Do not set up Docker
or a local database — we're using a hosted Postgres instance for development.
```

**DoD:**
- [ ] `.env` contains your Neon/Supabase connection string as `DATABASE_URL`
- [ ] `npx prisma db push` (or your first migration) connects successfully to the hosted database
- [ ] `npm run dev` works
- [ ] `.env` is gitignored — actually check `git status` shows it's not tracked
- [ ] `.env.example` has placeholder values, never real secrets

> **Supabase-specific note:** Supabase's Connect panel gives you two different URLs —
> a pooled one (port 6543, for your app's normal queries) and a direct one (port 5432,
> for running migrations). Put both in `.env` as `DATABASE_URL` and `DIRECT_URL`, and
> tell your agent: *"My Prisma datasource needs both a url (pooled) and a directUrl
> (direct) field, since I'm using Supabase's connection pooler."* Without the
> `directUrl`, migrations can fail or hang against a pooled connection.

**Note on Redis / rate limiting:** the plan below assumes Redis-backed rate limiting in
production (Section 6). For local development, skip Redis entirely — use a simple
in-memory rate limiter (a `Map` tracking attempts per key, reset on server restart). It's
not production-safe across multiple server instances, but it's fine for solo local dev.
Tell your agent explicitly: *"Use an in-memory rate limiter for now since we're not
running Redis locally — but structure the code so swapping in a real Redis client later
is a one-file change."* You'll switch to real Redis (e.g. a free Upstash Redis instance)
when you deploy to Hostinger in Section 7.

**Task 2.2 — Lock down secrets handling from day one**

Prompt:
```
Set up a config module (src/lib/env.ts) that validates all environment variables at
startup using Zod, and throws a clear error if any required variable is missing.
Never read process.env directly anywhere else in the app — always import from this module.
```

**Security note:** this one habit — validating env vars at boot instead of discovering a
missing `DATABASE_URL` in production at 2am — is the difference between amateur and
professional setups.

**Task 2.3 — Target file structure**

This is what your project should look like once Task 2.1 finishes and you start adding
features. Give this to your agent as a reference so it doesn't scatter files randomly or
invent its own layout mid-project:

```
adnavra-platform/
├── AGENTS.md                    # build rules — read by your AI agent every session
├── DESIGN.md                    # design tokens — colors, type, spacing (adapted from awesome-design-md)
├── .env                         # real secrets — gitignored, never committed
├── .env.example                 # placeholder values, safe to commit
├── package.json
├── next.config.js               # security headers (CSP, X-Frame-Options) live here
├── prisma/
│   ├── schema.prisma            # Business, Service, Booking, User, Subscription models
│   └── migrations/              # auto-generated, one folder per migration — commit these
├── src/
│   ├── app/                             # Next.js App Router
│   │   ├── (marketing)/                 # public marketing pages
│   │   │   └── page.tsx                 # ADNAVRA landing page
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── [businessSlug]/              # public salon booking page, e.g. /glow-salon
│   │   │   ├── page.tsx                 # salon profile + services
│   │   │   └── book/page.tsx            # slot picker + booking form
│   │   ├── dashboard/                   # owner/staff portal — requires auth
│   │   │   ├── layout.tsx               # role check happens here AND in each route handler
│   │   │   ├── page.tsx                 # today's bookings
│   │   │   ├── services/page.tsx
│   │   │   ├── calendar/page.tsx
│   │   │   ├── customers/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── admin/                       # platform admin portal — ADMIN role only
│   │   │   ├── layout.tsx
│   │   │   ├── businesses/page.tsx
│   │   │   └── subscriptions/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── bookings/route.ts        # every handler re-checks businessId ownership
│   │       ├── services/route.ts
│   │       └── webhooks/                # future: payment gateway callbacks
│   ├── components/
│   │   ├── ui/                          # shadcn primitives, styled per DESIGN.md tokens
│   │   └── booking/                     # booking-flow-specific components
│   ├── lib/
│   │   ├── env.ts                       # validated env vars — see Task 2.2
│   │   ├── auth.ts                      # Auth.js config
│   │   ├── db.ts                        # Prisma client singleton
│   │   ├── rate-limit.ts                # in-memory limiter for dev, swappable for Redis in prod
│   │   ├── password.ts                  # hashPassword() / verifyPassword() — bcrypt only, never inline
│   │   └── availability.ts              # the slot-calculation engine — pure functions, unit tested
│   ├── schemas/                         # Zod schemas, one file per entity (booking.ts, service.ts, ...)
│   └── middleware.ts                    # role-based route protection — first line of defense only
├── tests/
│   └── availability.test.ts             # the double-booking race-condition test from Task 3.1
└── scripts/
    └── backup-db.sh                     # the daily pg_dump cron job from Section 7
```

**Rules of thumb baked into this layout:**
- Anything under `app/[businessSlug]/` and `app/(marketing)/` is public — no auth assumed.
- Anything under `app/dashboard/` and `app/admin/` assumes a logged-in session with a role check in `middleware.ts` *and* a second check inside the actual route/API handler.
- `lib/availability.ts` is separated out on purpose — it's the piece Task 5.2 needs to unit-test in isolation, not something buried inside a page component.
- `schemas/` holds every Zod validator so API routes just import and reuse them instead of redefining validation ad hoc per route.

**DoD:**
- [ ] Folder structure matches this layout before you start Task 3 (database schema)
- [ ] `AGENTS.md` explicitly tells the agent to follow this structure for anything new it creates

---

## 3. Database schema (do this before any UI)

**Task 3.1 — Core schema**

Prompt:
```
Create a Prisma schema with these models: Business, Service, StaffMember, Customer,
Booking, User (with role enum: CUSTOMER, OWNER, STAFF, ADMIN), Subscription (with plan
enum: STARTER, PROFESSIONAL, PREMIUM, and status enum: ACTIVE, SUSPENDED, CANCELLED).
Every model that belongs to a business must have a businessId foreign key with an index
on it. Add a unique constraint preventing two bookings for the same staff member at
overlapping times at the database level, not just application logic. Add createdAt and
updatedAt timestamps to every model. Generate and run the initial migration.
```

**DoD:**
- [ ] Migration runs clean against your local Docker Postgres
- [ ] Every tenant-scoped table has a `businessId` index — check the generated SQL, don't just trust it
- [ ] There is a real database-level constraint against double-booking, not just app-level checking (a race condition between two simultaneous requests must be impossible)

**Security note:** relying only on "check availability, then insert" in application code
has a race condition — two customers can book the same slot if requests land at the same
millisecond. A unique constraint or a transaction with `SELECT ... FOR UPDATE` closes
that gap. Make your agent prove this works by writing a test that fires two bookings at
the same slot simultaneously and confirms exactly one succeeds.

---

## 4. Authentication — do this properly, it's the highest-risk part of the app

**Task 4.1 — Signup and login**

Prompt:
```
Implement authentication using Auth.js v5 with the Credentials provider. Passwords must
be hashed with bcrypt at cost factor 12, never stored or logged in plaintext. Login and
signup error messages must be generic ("invalid email or password") — never reveal
whether the email exists in the system. Sessions must use httpOnly, secure, sameSite=lax
cookies. Add rate limiting on the login endpoint: max 5 attempts per email per 15 minutes,
using Redis. Add rate limiting on the signup endpoint: max 3 signups per IP per hour.
```

**DoD:**
- [ ] Passwords are never visible in any log, response, or database column as plaintext
- [ ] Login failure message is identical whether the email exists or not
- [ ] Rate limiting actually triggers — test it by hammering the login endpoint 6 times and confirming the 6th is blocked
- [ ] Session cookie has `httpOnly`, `secure`, `sameSite` flags set — check this in browser devtools, not just trust the agent's word
- [ ] There's a password reset flow that uses a single-use, time-limited token (not the actual password) sent by email

**Task 4.2 — Role-based access control**

Prompt:
```
Add middleware that enforces role-based access: /dashboard/* requires OWNER or STAFF role
and the user's businessId must match the resource being accessed. /admin/* requires ADMIN
role. Every API route must independently re-check permissions server-side — the middleware
is a first line of defense, not the only one.
```

**Security note:** the phrase "the middleware is not the only one" matters — a common
mistake is trusting client-side role checks or a single middleware gate. Every API route
handler should independently verify "does this user own this business" before returning
or mutating data, because middleware can be misconfigured or bypassed.

**DoD:**
- [ ] A staff account from Salon A cannot fetch Salon B's bookings by guessing/changing an ID in the URL or request body — actually test this manually
- [ ] Admin routes reject non-admin sessions with 403, not a redirect that leaks data first

---

## 5. Core booking features (this is the actual MVP)

Build in this order — each depends on the last:

**Task 5.1 — Business profile + services CRUD** (owner creates profile, logo upload, services with price/duration, opening hours)

**Task 5.2 — Availability engine** (the hard part)
```
Build a function that, given a service duration and a date, returns the bookable time
slots for a business — accounting for opening hours, existing bookings, and staff
schedules if assigned. Write unit tests covering: back-to-back bookings, a booking that
would overlap opening-hours boundaries, and a fully-booked day. This must be pure,
testable logic, not embedded directly in a page component.
```
**DoD:** unit tests exist and pass; you can't book a slot that overlaps another booking, even via a raw API call bypassing the UI.

**Task 5.3 — Public booking flow** (customer picks service → slot → confirms → gets a booking reference)

**Task 5.4 — Owner dashboard** (calendar view, confirm/reschedule/cancel)

**Task 5.5 — QR code generation** (`qrcode` npm package, server-generated, linked to the business's public URL)

For every task in this section, add to the DoD:
- [ ] Every input field is validated with Zod on the server, not just in the browser
- [ ] Every list endpoint (bookings, customers) is paginated — never return an unbounded query
- [ ] Every mutation is scoped to `businessId` from the authenticated session, never trusted from the request body

---

## 6. Harden before you show it to a single real customer

Go through this list literally line by line. Don't move to deployment until every box is checked.

- [ ] **Password hashing:** bcrypt cost 12 (or argon2id if you prefer) — confirmed, not assumed
- [ ] **Rate limiting:** on login, signup, password reset, and the public booking-creation endpoint
- [ ] **Input validation:** every API route has a Zod schema; no field is trusted as-is
- [ ] **SQL injection:** you're only using Prisma's query builder, zero raw SQL string concatenation anywhere
- [ ] **XSS:** you're not using `dangerouslySetInnerHTML` anywhere, or if you must (rich text), it's sanitized with a library like `sanitize-html`
- [ ] **CSRF:** Auth.js handles this for you by default via sameSite cookies — confirm you haven't disabled it
- [ ] **Security headers:** set `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` in `next.config.js` headers()
- [ ] **HTTPS only:** no HTTP endpoint accepts real traffic in production (enforced at Nginx, see deployment)
- [ ] **Secrets:** nothing in `.env` is committed to git — run `git log -p | grep -i "password\|secret\|api_key"` across your whole history to be sure
- [ ] **Least privilege DB user:** the app's Postgres user can only touch its own database, not create/drop other databases
- [ ] **Dependency audit:** run `npm audit` and fix high/critical issues before launch
- [ ] **Backups:** automated daily `pg_dump`, stored somewhere other than the same VPS (see deployment)
- [ ] **Audit log:** a table logging who did what (login, booking cancelled, business suspended) with timestamp and user ID
- [ ] **Error pages:** production errors show a generic message, never a stack trace or database error to the end user

---

## 7. Deploying on Hostinger

> **Not doing this yourself?** If someone else handles the Hostinger server (VPS setup,
> Nginx, PM2, SSH hardening), you can skip the hands-on steps below — that's their job.
> But three things stay yours regardless of who hosts:
> 1. Keep `.env.example` fully current as you add features — it's the handoff list of
>    every variable production needs, without exposing your dev secrets.
> 2. Create a **separate production database** (a new Supabase/Neon project, not your dev
>    one) and generate a fresh `NEXTAUTH_SECRET` for production — never hand over or reuse
>    your development credentials.
> 3. Section 6 (the security checklist) is application-level, not server-level — hosting
>    doesn't fix weak password hashing or missing rate limits. That checklist is on you
>    no matter who deploys the server.

You have two real options on Hostinger. Pick based on how hands-on you want to be.

### Option A — Hostinger Node.js Hosting (managed, easier)
Connect your GitHub repo directly in hPanel → Websites → Add Website → Node.js Apps →
Import Git Repository. Hostinger auto-detects Next.js, handles the build, and gives you
managed SSL. Good if you want fewer moving parts to secure yourself.

### Option B — Hostinger VPS (full control, recommended once you're comfortable)

**Task 7.1 — Provision and lock down the server**
```
SSH into the VPS. Update packages (apt update && apt upgrade -y). Install Node 20 LTS,
PostgreSQL, Nginx, and PM2. Set up a firewall with ufw: allow only SSH (ideally on a
non-default port or IP-restricted), HTTP, and HTTPS. Disable root SSH login — create a
non-root sudo user instead. Install fail2ban to block repeated failed SSH attempts.
```

**Task 7.2 — Deploy the app**
1. Clone your repo onto the VPS (or pull via a GitHub Actions deploy workflow).
2. `npm ci && npm run build`
3. Run the app under PM2 (`pm2 start npm --name adnavra -- start`, `pm2 save`, `pm2 startup`) so it survives reboots.
4. Configure Nginx as a reverse proxy from port 80/443 to your Next.js port (3000).
5. Run Certbot for a free Let's Encrypt TLS certificate — auto-renewing.
6. Set production environment variables directly on the VPS (never commit them) — either in a `.env` file with `600` permissions or via your process manager's env config.

**Task 7.3 — Database and backups**
- Run Postgres on the same VPS (fine at this scale) or use a managed Postgres (Neon/Supabase) for one less thing to secure yourself.
- Set up a daily cron job running `pg_dump`, compress it, and push it somewhere off-server (a cheap S3-compatible bucket like Cloudflare R2 works well and is inexpensive).

**DoD for deployment:**
- [ ] Site is only reachable over HTTPS — HTTP requests redirect to HTTPS
- [ ] SSH is not accessible via password auth from the open internet (key-based only)
- [ ] `pm2 status` shows the app auto-restarts if it crashes
- [ ] A daily backup file actually exists off-server — verify by checking the bucket, don't just trust the cron job ran
- [ ] Environment variables are not visible via any public route or error page

---

## 8. What NOT to build yet

Explicitly out of scope until the above is live and one real salon is using it successfully:
payments, WhatsApp/SMS notifications, the public marketplace search, staff-specific
scheduling, analytics dashboards, loyalty programs. These are Phase 2+ per your own
system analysis document — resist the temptation to let the AI agent "just add" one of
these mid-build, since it will happily do so and derail your MVP timeline.

---

## 9. How to actually work with your AI agent day to day

- Give it **one task from this document at a time**, not "build the whole app."
- After each task, **read the diff yourself** before accepting — especially anything touching auth, payments, or `businessId` filtering.
- If the agent's output looks like a Tailwind template you've seen a hundred times (centered hero, gradient blob, three feature cards with emoji), reject it and point it back at `DESIGN.md` explicitly.
- Re-paste the relevant section of `AGENTS.md` into your prompt if the agent starts drifting from the stack decisions.
- Commit after every completed task with a clear message — this is your rollback safety net when an agent-generated change breaks something.
