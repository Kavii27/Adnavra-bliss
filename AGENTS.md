# AGENTS.md — ADNAVRA build rules

## Stack (do not deviate without asking me first)
- Next.js 15 (App Router), TypeScript strict mode
- PostgreSQL via Prisma ORM
- Auth.js (NextAuth v5) with Credentials provider
- Tailwind CSS, shadcn/ui as component primitives, styled per DESIGN.md tokens
- Zod for all input validation
- Deployed on a Hostinger VPS via PM2 + Nginx

## Project structure (follow exactly — do not invent your own layout)
```
adnavra-platform/
├── AGENTS.md                    # build rules — read every session (this file)
├── DESIGN.md                    # design tokens — colors, type, spacing
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
│   │   ├── env.ts                       # validated env vars — see below
│   │   ├── auth.ts                      # Auth.js config
│   │   ├── db.ts                        # Prisma client singleton
│   │   ├── rate-limit.ts                # in-memory limiter for dev, swappable for Redis in prod
│   │   ├── password.ts                  # hashPassword() / verifyPassword() — bcrypt only, never inline
│   │   └── availability.ts              # slot-calculation engine — pure functions, unit tested
│   ├── schemas/                         # Zod schemas, one file per entity (booking.ts, service.ts, ...)
│   └── middleware.ts                    # role-based route protection — first line of defense only
├── tests/
│   └── availability.test.ts             # double-booking race-condition tests
└── scripts/
    └── backup-db.sh                     # daily pg_dump cron job
```
- Anything under `app/[businessSlug]/` and `app/(marketing)/` is public — no auth assumed.
- Anything under `app/dashboard/` and `app/admin/` assumes a logged-in session with a role check in `middleware.ts` *and* a second check inside the actual route/API handler.
- `lib/availability.ts` is separated out — it must be unit-testable in isolation, not buried inside a page component.
- `schemas/` holds every Zod validator so API routes just import and reuse them.

## Non-negotiable rules
- Never invent your own color, spacing, or font values — read DESIGN.md and use its tokens.
- Never use `any` in TypeScript. Never disable strict null checks.
- Every database table with tenant data MUST include a `businessId` column, and every query MUST filter by it. No exceptions, no "I'll add it later."
- Never hash passwords yourself — use bcrypt via a shared `hashPassword()`/`verifyPassword()` utility, cost factor 12.
- Never build raw SQL strings from user input. Prisma only.
- Every mutating API route (POST/PATCH/DELETE) must validate its input with a Zod schema before touching the database.
- Every public-facing form submission endpoint must be rate-limited.
- Never log passwords, tokens, or full card numbers, even in debug output.
- Every new feature must include the loading state and the error state, not just the happy path.
- Do not add comments like "AI-generated" or leave placeholder lorem ipsum text in anything that reaches a real user-facing screen.
- No inline `style={{}}` — use Tailwind classes and DESIGN.md tokens.
- Ask before adding a new npm dependency. Do not casually pull in 10 packages for one feature.
- Icons: use `lucide-react` only. Never use emoji as icons.
- Never use purple-to-pink gradients (`from-purple-500 to-pink-500` etc.) — the palette is warm terracotta (#B85C38) + warm neutrals only.

## How to work
- Take one task from ADNAVRA_BUILD_PLAN.md at a time — do not build the whole app at once.
- After each task, the human will read the diff before accepting — especially anything touching auth, payments, or `businessId` filtering.
- If output looks like a generic Tailwind template (centered hero, purple gradient blob, three feature cards with emoji), reject it and point explicitly back to DESIGN.md.
