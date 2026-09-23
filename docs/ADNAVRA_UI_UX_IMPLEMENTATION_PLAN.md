# ADNAVRA — UI/UX Redesign Implementation Plan

This file is written for an AI coding agent (Claude Code, Cursor, etc.) working directly inside the
`adnavra-platform-dev` repository. Follow the tasks in order. Every task names exact files and gives
exact code. Do not skip tasks. Do not invent new tasks outside this list.

Stack facts (already true in this repo, do not change): Next.js 15 App Router, React 19, TypeScript,
Tailwind CSS v4 (CSS-first config via `@theme inline` in `globals.css`, no `tailwind.config.js`),
Prisma + PostgreSQL, Auth.js v5 (Credentials provider only), `lucide-react` for icons, `qrcode` for QR
generation.

### NO EM DASHES ANYWHERE IF THERE IS REMOVE
---

## 0. Ground rules — read before touching anything

1. **Never edit business logic.** Do not touch: `prisma/schema.prisma` fields that already exist,
   `src/app/api/**` route logic, `src/lib/auth.ts` authorize logic, `src/lib/db.ts`, `src/lib/password.ts`,
   `src/lib/availability.ts`, `src/lib/rate-limit.ts`, `src/lib/audit.ts`, `src/middleware.ts` auth checks,
   `tests/**`. Where a task requires a genuinely new capability (customer signup role, business
   category/location fields, marketplace search), it is called out explicitly as an **ADDITIVE change**
   below — additive means new optional fields / new routes only, so every existing request/response shape
   keeps working exactly as it does today.
2. **Only touch presentation layer**: `*.tsx` page/component files, `globals.css`, `DESIGN.md`, new
   components, new pages, and the two additive schema/route changes called out in Task 6 and Task 9.
3. After every phase, run:
   ```bash
   npm run lint
   npm run test
   npm run build
   ```
   All three must pass before moving to the next phase.
4. No emoji anywhere in the UI — icons are always `lucide-react` components (existing rule, keep it).
5. No em dashes in any copy you write. Use commas, periods, or parentheses instead.
6. No AI-slop phrasing. Avoid: "unlock", "seamless", "supercharge", "elevate your", "game-changing",
   "in today's fast-paced world", "revolutionize". Write plainly, the way the PDF proposal is written.
7. This product is for Sri Lankan salons only. All prices are LKR. Do not add multi-currency logic.

---

## PHASE 1 — Brand colors and assets

### Task 1.1 — Save the logo file

The founder's logo (indigo-to-teal-to-emerald gradient "AD" mark with a scissors motif) needs to be
added to the repo; it was never committed. Ask the founder to export it as a transparent PNG, then:

1. Save it as `public/logo.png` (full color, transparent background, at least 512×512px).
2. Save a square icon-only crop (just the mark, no wordmark if there is one) as `public/logo-icon.png`,
   512×512px, transparent background.
3. From `public/logo-icon.png`, generate the favicon set and place these exact files:
   - `src/app/favicon.ico` (32×32, replaces the existing placeholder)
   - `public/icon-192.png` (192×192)
   - `public/icon-512.png` (512×512)
   - `public/apple-icon.png` (180×180)

   If ImageMagick is available, this can be scripted:
   ```bash
   convert public/logo-icon.png -resize 32x32 src/app/favicon.ico
   convert public/logo-icon.png -resize 192x192 public/icon-192.png
   convert public/logo-icon.png -resize 512x512 public/icon-512.png
   convert public/logo-icon.png -resize 180x180 public/apple-icon.png
   ```

### Task 1.2 — Register the favicon and app icons in metadata

**File: `src/app/layout.tsx`**

Replace the `metadata` export with:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ADNAVRA — Salon Booking Platform for Sri Lanka",
  description:
    "ADNAVRA gives Sri Lankan salons and beauty businesses a dedicated online booking page, a management dashboard, and a QR code, for one predictable monthly fee.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#F7F9FC] text-[#101828]">{children}</body>
    </html>
  );
}
```

Note the body background/text hex values already switched to the new palette defined in Task 1.3.

### Task 1.3 — Replace the color system in `DESIGN.md`

**File: `DESIGN.md`** — replace the `colors:` block with:

```yaml
colors:
  primary: "#26418F"
  primary-active: "#1B3169"
  primary-soft: "#E2E8F9"
  accent: "#14B8A6"
  accent-active: "#0F9488"
  accent-soft: "#DDF3EF"
  ink: "#101828"
  body: "#475467"
  muted: "#8A94A6"
  muted-soft: "#B7BFCB"
  hairline: "#E3E8F0"
  hairline-soft: "#EEF2F7"
  canvas: "#F7F9FC"
  surface-soft: "#EFF4FA"
  surface-card: "#EAF3F2"
  surface-dark: "#0B1220"
  surface-dark-elevated: "#16223A"
  on-primary: "#FFFFFF"
  on-dark: "#F7F9FC"
  on-dark-soft: "#A9B4C4"
  brand-gradient: "linear-gradient(135deg, #1B2E6F 0%, #17879A 50%, #22C08C 100%)"
  success: "#15803D"
  success-soft: "#DCF5E7"
  warning: "#B45309"
  warning-soft: "#FDECD8"
  error: "#B91C1C"
  error-soft: "#FDECEC"
  badge-neutral: "#E7ECF2"
```

Also change the top `description:` line to:

```yaml
description: ADNAVRA — a Sri Lankan salon-booking SaaS. The system is built on a deep indigo-to-teal-to-emerald brand gradient (from the ADNAVRA logo) on a cool off-white canvas. Design voice is clean and confident, not warm/rustic. All icons use lucide-react (never emoji). The palette is one indigo primary + one teal accent + one warm-neutral-free cool gray scale + semantic states.
```

### Task 1.4 — Replace the CSS tokens in `globals.css`

**File: `src/app/globals.css`** — replace entirely with:

```css
@import "tailwindcss";

/* ADNAVRA DESIGN TOKENS — indigo/teal/emerald brand gradient (see DESIGN.md) */
@theme inline {
  --color-primary: #26418f;
  --color-primary-active: #1b3169;
  --color-primary-soft: #e2e8f9;
  --color-accent: #14b8a6;
  --color-accent-active: #0f9488;
  --color-accent-soft: #ddf3ef;
  --color-ink: #101828;
  --color-body: #475467;
  --color-muted: #8a94a6;
  --color-muted-soft: #b7bfcb;
  --color-canvas: #f7f9fc;
  --color-surface-soft: #eff4fa;
  --color-surface-card: #eaf3f2;
  --color-surface-dark: #0b1220;
  --color-hairline: #e3e8f0;
  --font-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  --font-display: "Cal Sans", Inter, sans-serif;
}

:root {
  --background: #f7f9fc;
  --foreground: #101828;
  --brand-gradient: linear-gradient(135deg, #1b2e6f 0%, #17879a 50%, #22c08c 100%);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

.brand-gradient-bg {
  background: var(--brand-gradient);
}

.brand-gradient-text {
  background: var(--brand-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

### Task 1.5 — Global find-and-replace of every hardcoded hex color

Every hardcoded terracotta hex in the codebase is used as a Tailwind arbitrary value, e.g. `bg-[#B85C38]`.
Run a **project-wide find-and-replace** across `src/` using the table below. Do not change anything else
in these strings (keep the `bg-[...]`, `text-[...]`, `border-[...]` wrappers exactly as they are; only the
hex digits change). This is a pure color swap and does not touch any logic.

| Find (old hex) | Replace (new hex) | Meaning |
|---|---|---|
| `#B85C38` | `#26418F` | primary |
| `#9E4B2E` | `#1B3169` | primary-active |
| `#1E1C1A` | `#101828` | ink (main text) |
| `#4A4540` | `#475467` | body text |
| `#8A8580` | `#8A94A6` | muted text |
| `#A8A4A0` | `#B7BFCB` | muted-soft text |
| `#E8DDD6` | `#E3E8F0` | hairline border |
| `#F3EDE8` | `#EEF2F7` | hairline-soft border |
| `#FFFBF8` | `#F7F9FC` | canvas background |
| `#FDF6F0` | `#EFF4FA` | surface-soft background |
| `#F9EFE8` | `#EAF3F2` | surface-card background |
| `#F5DDD0` | `#DDF3EF` | accent-soft badge background |
| `#D8E6DE` | `#DCF5E7` | success-soft badge background |
| `#1B7A5A` | `#15803D` | success text |
| `#B7791F` | `#B45309` | warning text |
| `#FFF1E6` | `#FDECD8` | warning-soft background |
| `#B93838` | `#B91C1C` | error text |
| `#FFF1F1` | `#FDECEC` | error-soft background |
| `#EDE3DA` | `#E7ECF2` | neutral badge background |
| `#2E2A28` | `#16223A` | dark elevated surface |
| `#2A2826` | `#16223A` | dark hover surface |

Apply this to every one of these 26 files (confirmed by grep, this is the complete list, nothing else in
`src/` contains these hex values):

```
src/app/(auth)/login/page.tsx
src/app/(auth)/reset-password/page.tsx
src/app/(auth)/signup/page.tsx
src/app/(marketing)/page.tsx
src/app/[businessSlug]/book/page.tsx
src/app/[businessSlug]/page.tsx
src/app/admin/businesses/page.tsx
src/app/admin/layout.tsx
src/app/admin/subscriptions/page.tsx
src/app/dashboard/calendar/page.tsx
src/app/dashboard/customers/page.tsx
src/app/dashboard/layout.tsx
src/app/dashboard/page.tsx
src/app/dashboard/services/page.tsx
src/app/dashboard/settings/page.tsx
src/app/dashboard/staff/page.tsx
src/app/error.tsx
src/app/global-error.tsx
src/app/layout.tsx  (already rewritten in Task 1.2, skip if already done)
src/app/not-found.tsx
src/components/booking/QrCard.tsx
src/components/booking/SlotPicker.tsx
src/components/dashboard/nav.tsx
src/components/ui/button.tsx
src/components/ui/card.tsx
src/components/ui/input.tsx
src/lib/qr.ts
```

A one-line sed command that does this safely (run from repo root, review the diff before committing):

```bash
FILES=$(grep -rlE "#B85C38|#9E4B2E|#1E1C1A|#4A4540|#8A8580|#A8A4A0|#E8DDD6|#F3EDE8|#FFFBF8|#FDF6F0|#F9EFE8|#F5DDD0|#D8E6DE|#1B7A5A|#B7791F|#B93838|#EDE3DA|#2E2A28|#2A2826|#FFF1E6|#FFF1F1" src --include="*.tsx" --include="*.ts")
for f in $FILES; do
  sed -i \
    -e 's/#B85C38/#26418F/g' -e 's/#9E4B2E/#1B3169/g' \
    -e 's/#1E1C1A/#101828/g' -e 's/#4A4540/#475467/g' \
    -e 's/#8A8580/#8A94A6/g' -e 's/#A8A4A0/#B7BFCB/g' \
    -e 's/#E8DDD6/#E3E8F0/g' -e 's/#F3EDE8/#EEF2F7/g' \
    -e 's/#FFFBF8/#F7F9FC/g' -e 's/#FDF6F0/#EFF4FA/g' \
    -e 's/#F9EFE8/#EAF3F2/g' -e 's/#F5DDD0/#DDF3EF/g' \
    -e 's/#D8E6DE/#DCF5E7/g' -e 's/#1B7A5A/#15803D/g' \
    -e 's/#B7791F/#B45309/g' -e 's/#B93838/#B91C1C/g' \
    -e 's/#EDE3DA/#E7ECF2/g' -e 's/#2E2A28/#16223A/g' \
    -e 's/#2A2826/#16223A/g' -e 's/#FFF1E6/#FDECD8/g' \
    -e 's/#FFF1F1/#FDECEC/g' \
    "$f"
done
```

### Task 1.6 — Update shared UI primitives to use the new focus ring color

**File: `src/components/ui/button.tsx`** — after Task 1.5's sed runs, the focus ring class
`focus-visible:ring-[#B85C38]` becomes `focus-visible:ring-[#26418F]` automatically. Additionally add a
new `gradient` variant used for the site's primary marketing CTAs:

```tsx
import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "gradient" | "ghost";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-semibold h-10 px-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#26418F] disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-[#26418F] text-white hover:bg-[#1B3169]",
    secondary: "bg-[#F7F9FC] text-[#101828] border border-[#E3E8F0] hover:bg-[#EFF4FA]",
    gradient: "text-white brand-gradient-bg hover:opacity-90",
    ghost: "text-[#101828] hover:bg-[#EFF4FA]",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
```

---

## PHASE 2 — Shared navigation and footer components

These are new files. Every marketing page (home, pricing) imports them, so the nav/footer only need to be
built once.

### Task 2.1 — Create `src/components/marketing/site-header.tsx`

```tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/#business-types", label: "Business types" },
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/for-business", label: "For business" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-[#E3E8F0] bg-white/90 backdrop-blur">
      <nav className="max-w-[1200px] mx-auto h-16 flex items-center justify-between px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/logo.png" alt="ADNAVRA" width={32} height={32} className="h-8 w-8" priority />
          <span className="text-lg font-semibold tracking-tight text-[#101828]">ADNAVRA</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-[#475467] hover:text-[#101828]">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-[#101828] hover:underline">
            Log in
          </Link>
          <Link href="/signup">
            <Button>Sign up free</Button>
          </Link>
        </div>

        <button className="md:hidden p-2 text-[#101828]" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-[#E3E8F0] bg-white px-6 py-4 space-y-3">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="block text-sm font-medium text-[#475467]" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-[#E3E8F0] flex flex-col gap-2">
            <Link href="/login" className="text-sm font-medium text-[#101828]">
              Log in
            </Link>
            <Link href="/signup">
              <Button className="w-full">Sign up free</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
```

### Task 2.2 — Create `src/components/marketing/site-footer.tsx`

Structure mirrors the reference (About / For business / Support / Legal / Social) but every link points
at a real route that exists (or a new static page created in Task 2.3).

```tsx
import Link from "next/link";
import { Facebook, Instagram, Linkedin } from "lucide-react";

const COLUMNS = [
  {
    title: "About",
    links: [
      { href: "/about", label: "About ADNAVRA" },
      { href: "/#roadmap", label: "Roadmap" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "For business",
    links: [
      { href: "/for-business", label: "For salons" },
      { href: "/pricing", label: "Pricing" },
      { href: "/#features", label: "Features" },
      { href: "/signup", label: "Get started" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/contact", label: "Help and support" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#0B1220] text-[#A9B4C4] px-6 lg:px-12 py-16 mt-16">
      <div className="max-w-[1200px] mx-auto grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
        <div>
          <p className="text-white font-semibold text-lg">ADNAVRA</p>
          <p className="text-sm mt-2 max-w-xs">
            Booking infrastructure and a digital presence for Sri Lankan salons and beauty businesses.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <a href="#" aria-label="Facebook" className="hover:text-white"><Facebook className="h-4 w-4" /></a>
            <a href="#" aria-label="Instagram" className="hover:text-white"><Instagram className="h-4 w-4" /></a>
            <a href="#" aria-label="LinkedIn" className="hover:text-white"><Linkedin className="h-4 w-4" /></a>
          </div>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-white text-sm font-semibold">{col.title}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-[1200px] mx-auto border-t border-white/10 mt-10 pt-6 text-xs">
        © {new Date().getFullYear()} ADNAVRA. All rights reserved. Colombo, Sri Lanka.
      </div>
    </footer>
  );
}
```

### Task 2.3 — Create three simple static pages the footer links to

These are plain static content, no backend involved.

**File: `src/app/about/page.tsx`**, **`src/app/contact/page.tsx`**, **`src/app/privacy/page.tsx`**,
**`src/app/terms/page.tsx`** — each follows this pattern (edit only the `<h1>` and paragraph content per
page, reuse header/footer):

```tsx
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#F7F9FC]">
      <SiteHeader />
      <section className="max-w-[800px] mx-auto px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight text-[#101828]">About ADNAVRA</h1>
        <p className="mt-4 text-[#475467] leading-relaxed">
          ADNAVRA is building booking infrastructure for salons, beauty studios, spas, barbershops and
          beauty clinics across Sri Lanka. Every subscribing business gets a dedicated online booking
          page, a management dashboard, and a unique QR code, so appointments stop depending on phone
          calls and WhatsApp messages.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
```

Adjust copy for `/contact` (a simple mailto link and phone number placeholder), `/privacy` and `/terms`
(placeholder legal copy, to be replaced by the founder's actual lawyer-reviewed text before launch, note
this clearly with an HTML comment `{/* TODO: replace with reviewed legal copy before launch */}`).

---

## PHASE 3 — Home page (full rebuild)

### Task 3.1 — Rewrite `src/app/(marketing)/page.tsx`

Replace the entire file. This follows the structure of the SaaS proposal PDF section by section: hero,
problem, how it works, features, pricing (cards + explanation), QR system, business benefits, FAQ, final
CTA.

```tsx
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Smartphone,
  LayoutDashboard,
  Users,
  QrCode,
  BarChart3,
  Store,
  Clock,
  MessageCircle,
  MapPin,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PricingSection } from "@/components/marketing/pricing-section";

const FEATURES = [
  { icon: Smartphone, title: "Dedicated online booking page", desc: "A professional, mobile-friendly page at your own ADNAVRA URL. Your salon's always-on digital storefront." },
  { icon: Clock, title: "24/7 appointment booking", desc: "Customers book any time, without needing to call or message during business hours." },
  { icon: LayoutDashboard, title: "Salon management dashboard", desc: "A simple dashboard to manage services, pricing, availability, and incoming appointments." },
  { icon: Users, title: "Staff and team management", desc: "Assign appointments to specific staff members and manage individual schedules." },
  { icon: Users, title: "Customer database", desc: "Every booking builds a centralized customer record and booking history." },
  { icon: QrCode, title: "Unique QR code", desc: "A dedicated QR code that opens your booking page instantly, perfect for in-salon use." },
  { icon: BarChart3, title: "Business analytics", desc: "Understand bookings, popular services, and business performance over time." },
  { icon: Store, title: "Marketplace discoverability", desc: "Be found by new customers browsing the ADNAVRA marketplace by location and service." },
];

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-[#F7F9FC]">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 brand-gradient-bg opacity-[0.06]" />
        <div className="relative px-6 lg:px-12 py-24 max-w-[1200px] mx-auto">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
            <div>
              <p className="inline-flex rounded-full bg-[#E2E8F9] px-3 py-1 text-xs font-medium text-[#26418F]">
                Built for salons in Sri Lanka
              </p>
              <h1 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-[-1.5px] text-[#101828]">
                Your business, booked.
              </h1>
              <p className="mt-4 text-base leading-relaxed text-[#475467] max-w-prose">
                A dedicated online presence, appointment management, and marketplace discovery, built
                specifically for Sri Lankan salons and beauty businesses. No more juggling phone calls and
                WhatsApp threads to manage your day.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signup">
                  <Button variant="gradient">
                    Get started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="#how-it-works" className="inline-flex h-10 items-center rounded-md border border-[#E3E8F0] px-5 text-sm font-semibold text-[#101828]">
                  See how it works
                </a>
              </div>
              <p className="mt-4 text-xs text-[#8A94A6]">
                Are you a customer looking to book an appointment? <Link href="/customer" className="text-[#26418F] font-medium hover:underline">Go to ADNAVRA for customers</Link>
              </p>
            </div>
            <div className="rounded-xl border border-[#E3E8F0] bg-white p-6 shadow-[0_4px_24px_rgba(16,24,40,0.08)]">
              <p className="text-sm font-semibold text-[#101828]">Today&apos;s bookings</p>
              <div className="mt-4 space-y-3">
                {[
                  { name: "Glow Salon", time: "10:00 Haircut", status: "Confirmed" },
                  { name: "Serene Studio", time: "11:30 Colour", status: "Confirmed" },
                  { name: "Luxe Cuts", time: "14:00 Bridal", status: "Pending" },
                ].map((b) => (
                  <div key={b.time} className="flex items-center justify-between rounded-lg bg-[#EAF3F2] px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[#101828]">{b.name}</p>
                      <p className="text-xs text-[#8A94A6]">{b.time}</p>
                    </div>
                    <span className="rounded-full bg-[#DCF5E7] px-2 py-1 text-xs font-medium text-[#101828]">{b.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The problem */}
      <section className="px-6 lg:px-12 py-16 max-w-[1200px] mx-auto">
        <div className="rounded-2xl bg-[#0B1220] text-[#F7F9FC] p-10 lg:p-14 grid lg:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-semibold">Appointments are still managed by phone and WhatsApp</h2>
            <p className="mt-3 text-sm text-[#A9B4C4] leading-relaxed">
              Across Sri Lanka, salons and beauty businesses coordinate bookings over the phone, keep
              customer records in notebooks or scattered chat threads, and lose time managing schedules
              by hand.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              "Missed and forgotten appointments cost revenue and staff time.",
              "Customer information is scattered, with no centralized booking history.",
              "Staff schedules are difficult to coordinate with multiple team members.",
              "Most salons have limited or no professional online presence.",
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#22C08C] shrink-0" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 lg:px-12 py-16 max-w-[1200px] mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight text-[#101828] text-center">How ADNAVRA works</h2>
        <div className="mt-10 grid md:grid-cols-2 gap-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#26418F]">The customer journey</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#475467]">
              {["Discover salon", "View profile", "Select service", "Choose date and time", "Book", "Confirm"].map((s, i, arr) => (
                <span key={s} className="flex items-center gap-2">
                  <span className="rounded-full bg-white border border-[#E3E8F0] px-3 py-1.5">{s}</span>
                  {i < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-[#B7BFCB]" />}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#14B8A6]">The salon journey</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#475467]">
              {["Create profile", "Add services", "Set availability", "Receive bookings", "Manage customers", "Grow business"].map((s, i, arr) => (
                <span key={s} className="flex items-center gap-2">
                  <span className="rounded-full bg-white border border-[#E3E8F0] px-3 py-1.5">{s}</span>
                  {i < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-[#B7BFCB]" />}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 lg:px-12 py-16 max-w-[1200px] mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight text-[#101828] text-center">Key features</h2>
        <p className="mt-2 text-center text-[#475467]">Everything a modern appointment-based business needs, in one connected platform.</p>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-lg bg-white border border-[#E3E8F0] p-8">
              <f.icon className="h-5 w-5 text-[#26418F]" />
              <h3 className="mt-3 text-lg font-semibold text-[#101828]">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#475467]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing (see Phase 4 for PricingSection component) */}
      <section id="pricing" className="px-6 lg:px-12 py-16 max-w-[1200px] mx-auto" aria-label="business-types">
        <div id="business-types" />
        <PricingSection />
      </section>

      {/* QR system */}
      <section className="px-6 lg:px-12 py-16 max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-[#101828]">Turn any physical touchpoint into a booking</h2>
          <p className="mt-3 text-[#475467] leading-relaxed">
            Every ADNAVRA subscription includes a unique QR code generated specifically for your salon's
            booking page. No app download required. Display it at reception, on mirrors, on business
            cards, or on flyers.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[#475467]">
            {["Reception desk", "Waiting area", "Business cards and flyers", "Social media and promotional materials"].map((t) => (
              <li key={t} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#14B8A6]" /> {t}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-[#E3E8F0] bg-white p-8 flex flex-col items-center text-center">
          <QrCode className="h-32 w-32 text-[#101828]" />
          <p className="mt-4 text-sm font-medium text-[#101828]">Scan to open your salon's booking page</p>
          <p className="text-xs text-[#8A94A6] mt-1">Generated automatically the moment your profile is live</p>
        </div>
      </section>

      {/* Business benefits */}
      <section className="px-6 lg:px-12 py-16 max-w-[1200px] mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight text-[#101828] text-center">Business benefits</h2>
        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: MessageCircle, title: "Reduced phone and WhatsApp load", desc: "Free up staff time currently spent coordinating bookings manually." },
            { icon: Calendar, title: "Fewer missed appointments", desc: "Centralized bookings and confirmations reduce no-shows and scheduling errors." },
            { icon: LayoutDashboard, title: "Centralized operations", desc: "Appointments, services, and customer records live in one dashboard." },
            { icon: MapPin, title: "New customer reach", desc: "Visibility through the growing ADNAVRA marketplace." },
          ].map((b) => (
            <div key={b.title} className="rounded-lg bg-white border border-[#E3E8F0] p-6">
              <b.icon className="h-5 w-5 text-[#14B8A6]" />
              <h3 className="mt-3 text-sm font-semibold text-[#101828]">{b.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#475467]">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 lg:px-12 py-16 max-w-[800px] mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight text-[#101828] text-center">Frequently asked questions</h2>
        <div className="mt-8 divide-y divide-[#E3E8F0] rounded-lg border border-[#E3E8F0] bg-white">
          {[
            { q: "Is there a minimum commitment?", a: "No. Subscriptions are billed monthly and can be cancelled at any time, in line with a standard monthly cycle." },
            { q: "What does the one-time setup fee cover?", a: "Full onboarding: profile setup, logo and image upload, service and pricing configuration, business hours, QR code generation, and dashboard setup." },
            { q: "Can I upgrade my plan later?", a: "Yes. Every plan can be upgraded as your business grows, from Starter to Professional to Premium." },
            { q: "Do you charge booking fees per appointment?", a: "No. ADNAVRA charges a fixed monthly subscription instead of a per-booking fee." },
          ].map((item) => (
            <details key={item.q} className="group p-5">
              <summary className="cursor-pointer text-sm font-medium text-[#101828] list-none flex items-center justify-between">
                {item.q}
                <span className="text-[#8A94A6] group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-2 text-sm text-[#475467] leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 lg:px-12 py-20">
        <div className="max-w-[1000px] mx-auto rounded-2xl brand-gradient-bg text-white p-14 text-center">
          <h2 className="text-3xl font-semibold">Your business deserves to be discovered</h2>
          <p className="mt-3 text-white/85 max-w-xl mx-auto">
            Join ADNAVRA and give your salon the booking infrastructure and digital presence it deserves.
          </p>
          <Link href="/signup" className="inline-flex mt-6">
            <Button variant="secondary">Get started today</Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
```

Note: `Image` from `next/image` requires `public/logo.png` to exist (Task 1.1) or the build will fail on
that import path at runtime with a broken image, not a build error, so this is safe to ship even before
the logo file lands, but add it as soon as possible.

---

## PHASE 4 — Pricing section and dedicated pricing page

### Task 4.1 — Create `src/components/marketing/pricing-section.tsx`

This is shared between the home page and `/pricing`. Plan data matches the PDF exactly (Section 6) and
the existing `SubscriptionPlan` enum (`STARTER`, `PROFESSIONAL`, `PREMIUM`) already in
`prisma/schema.prisma`, so no backend change is needed here.

```tsx
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    id: "STARTER",
    name: "Starter",
    price: "LKR 3,000",
    popular: false,
    features: [
      "Dedicated salon profile and page",
      "Logo, photos and business info",
      "Services and pricing listing",
      "Online appointment booking",
      "Appointment management dashboard",
      "Customer booking details",
      "Unique salon URL and QR code",
      "Basic availability management",
      "Mobile-friendly booking page",
      "Basic technical support",
    ],
  },
  {
    id: "PROFESSIONAL",
    name: "Professional",
    price: "LKR 5,000",
    popular: true,
    features: [
      "Everything in Starter, plus:",
      "Staff and team management",
      "Multiple staff members",
      "Staff-specific appointments",
      "Customer database and booking history",
      "Advanced schedule management",
      "Appointment status management",
      "Basic business analytics",
      "Promotional offers",
      "Featured salon profile",
      "Priority support",
    ],
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: "LKR 7,000",
    popular: false,
    features: [
      "Everything in Professional, plus:",
      "Multiple branches and locations",
      "Advanced analytics and reports",
      "Booking and revenue insights",
      "Advanced customer management",
      "Loyalty and return-customer features",
      "Promotional campaigns",
      "Featured marketplace placement",
      "Advanced staff management",
      "Premium QR materials",
      "Priority technical support",
    ],
  },
];

export function PricingSection() {
  return (
    <div>
      <h2 className="text-3xl font-semibold tracking-tight text-[#101828] text-center">Subscription plans</h2>
      <p className="mt-2 text-center text-[#475467] max-w-2xl mx-auto">
        Software that grows with your business. Choose the plan that fits today. Every plan can be
        upgraded as you grow.
      </p>

      <div className="mt-10 grid md:grid-cols-3 gap-6 items-start">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-2xl border p-8 bg-white ${plan.popular ? "border-[#26418F] shadow-[0_8px_30px_rgba(38,65,143,0.15)] relative" : "border-[#E3E8F0]"}`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-8 rounded-full brand-gradient-bg text-white text-xs font-semibold px-3 py-1">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-semibold text-[#101828]">{plan.name}</h3>
            <p className="mt-2 text-3xl font-semibold text-[#101828]">
              {plan.price}
              <span className="text-sm font-normal text-[#8A94A6]"> / month</span>
            </p>
            <ul className="mt-6 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-[#475467]">
                  <Check className="h-4 w-4 text-[#14B8A6] mt-0.5 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/signup" className="block mt-8">
              <Button variant={plan.popular ? "gradient" : "secondary"} className="w-full">
                Choose {plan.name}
              </Button>
            </Link>
          </div>
        ))}
      </div>

      {/* One-time setup */}
      <div className="mt-8 rounded-2xl border border-[#E3E8F0] bg-[#EAF3F2] p-8 flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-[#101828]">One-time setup fee: LKR 15,000</p>
          <p className="mt-1 text-sm text-[#475467] max-w-xl">
            Covers full onboarding: business profile setup, logo and image upload, service and pricing
            configuration, business hours, QR code generation, dashboard setup, and basic training.
            Charged once, at onboarding, on top of your chosen monthly plan.
          </p>
        </div>
      </div>

      {/* Detailed explanation below the cards, per plan */}
      <div className="mt-12 grid md:grid-cols-3 gap-8 text-sm text-[#475467]">
        <div>
          <p className="font-semibold text-[#101828]">Starter, for independent owners</p>
          <p className="mt-2 leading-relaxed">
            Built for a single practitioner or a small salon that needs a professional booking page and a
            simple dashboard without staff management. Includes everything needed to stop taking bookings
            over the phone: an online page, a QR code, and appointment tracking.
          </p>
        </div>
        <div>
          <p className="font-semibold text-[#101828]">Professional, for growing teams</p>
          <p className="mt-2 leading-relaxed">
            ADNAVRA's most popular plan. Adds staff scheduling, a full customer database with booking
            history, and featured placement in the marketplace as it grows, at a price that stays
            accessible for small teams of two to ten people.
          </p>
        </div>
        <div>
          <p className="font-semibold text-[#101828]">Premium, for multi-location businesses</p>
          <p className="mt-2 leading-relaxed">
            For salons expanding beyond one branch. Adds multi-location management, advanced revenue
            reporting, loyalty tools for return customers, and top placement in marketplace search
            results.
          </p>
        </div>
      </div>
    </div>
  );
}
```

### Task 4.2 — Create the dedicated `/pricing` route

**File: `src/app/pricing/page.tsx`**

```tsx
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { PricingSection } from "@/components/marketing/pricing-section";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#F7F9FC]">
      <SiteHeader />
      <section className="px-6 lg:px-12 py-16 max-w-[1200px] mx-auto">
        <PricingSection />
      </section>
      <SiteFooter />
    </main>
  );
}
```

### Task 4.3 — Create `/for-business`

**File: `src/app/for-business/page.tsx`** — reuse the hero and features blocks from Task 3.1 with the
copy angled toward salon owners specifically (can literally reuse the `FEATURES` array and hero copy).
This is a straightforward composition task, follow the same pattern as `about/page.tsx` in Task 2.3.

---

## PHASE 5 — Professional authentication pages

### Task 5.1 — ADDITIVE backend change: allow signup to specify a role

This is the one change to an API route in this whole plan, and it is fully backward compatible: existing
requests that omit `role` behave exactly as they do today (create an `OWNER`).

**File: `src/schemas/user.ts`** — add one optional field to `signupSchema`:

```ts
export const signupSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  name: z.string().min(1).max(100).trim(),
  // NEW, optional, defaults to OWNER to preserve existing behavior exactly.
  role: z.enum(["OWNER", "CUSTOMER"]).optional().default("OWNER"),
  phone: z.string().min(7).max(20).trim().optional(),
  businessName: z.string().min(2).max(100).trim().optional(),
  businessSlug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
});
```

**File: `src/app/api/auth/signup/route.ts`** — change one destructure line and one `role:` assignment:

```ts
// before:
const { email, password, name, businessName, businessSlug } = parsed.data;
// after:
const { email, password, name, role, businessName, businessSlug, phone } = parsed.data;
```

```ts
// inside the transaction, before:
const user = await tx.user.create({
  data: {
    email,
    password: hashed,
    name,
    role: "OWNER",
    businessId,
  },
  select: { id: true, email: true, name: true, role: true, businessId: true },
});

// after:
const user = await tx.user.create({
  data: {
    email,
    password: hashed,
    name,
    role, // "OWNER" by default, "CUSTOMER" when the customer signup form sends it
    businessId,
  },
  select: { id: true, email: true, name: true, role: true, businessId: true },
});
```

Also guard so a `CUSTOMER` signup can never accidentally create a business, even if `businessName` is
somehow present in the payload:

```ts
if (businessName && businessSlug && role === "OWNER") {
  // existing business-creation block, unchanged, just wrapped with the role check
}
```

`phone` is accepted but not yet persisted anywhere (the `User` model has no `phone` column). Do not add
a `phone` column to `User` in this task, that is out of scope here; simply ignore the field server-side
for now (destructure it so validation passes, do not write it to the database). Note this clearly in a
code comment: `// phone is accepted for future use, not yet persisted on User`.

### Task 5.2 — Redesign `src/app/(auth)/login/page.tsx`

Fresha-style split screen: left panel with the sign-in form and social buttons, right panel a full-bleed
image. Since there is no image asset yet, use a solid brand-gradient panel with a short line of copy
instead of a photo (avoids depending on stock imagery that has not been sourced).

Keep every existing state variable, `handleSubmit`, and the `signIn("credentials", ...)` call exactly as
they are today. Only replace the returned JSX. Replace the `return (...)` block of `LoginForm` with:

```tsx
return (
  <main className="min-h-screen grid lg:grid-cols-2 bg-[#0B1220]">
    <div className="flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex text-lg font-semibold tracking-tight text-white">
          ADNAVRA <span className="text-[#A9B4C4] font-normal ml-2 text-sm">for professionals</span>
        </Link>
        <h1 className="mt-6 text-2xl font-semibold text-white">Welcome back</h1>
        <p className="mt-1 text-sm text-[#A9B4C4]">Sign in to manage your salon</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error && (
            <div className="flex gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#F87171]" />
              <span className="text-[#A9B4C4]">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="text-sm font-medium text-white">Email</label>
            <Input
              id="email" type="email" autoComplete="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-[#8A94A6]"
              disabled={isPending}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-white">Password</label>
              <Link href="/reset-password" className="text-xs font-medium text-[#22C08C] hover:underline">Forgot password?</Link>
            </div>
            <div className="relative mt-1.5">
              <Input
                id="password" type={showPw ? "text" : "password"} autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" disabled={isPending}
                className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-[#8A94A6]"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#8A94A6] hover:text-white" aria-label={showPw ? "Hide password" : "Show password"}>
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={isPending} variant="gradient" className="w-full">
            {isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</>) : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-[#8A94A6]">OR</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="mt-6 space-y-3">
          {/* Google OAuth wiring is Phase 6 (optional). Buttons render disabled with "Coming soon" until then, so nothing here is a dead click. */}
          <button type="button" disabled className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 h-10 text-sm font-medium text-white/50 cursor-not-allowed">
            Continue with Google <span className="text-xs">(coming soon)</span>
          </button>
          <button type="button" disabled className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 h-10 text-sm font-medium text-white/50 cursor-not-allowed">
            Continue with WhatsApp <span className="text-xs">(coming soon)</span>
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-[#A9B4C4]">
          No account? <Link href="/signup" className="font-medium text-[#22C08C] hover:underline">Create one</Link>
        </p>
        <p className="mt-3 text-center text-sm text-[#A9B4C4]">
          Looking to book an appointment? <Link href="/customer/login" className="font-medium text-white hover:underline">Go to ADNAVRA for customers</Link>
        </p>
      </div>
    </div>
    <div className="hidden lg:flex brand-gradient-bg items-end p-14">
      <div className="text-white max-w-sm">
        <p className="text-2xl font-semibold leading-snug">Your business, booked.</p>
        <p className="mt-3 text-white/85 text-sm">
          Manage appointments, staff, and customers from one dashboard built for Sri Lankan salons.
        </p>
      </div>
    </div>
  </main>
);
```

Add `import Link from "next/link";` if not already present (it already is), and keep every other import
line unchanged.

### Task 5.3 — Redesign `src/app/(auth)/signup/page.tsx` finishing-details step

Keep every state variable and the `handleSubmit` function exactly as-is, except extend the payload to
include `mobile` split into a country code and number (concatenated before sending, since the backend
`phone` field in Task 5.1 expects a single string), and a required terms checkbox that blocks submission
client-side (defense in depth, the backend does not require it, so this is UI-only, non-breaking):

Add these state variables alongside the existing ones:

```tsx
const [countryCode, setCountryCode] = useState("+94");
const [mobile, setMobile] = useState("");
const [country, setCountry] = useState("Sri Lanka");
const [agreed, setAgreed] = useState(false);
```

In `handleSubmit`, add to the payload object:

```tsx
if (mobile.trim()) payload.phone = `${countryCode}${mobile.trim()}`;
```

Add this block to the JSX, directly after the password field's closing `</div>` and before the
"Salon business (optional now)" block:

```tsx
<div className="grid grid-cols-[110px_1fr] gap-2">
  <div>
    <label className="text-sm font-medium text-[#101828]">Country code</label>
    <select
      value={countryCode}
      onChange={(e) => setCountryCode(e.target.value)}
      className="mt-1.5 h-10 w-full rounded-md border border-[#E3E8F0] bg-[#F7F9FC] px-2 text-sm text-[#101828]"
      disabled={isPending}
    >
      <option value="+94">+94</option>
    </select>
  </div>
  <div>
    <label htmlFor="mobile" className="text-sm font-medium text-[#101828]">Mobile number</label>
    <Input
      id="mobile" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)}
      placeholder="77 123 4567" className="mt-1.5" disabled={isPending}
    />
  </div>
</div>

<div>
  <label className="text-sm font-medium text-[#101828]">Country</label>
  <Input value={country} onChange={(e) => setCountry(e.target.value)} disabled className="mt-1.5 bg-[#EFF4FA]" />
  <p className="mt-1 text-xs text-[#8A94A6]">ADNAVRA currently supports salons in Sri Lanka only.</p>
</div>

<label className="flex items-start gap-2 text-xs text-[#475467]">
  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" required />
  I agree to the <Link href="/privacy" className="text-[#26418F] hover:underline">Privacy Policy</Link>, <Link href="/terms" className="text-[#26418F] hover:underline">Terms of Service</Link> and Terms of Business.
</label>
```

Change the submit button's `disabled` prop to also require the checkbox:

```tsx
<Button type="submit" disabled={isPending || !agreed} variant="gradient" className="w-full">
```

Restyle the outer `<main>`, header, and card wrapper the same way as Task 5.2 (dark gradient split
screen), reusing the same visual language, and add the same footer line pointing to
`/customer/signup` ("Looking to book instead? Go to ADNAVRA for customers").

---

## PHASE 6 — Optional: real Google OAuth (do this only after Phase 5 ships and the founder has a Google Cloud OAuth client)

This phase is optional and clearly separated because it needs external setup (a Google Cloud OAuth
client ID/secret) that only the founder can create. Skip it entirely if those credentials are not
available yet, the disabled buttons from Task 5.2 already communicate "coming soon" honestly.

**File: `src/lib/auth.ts`** — add a second provider alongside `Credentials` (do not remove or reorder the
existing `Credentials` provider, only append):

```ts
import Google from "next-auth/providers/google";

export const authConfig = {
  providers: [
    Credentials({ /* ...unchanged... */ }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // ...rest unchanged
};
```

Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.example` and the real `.env`. Then in
`login/page.tsx` and `signup/page.tsx`, change the disabled Google button to a real one:

```tsx
<button
  type="button"
  onClick={() => signIn("google", { callbackUrl })}
  className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 h-10 text-sm font-medium text-white hover:bg-white/10"
>
  Continue with Google
</button>
```

Leave WhatsApp and Apple as "coming soon" until those provider integrations exist, WhatsApp login in
particular is not a standard OAuth flow and needs a dedicated OTP provider (e.g. Twilio or Meta Cloud
API), which is a backend project of its own and out of scope here.

---

## PHASE 7 — Professional onboarding wizard (multi-step business setup)

### Task 7.1 — ADDITIVE Prisma migration: new optional fields on `Business`

None of these fields remove or rename anything that exists. All new columns are nullable, so every
existing row and every existing query keeps working unchanged.

**File: `prisma/schema.prisma`** — add this enum near the other enums:

```prisma
enum LocationType {
  PHYSICAL
  MOBILE
  VIRTUAL
}
```

Add these fields inside the existing `model Business { ... }` block, directly after `openingHours`:

```prisma
  // Onboarding wizard fields (all optional, additive)
  website      String?
  categories   String[] @default([])
  teamSize     String?
  locationType LocationType?
  district     String?
  city         String?
  county       String?
  state        String?
  postcode     String?
  directions   String?  @db.Text
  latitude     Float?
  longitude    Float?
```

Run:

```bash
npx prisma migrate dev --name add_business_onboarding_fields
```

This generates a migration that only does `ALTER TABLE businesses ADD COLUMN ...` for nullable columns,
it cannot break existing data.

### Task 7.2 — ADDITIVE schema change: accept the new fields optionally

**File: `src/schemas/business.ts`** — add these optional fields to both `createBusinessSchema` and
`updateBusinessSchema` (same fields, same optionality, in both):

```ts
  website: z.string().url().optional().nullable().or(z.literal("")),
  categories: z.array(z.string()).max(4).optional(),
  teamSize: z.enum(["INDEPENDENT", "2-5", "6-10", "11-20", "20+"]).optional().nullable(),
  locationType: z.enum(["PHYSICAL", "MOBILE", "VIRTUAL"]).optional().nullable(),
  district: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  county: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  postcode: z.string().max(20).optional().nullable(),
  directions: z.string().max(200).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
```

**File: `src/app/api/businesses/route.ts`** (POST handler) — extend the `data:` object inside
`tx.business.create` to pass these through when present:

```ts
data: {
  name: parsed.data.name,
  slug: parsed.data.slug,
  description: parsed.data.description ?? null,
  phone: parsed.data.phone ?? null,
  email: parsed.data.email ?? null,
  address: parsed.data.address ?? null,
  logoUrl: parsed.data.logoUrl || null,
  openingHours: parsed.data.openingHours ?? undefined,
  website: parsed.data.website || null,
  categories: parsed.data.categories ?? [],
  teamSize: parsed.data.teamSize ?? null,
  locationType: parsed.data.locationType ?? null,
  district: parsed.data.district ?? null,
  city: parsed.data.city ?? null,
  county: parsed.data.county ?? null,
  state: parsed.data.state ?? null,
  postcode: parsed.data.postcode ?? null,
  directions: parsed.data.directions ?? null,
  latitude: parsed.data.latitude ?? null,
  longitude: parsed.data.longitude ?? null,
},
```

**File: `src/app/api/businesses/[id]/route.ts`** — do the same additive spread in the `PATCH` handler's
update payload (find the equivalent `data: { ... }` object and add the same fields, guarded by
`parsed.data.<field> !== undefined` following whatever pattern that file already uses for optional PATCH
fields).

### Task 7.3 — Install a free map library

```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

Leaflet with OpenStreetMap tiles needs no API key and no billing account, unlike Google Maps, which
matters for a bootstrapped Sri Lankan SaaS.

**File: `src/app/globals.css`** — add at the very top, after the `@import "tailwindcss";` line:

```css
@import "leaflet/dist/leaflet.css";
```

### Task 7.4 — Build the wizard step components

Create a new folder `src/components/onboarding/` with one file per step, plus a shared wizard shell. Each
step is a controlled component receiving `value`/`onChange` props, no internal fetch calls, the parent
page (Task 7.5) owns all state and makes the single POST call at the end.

**File: `src/components/onboarding/wizard-shell.tsx`**

```tsx
"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WizardShell({
  step, totalSteps, title, subtitle, children, onBack, onNext, nextLabel = "Continue", nextDisabled = false,
}: {
  step: number; totalSteps: number; title: string; subtitle?: string;
  children: React.ReactNode; onBack?: () => void; onNext: () => void;
  nextLabel?: string; nextDisabled?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      <div className="flex gap-1 p-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i < step ? "bg-[#22C08C]" : "bg-white/10"}`} />
        ))}
      </div>
      <div className="flex items-center justify-between px-8 py-4">
        {onBack ? (
          <button onClick={onBack} className="h-9 w-9 rounded-full border border-white/15 flex items-center justify-center hover:bg-white/5" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : <span />}
        <Button variant="gradient" onClick={onNext} disabled={nextDisabled}>
          {nextLabel} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <div className="max-w-3xl mx-auto px-8 pb-20 pt-8">
        <p className="text-xs text-[#8A94A6]">Account setup</p>
        <h1 className="mt-2 text-4xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-3 text-[#A9B4C4] max-w-xl">{subtitle}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}
```

**File: `src/components/onboarding/step-business-name.tsx`**

```tsx
"use client";
import { Input } from "@/components/ui/input";

export function StepBusinessName({
  name, website, onChangeName, onChangeWebsite,
}: { name: string; website: string; onChangeName: (v: string) => void; onChangeWebsite: (v: string) => void }) {
  return (
    <div className="space-y-6 max-w-md">
      <div>
        <label className="text-sm font-medium">Business name</label>
        <Input value={name} onChange={(e) => onChangeName(e.target.value)} placeholder="Glow Salon" className="mt-1.5 bg-white/5 border-white/10 text-white" />
      </div>
      <div>
        <label className="text-sm font-medium">Website (optional)</label>
        <Input value={website} onChange={(e) => onChangeWebsite(e.target.value)} placeholder="www.yoursite.com" className="mt-1.5 bg-white/5 border-white/10 text-white" />
      </div>
    </div>
  );
}
```

**File: `src/components/onboarding/step-categories.tsx`**

```tsx
"use client";
import { Scissors, Sparkles, Wand2, Droplets, Sun, Bike, HeartHandshake, Dog, Stethoscope, PawPrint, LucideIcon } from "lucide-react";

const CATEGORIES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "hair-salon", label: "Hair salon", icon: Scissors },
  { id: "nails", label: "Nails", icon: Sparkles },
  { id: "eyebrows-lashes", label: "Eyebrows and lashes", icon: Wand2 },
  { id: "beauty-salon", label: "Beauty salon", icon: Sparkles },
  { id: "medspa", label: "Medspa", icon: Stethoscope },
  { id: "barber", label: "Barber", icon: Scissors },
  { id: "massage", label: "Massage", icon: HeartHandshake },
  { id: "spa-sauna", label: "Spa and sauna", icon: Droplets },
  { id: "waxing", label: "Waxing salon", icon: Sun },
  { id: "tattoo-piercing", label: "Tattooing and piercing", icon: PawPrint },
  { id: "fitness", label: "Fitness and recovery", icon: Bike },
  { id: "pet-grooming", label: "Pet grooming", icon: Dog },
];

export function StepCategories({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div>
      <p className="text-sm text-[#A9B4C4] mb-4">Choose your primary category and up to three related ones.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {CATEGORIES.map((c) => {
          const active = selected.includes(c.id);
          const disabled = !active && selected.length >= 4;
          return (
            <button
              key={c.id}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(c.id)}
              className={`rounded-xl border p-5 text-left transition-colors ${active ? "border-[#22C08C] bg-[#22C08C]/10" : "border-white/10 bg-white/5 hover:bg-white/10"} disabled:opacity-40`}
            >
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

**File: `src/components/onboarding/step-team-size.tsx`**

```tsx
"use client";

const OPTIONS = [
  { id: "INDEPENDENT", label: "I'm an independent" },
  { id: "2-5", label: "2 to 5 people" },
  { id: "6-10", label: "6 to 10 people" },
  { id: "11-20", label: "11 to 20 people" },
  { id: "20+", label: "20+ people" },
];

export function StepTeamSize({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3 max-w-md">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`w-full text-left rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${value === o.id ? "border-[#22C08C] bg-[#22C08C]/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
```

**File: `src/components/onboarding/step-location-type.tsx`**

```tsx
"use client";
import { Check } from "lucide-react";

const OPTIONS = [
  { id: "PHYSICAL", label: "Clients come to me at a physical location" },
  { id: "MOBILE", label: "I visit my clients as a mobile operator" },
  { id: "VIRTUAL", label: "I provide virtual services online" },
];

export function StepLocationType({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3 max-w-md">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${value === o.id ? "border-[#22C08C] bg-[#22C08C]/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
        >
          {o.label}
          {value === o.id && <span className="h-5 w-5 rounded-full bg-[#22C08C] flex items-center justify-center"><Check className="h-3 w-3 text-[#0B1220]" /></span>}
        </button>
      ))}
    </div>
  );
}
```

**File: `src/components/onboarding/step-location-map.tsx`**

Uses `react-leaflet` with a draggable marker. Sri Lanka's approximate center is used as the default view.

```tsx
"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

const MapPicker = dynamic(() => import("./map-picker"), { ssr: false });

export type LocationFields = {
  address: string; district: string; city: string; county: string;
  state: string; postcode: string; directions: string;
  latitude: number; longitude: number;
};

export function StepLocationMap({ value, onChange }: { value: LocationFields; onChange: (v: LocationFields) => void }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="max-w-2xl">
      <p className="text-sm font-medium mb-2">Where is your business located?</p>
      <MapPicker
        latitude={value.latitude}
        longitude={value.longitude}
        onMove={(lat, lng) => onChange({ ...value, latitude: lat, longitude: lng })}
      />
      <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
        <div>
          <p className="text-sm font-medium">{value.city || "Set your location"}</p>
          <p className="text-xs text-[#A9B4C4]">Sri Lanka</p>
        </div>
        <button type="button" onClick={() => setEditing(true)} className="text-sm font-medium text-[#22C08C] hover:underline">Edit</button>
      </div>
      <p className="mt-2 text-xs text-[#8A94A6]">Drag the map to adjust the pin position.</p>

      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
          <div className="bg-[#101828] rounded-2xl p-8 w-full max-w-lg space-y-4">
            <h2 className="text-xl font-semibold">Edit business location</h2>
            <div className="grid grid-cols-2 gap-4">
              <LocField label="Address" v={value.address} k="address" value={value} onChange={onChange} span2 />
              <LocField label="District" v={value.district} k="district" value={value} onChange={onChange} />
              <LocField label="City" v={value.city} k="city" value={value} onChange={onChange} />
              <LocField label="County" v={value.county} k="county" value={value} onChange={onChange} />
              <LocField label="State" v={value.state} k="state" value={value} onChange={onChange} />
              <LocField label="Postcode" v={value.postcode} k="postcode" value={value} onChange={onChange} />
            </div>
            <div>
              <label className="text-xs text-[#A9B4C4]">Directions</label>
              <textarea
                value={value.directions}
                onChange={(e) => onChange({ ...value, directions: e.target.value })}
                rows={3}
                placeholder="Add details to help clients find your location"
                className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="rounded-md px-4 py-2 text-sm font-medium border border-white/10">Cancel</button>
              <button onClick={() => setEditing(false)} className="rounded-md px-4 py-2 text-sm font-medium bg-white text-[#101828]">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LocField({ label, v, k, value, onChange, span2 }: { label: string; v: string; k: keyof LocationFields; value: LocationFields; onChange: (v: LocationFields) => void; span2?: boolean }) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <label className="text-xs text-[#A9B4C4]">{label}</label>
      <input
        value={v}
        onChange={(e) => onChange({ ...value, [k]: e.target.value })}
        className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
      />
    </div>
  );
}
```

**File: `src/components/onboarding/map-picker.tsx`** (separate file so it can be dynamically imported with
`ssr: false`, Leaflet touches `window` and breaks server rendering otherwise):

```tsx
"use client";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useState } from "react";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function DraggableMarker({ position, onMove }: { position: [number, number]; onMove: (lat: number, lng: number) => void }) {
  const [pos, setPos] = useState(position);
  useMapEvents({
    click(e) {
      setPos([e.latlng.lat, e.latlng.lng]);
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });
  return (
    <Marker
      position={pos}
      draggable
      icon={icon}
      eventHandlers={{
        dragend: (e) => {
          const m = e.target.getLatLng();
          setPos([m.lat, m.lng]);
          onMove(m.lat, m.lng);
        },
      }}
    />
  );
}

export default function MapPicker({ latitude, longitude, onMove }: { latitude: number; longitude: number; onMove: (lat: number, lng: number) => void }) {
  // Default to Colombo, Sri Lanka if no coordinates are set yet
  const center: [number, number] = [latitude || 6.9271, longitude || 79.8612];
  return (
    <div className="rounded-lg overflow-hidden border border-white/10" style={{ height: 320 }}>
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <DraggableMarker position={center} onMove={onMove} />
      </MapContainer>
    </div>
  );
}
```

### Task 7.5 — Wire the wizard into a new page

**File: `src/app/dashboard/onboarding/page.tsx`**

This page replaces the *entry point* for brand-new owners with no business yet. It still calls the exact
same `POST /api/businesses` endpoint that `dashboard/settings/page.tsx` already calls, so nothing on the
server changes beyond Task 7.2's additive fields.

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { StepBusinessName } from "@/components/onboarding/step-business-name";
import { StepCategories } from "@/components/onboarding/step-categories";
import { StepTeamSize } from "@/components/onboarding/step-team-size";
import { StepLocationType } from "@/components/onboarding/step-location-type";
import { StepLocationMap, type LocationFields } from "@/components/onboarding/step-location-map";

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState("");
  const [locationType, setLocationType] = useState("PHYSICAL");
  const [location, setLocation] = useState<LocationFields>({
    address: "", district: "", city: "", county: "", state: "", postcode: "", directions: "",
    latitude: 6.9271, longitude: 79.8612,
  });

  function toggleCategory(id: string) {
    setCategories((cur) => (cur.includes(id) ? cur.filter((c) => c !== id) : cur.length < 4 ? [...cur, id] : cur));
  }

  function slugify(v: string) {
    return v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "salon";
  }

  async function handleFinish() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slugify(name),
          website: website || undefined,
          categories,
          teamSize,
          locationType,
          address: location.address || undefined,
          district: location.district || undefined,
          city: location.city || undefined,
          county: location.county || undefined,
          state: location.state || undefined,
          postcode: location.postcode || undefined,
          directions: location.directions || undefined,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not create business");
      router.push("/dashboard/qr-code");
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (step === 1) {
    return (
      <WizardShell step={1} totalSteps={TOTAL_STEPS} title="What's your business name?" subtitle="This is the brand name your clients will see. Your billing and legal name can be added later." onNext={() => setStep(2)} nextDisabled={!name.trim()}>
        <StepBusinessName name={name} website={website} onChangeName={setName} onChangeWebsite={setWebsite} />
      </WizardShell>
    );
  }
  if (step === 2) {
    return (
      <WizardShell step={2} totalSteps={TOTAL_STEPS} title="Select categories that best describe your business" subtitle="Choose your primary and up to three related service types." onBack={() => setStep(1)} onNext={() => setStep(3)} nextDisabled={categories.length === 0}>
        <StepCategories selected={categories} onToggle={toggleCategory} />
      </WizardShell>
    );
  }
  if (step === 3) {
    return (
      <WizardShell step={3} totalSteps={TOTAL_STEPS} title="What's your team size?" subtitle="This will help us set up your calendar correctly." onBack={() => setStep(2)} onNext={() => setStep(4)} nextDisabled={!teamSize}>
        <StepTeamSize value={teamSize} onChange={setTeamSize} />
      </WizardShell>
    );
  }
  if (step === 4) {
    return (
      <WizardShell step={4} totalSteps={TOTAL_STEPS} title="Where do you provide your services?" onBack={() => setStep(3)} onNext={() => setStep(5)}>
        <StepLocationType value={locationType} onChange={setLocationType} />
      </WizardShell>
    );
  }
  return (
    <WizardShell step={5} totalSteps={TOTAL_STEPS} title="Set your venue's physical location" subtitle="Add your primary business location so your clients can easily find you." onBack={() => setStep(4)} onNext={handleFinish} nextLabel={saving ? "Saving..." : "Finish"} nextDisabled={saving}>
      <StepLocationMap value={location} onChange={setLocation} />
      {error && <p className="mt-4 text-sm text-[#F87171]">{error}</p>}
    </WizardShell>
  );
}
```

### Task 7.6 — Point the onboarding guardrail at the wizard instead of the plain settings form

**File: `src/app/dashboard/layout.tsx`** — change one line. Find:

```ts
if (!pathname.startsWith("/dashboard/settings")) {
  redirect("/dashboard/settings");
}
```

Replace with:

```ts
if (!pathname.startsWith("/dashboard/settings") && !pathname.startsWith("/dashboard/onboarding")) {
  redirect("/dashboard/onboarding");
}
```

This keeps `/dashboard/settings` still reachable directly (existing behavior for anyone who bookmarks it
or is mid-edit) while sending brand-new owners to the new wizard first. No other line in this file
changes.

---

## PHASE 8 — Dedicated QR code page (separate from the dashboard calendar)

The `QrCard` component and its two API routes (`/api/businesses/[id]/qr`, `/api/qr/by-slug/[slug]`)
already exist and already work, this phase only relocates where it is *shown*, it does not touch
`src/lib/qr.ts` or the QR API routes at all.

### Task 8.1 — Create `src/app/dashboard/qr-code/page.tsx`

```tsx
"use client";
import { useEffect, useState } from "react";
import { Loader2, QrCode } from "lucide-react";
import { QrCard } from "@/components/booking/QrCard";

export default function QrCodePage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/businesses")
      .then((r) => r.json())
      .then((j) => {
        const b = j.data?.[0];
        if (b) {
          setBusinessId(b.id);
          setSlug(b.slug);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-[#EAF3F2] flex items-center justify-center border border-[#E3E8F0]">
          <QrCode className="h-5 w-5 text-[#14B8A6]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#101828]">Your booking QR code</h1>
          <p className="text-sm text-[#8A94A6] mt-1">Print this and display it at reception, on mirrors, or on business cards.</p>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[#8A94A6]"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
        ) : businessId ? (
          <QrCard businessId={businessId} slug={slug ?? undefined} />
        ) : (
          <p className="text-sm text-[#8A94A6]">Create your salon profile first to generate a QR code.</p>
        )}
      </div>
    </div>
  );
}
```

### Task 8.2 — Add it to the dashboard navigation

**File: `src/components/dashboard/nav.tsx`** — add one entry to the `items` array and one import:

```ts
import { LayoutDashboard, Scissors, Users, Calendar, Settings, UsersRound, QrCode } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Bookings", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/services", label: "Services", icon: Scissors },
  { href: "/dashboard/staff", label: "Staff", icon: UsersRound },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/qr-code", label: "QR code", icon: QrCode },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];
```

### Task 8.3 — Remove the duplicate QR card from Settings (optional but recommended)

**File: `src/app/dashboard/settings/page.tsx`** — the QR block at the bottom of the file
(`{businessId && slug && (<div className="mt-6"><QrCard .../></div>)}`) can now simply link to the new
page instead of rendering the card twice:

```tsx
{businessId && slug && (
  <div className="mt-6 text-center">
    <Link href="/dashboard/qr-code" className="text-sm font-medium text-[#26418F] hover:underline">
      View and download your booking QR code →
    </Link>
  </div>
)}
```

Add `import Link from "next/link";` at the top of the file if it is not already imported.

---

## PHASE 9 — Customer marketplace: public search with a radius map

### Task 9.1 — ADDITIVE new public API route: marketplace search

This is a brand new route, it does not modify any existing route or its behavior.

**File: `src/app/api/marketplace/search/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * GET /api/marketplace/search?lat=&lng=&radiusKm=&category=&q=
 * Public endpoint. Returns only non-sensitive fields needed for discovery.
 * Does not require auth, does not touch /api/businesses (owner-scoped route).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const radiusKm = parseFloat(searchParams.get("radiusKm") ?? "10");
  const category = searchParams.get("category");
  const q = searchParams.get("q");

  const businesses = await db.business.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      ...(category ? { categories: { has: category } } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    select: {
      id: true, name: true, slug: true, logoUrl: true, address: true, city: true,
      categories: true, latitude: true, longitude: true,
    },
    take: 200,
  });

  const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lng);
  const withDistance = businesses
    .map((b) => ({
      ...b,
      distanceKm: hasCoords ? distanceKm(lat, lng, b.latitude!, b.longitude!) : null,
    }))
    .filter((b) => !hasCoords || b.distanceKm! <= radiusKm)
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

  return NextResponse.json({ data: withDistance });
}
```

### Task 9.2 — Customer discovery home page

**File: `src/app/customer/page.tsx`**

```tsx
import Link from "next/link";
import { Search, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CustomerHome() {
  return (
    <main className="min-h-screen bg-[#F7F9FC]">
      <header className="h-16 border-b border-[#E3E8F0] bg-white flex items-center justify-between px-6 lg:px-12">
        <Link href="/customer" className="text-lg font-semibold tracking-tight text-[#101828]">ADNAVRA</Link>
        <div className="flex items-center gap-3">
          <Link href="/customer/login" className="text-sm font-medium text-[#101828] hover:underline">Log in</Link>
          <Link href="/customer/signup"><Button>Sign up</Button></Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 brand-gradient-bg opacity-[0.08]" />
        <div className="relative px-6 lg:px-12 py-20 max-w-[900px] mx-auto text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-[#101828]">Book local salon services</h1>
          <p className="mt-2 text-[#475467]">Discover top-rated salons, barbers, spas and beauty experts near you</p>
          <form action="/customer/search" className="mt-8 flex flex-col sm:flex-row gap-2 bg-white rounded-full border border-[#E3E8F0] p-2 shadow-[0_4px_20px_rgba(16,24,40,0.08)]">
            <div className="flex items-center gap-2 flex-1 px-4">
              <Search className="h-4 w-4 text-[#8A94A6]" />
              <input name="q" placeholder="All treatments" className="w-full py-2 text-sm outline-none" />
            </div>
            <div className="flex items-center gap-2 flex-1 px-4 border-t sm:border-t-0 sm:border-l border-[#E3E8F0]">
              <MapPin className="h-4 w-4 text-[#8A94A6]" />
              <input name="location" placeholder="Current location" className="w-full py-2 text-sm outline-none" />
            </div>
            <div className="flex items-center gap-2 flex-1 px-4 border-t sm:border-t-0 sm:border-l border-[#E3E8F0]">
              <CalendarIcon className="h-4 w-4 text-[#8A94A6]" />
              <input name="time" placeholder="Any time" className="w-full py-2 text-sm outline-none" />
            </div>
            <Button type="submit" variant="gradient" className="rounded-full">Search</Button>
          </form>
        </div>
      </section>
    </main>
  );
}
```

### Task 9.3 — Customer search results with a radius map

**File: `src/app/customer/search/page.tsx`**

```tsx
"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MapPin, Star } from "lucide-react";

const ResultsMap = dynamic(() => import("@/components/customer/results-map"), { ssr: false });

type Result = {
  id: string; name: string; slug: string; logoUrl: string | null;
  address: string | null; city: string | null; latitude: number; longitude: number; distanceKm: number | null;
};

function SearchInner() {
  const params = useSearchParams();
  const [radiusKm, setRadiusKm] = useState(10);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  // Default center: Colombo, Sri Lanka. In production, geocode `params.get("location")`
  // via a free service (e.g. Nominatim) before calling the search API.
  const center: [number, number] = [6.9271, 79.8612];

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({
      lat: String(center[0]), lng: String(center[1]), radiusKm: String(radiusKm),
      ...(params.get("q") ? { q: params.get("q")! } : {}),
    });
    fetch(`/api/marketplace/search?${qs.toString()}`)
      .then((r) => r.json())
      .then((j) => setResults(j.data ?? []))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusKm]);

  return (
    <div className="grid lg:grid-cols-[420px_1fr] h-[calc(100vh-64px)]">
      <div className="overflow-y-auto border-r border-[#E3E8F0] bg-white p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[#101828]">{results.length} salons nearby</p>
          <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="text-sm border border-[#E3E8F0] rounded-md px-2 py-1">
            <option value={2}>Within 2 km</option>
            <option value={5}>Within 5 km</option>
            <option value={10}>Within 10 km</option>
            <option value={25}>Within 25 km</option>
          </select>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-[#8A94A6]">Searching...</p>
        ) : (
          <div className="mt-4 space-y-3">
            {results.map((r) => (
              <Link key={r.id} href={`/${r.slug}`} className="block rounded-lg border border-[#E3E8F0] p-4 hover:border-[#26418F]">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-[#EAF3F2] flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-[#14B8A6]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#101828] truncate">{r.name}</p>
                    <p className="text-xs text-[#8A94A6] truncate">{r.address ?? r.city}</p>
                    {r.distanceKm != null && <p className="text-xs text-[#14B8A6] mt-0.5">{r.distanceKm.toFixed(1)} km away</p>}
                  </div>
                </div>
              </Link>
            ))}
            {results.length === 0 && <p className="text-sm text-[#8A94A6] mt-6">No salons found in this radius yet.</p>}
          </div>
        )}
      </div>
      <ResultsMap center={center} results={results} radiusKm={radiusKm} />
    </div>
  );
}

export default function CustomerSearchPage() {
  return (
    <main className="min-h-screen bg-[#F7F9FC]">
      <header className="h-16 border-b border-[#E3E8F0] bg-white flex items-center px-6">
        <Link href="/customer" className="text-lg font-semibold tracking-tight text-[#101828]">ADNAVRA</Link>
      </header>
      <Suspense fallback={<div className="p-10 text-sm text-[#8A94A6]">Loading search...</div>}>
        <SearchInner />
      </Suspense>
    </main>
  );
}
```

**File: `src/components/customer/results-map.tsx`**

```tsx
"use client";
import { MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import L from "leaflet";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type Result = { id: string; name: string; slug: string; latitude: number; longitude: number };

export default function ResultsMap({ center, results, radiusKm }: { center: [number, number]; results: Result[]; radiusKm: number }) {
  return (
    <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Circle center={center} radius={radiusKm * 1000} pathOptions={{ color: "#14B8A6", fillOpacity: 0.05 }} />
      {results.map((r) => (
        <Marker key={r.id} position={[r.latitude, r.longitude]} icon={icon}>
          <Popup>
            <a href={`/${r.slug}`} className="text-sm font-medium">{r.name}</a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

### Task 9.4 — Customer auth pages (separate, lighter, from the professional ones)

**File: `src/app/customer/login/page.tsx`** and **`src/app/customer/signup/page.tsx`** follow the same
pattern as `(auth)/login/page.tsx` and `(auth)/signup/page.tsx` from Phase 5, but:

- Light background (`bg-white` / `bg-[#F7F9FC]`) instead of the dark professional theme, since customers
  are a different, lighter-touch audience (mirrors the visual split already used as a reference).
- The signup form has no business-name/business-slug section at all, just name, email, phone, password.
- The submit payload includes `role: "CUSTOMER"` explicitly:

```tsx
const payload = {
  email: email.trim().toLowerCase(),
  password,
  name: name.trim(),
  role: "CUSTOMER",
};
```

- `signIn("credentials", { ..., redirect: false })` uses `callbackUrl` defaulting to `/customer` instead
  of `/dashboard`.
- Footer link points back the other way: "Own a salon? Go to ADNAVRA for business" → `/login`.

Do not duplicate the entire file here, copy `(auth)/signup/page.tsx` as the starting point, delete the
business-name block, add the `role` field, change the light theme classes, and change the redirect
target. This keeps the two flows visually distinct the way the reference screenshots show, while sharing
one backend endpoint safely (Task 5.1's additive `role` field is what makes this possible without a
second signup route).

### Task 9.5 — Restyle the existing public salon profile and booking pages

**Files: `src/app/[businessSlug]/page.tsx`** and **`src/app/[businessSlug]/book/page.tsx`** — these
already work end-to-end (they query `db.business` directly and already exist). Only apply the Task 1.5
color find-and-replace to them (already listed in that task's file list), do not change any query logic,
any prop, or any data shape. Optionally add a "View on map" link if `business.latitude` and
`business.longitude` are present:

```tsx
{business.latitude && business.longitude && (
  <a
    href={`https://www.openstreetmap.org/?mlat=${business.latitude}&mlon=${business.longitude}#map=16/${business.latitude}/${business.longitude}`}
    target="_blank" rel="noreferrer"
    className="text-xs text-[#26418F] hover:underline inline-flex items-center gap-1"
  >
    View on map
  </a>
)}
```

This requires the query in `[businessSlug]/page.tsx` to also select the new fields; since the query
currently does `db.business.findUnique({ where: { slug }, include: { services: ... } })` with no explicit
`select`, Prisma already returns every scalar column including the new ones by default, so no query
change is needed here at all.

---

## PHASE 10 — Copy and content rules (apply while writing any of the above)

- No em dashes anywhere. Search the codebase for the em dash character (`—`) after finishing and replace
  every instance with a comma or a period.
- No AI-slop words: "unlock", "seamless", "supercharge", "elevate", "revolutionize", "game-changing",
  "in today's fast-paced world", "look no further", "cutting-edge".
- All prices are LKR, matching the PDF exactly: Starter LKR 3,000/month, Professional LKR 5,000/month
  (most popular), Premium LKR 7,000/month, one-time setup LKR 15,000.
- Every icon is a `lucide-react` import, never an emoji character, matching the existing project rule in
  `DESIGN.md`.
- Keep every existing English copy tone: direct, factual, no exclamation marks, matching the PDF's voice.

---

## PHASE 11 — Final QA checklist

Run through this list before considering the redesign complete:

- [ ] `npm run lint` passes with zero errors
- [ ] `npm run test` passes (existing `tests/availability.test.ts` and `tests/booking-race.test.ts` must
      still pass unchanged, since booking logic was never touched)
- [ ] `npm run build` completes successfully
- [ ] `npx prisma migrate dev` applied cleanly with the new additive columns, `npx prisma studio` shows
      existing businesses with the new columns present and `null`
- [ ] Logo renders in the header on `/`, `/pricing`, `/login`, `/signup`, `/customer`
- [ ] Favicon shows the ADNAVRA mark in the browser tab
- [ ] Every `#B85C38`-family hex is gone from `src/` (re-run the grep from Task 1.5, it should return zero
      files)
- [ ] `/` shows hero, problem section, how it works, features, pricing (3 cards + explanatory paragraphs
      beneath), QR section, business benefits, FAQ, final CTA, footer
- [ ] `/pricing` shows the same pricing section standalone
- [ ] `/login` and `/signup` (professional) are the dark split-screen design with Google/WhatsApp buttons
      present (disabled unless Phase 6 was done) and a link to `/customer/login`
- [ ] A brand-new OWNER signup is redirected to `/dashboard/onboarding`, completes all 5 steps, and lands
      on `/dashboard/qr-code` with a working, downloadable QR code
- [ ] `/dashboard` nav bar shows the new "QR code" item
- [ ] `/customer` shows the search bar home page
- [ ] `/customer/search?q=...` shows a results list on the left and a Leaflet map with a radius circle on
      the right, and the radius dropdown actually changes which pins are shown
- [ ] `/customer/signup` creates a `CUSTOMER`-role user (verify in `prisma studio`, the existing OWNER
      signup flow must still create `OWNER`-role users exactly as before)
- [ ] Existing dashboard pages (`calendar`, `customers`, `services`, `staff`, `settings`) still function
      exactly as before, only their colors changed
