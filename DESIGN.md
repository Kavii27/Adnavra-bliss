---
version: 1.0
name: ADNAVRA Design System
description: ADNAVRA — a Sri Lankan salon-booking SaaS. The system is built on a deep indigo-to-teal-to-emerald brand gradient (from the ADNAVRA logo) on a cool off-white canvas. Design voice is clean and confident, not warm/rustic. All icons use lucide-react (never emoji). The palette is one indigo primary + one teal accent + one warm-neutral-free cool gray scale + semantic states.
icons: lucide-react
icons_note: "Use lucide-react for every icon. Never use emoji as icons."

colors:
  primary: "#8a6d4f"
  primary-active: "#5f4630"
  primary-soft: "#E2E8F9"
  accent: "#c9a26d"
  accent-active: "#0F9488"
  accent-soft: "#DDF3EF"
  ink: "#3a2f22"
  body: "#475467"
  muted: "#a89880"
  muted-soft: "#B7BFCB"
  hairline: "#E3E8F0"
  hairline-soft: "#EEF2F7"
  canvas: "#faf6ef"
  surface-soft: "#EFF4FA"
  surface-card: "#EAF3F2"
  surface-dark: "#faf6ef"
  surface-dark-elevated: "#f6efe3"
  on-primary: "#FFFFFF"
  on-dark: "#faf6ef"
  on-dark-soft: "#a89880"
  brand-gradient: "linear-gradient(135deg, #4a3620 0%, #8a6d4f 50%, #c9a26d 100%)"
  success: "#15803D"
  success-soft: "#DCF5E7"
  warning: "#B45309"
  warning-soft: "#FDECD8"
  error: "#B91C1C"
  error-soft: "#FDECEC"
  badge-neutral: "#E7ECF2"

typography:
  display-xl:
    fontFamily: "Cal Sans, Inter, sans-serif"
    fontSize: 64px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -2px
  display-lg:
    fontFamily: "Cal Sans, Inter, sans-serif"
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -1.5px
  display-md:
    fontFamily: "Cal Sans, Inter, sans-serif"
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -1px
  display-sm:
    fontFamily: "Cal Sans, Inter, sans-serif"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.5px
  title-lg:
    fontFamily: "Inter, sans-serif"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.3px
  title-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  title-sm:
    fontFamily: "Inter, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  body-md:
    fontFamily: "Inter, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-sm:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "Inter, sans-serif"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  button:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0
  nav-link:
    fontFamily: "Inter, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 40px
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-primary-disabled:
    backgroundColor: "{colors.primary-disabled}"
    textColor: "{colors.muted}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 40px
  button-icon-circular:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: 36px
  button-text-link:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.button}"
  text-link:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    height: 64px
  nav-pill-group:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    rounded: "{rounded.pill}"
    padding: 6px
  hero-band:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.display-xl}"
    padding: 96px
  hero-app-mockup-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
  feature-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.title-md}"
    rounded: "{rounded.lg}"
    padding: 32px
  feature-icon-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.title-sm}"
    rounded: "{rounded.lg}"
    padding: 24px
  product-mockup-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 24px
  testimonial-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 24px
  pricing-tier-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.title-lg}"
    rounded: "{rounded.lg}"
    padding: 32px
  pricing-tier-card-featured:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark}"
    typography: "{typography.title-lg}"
    rounded: "{rounded.lg}"
    padding: 32px
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 10px 14px
    height: 40px
  text-input-focused:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  category-tab:
    backgroundColor: transparent
    textColor: "{colors.muted}"
    typography: "{typography.nav-link}"
    padding: 8px 14px
    rounded: "{rounded.md}"
  category-tab-active:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    rounded: "{rounded.md}"
  avatar-circle:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: 36px
  badge-pill:
    backgroundColor: "{colors.badge-terracotta}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 4px 12px
  rating-stars:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.caption}"
  cta-band-light:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.display-sm}"
    rounded: "{rounded.lg}"
    padding: 48px
  footer:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.on-dark-soft}"
    typography: "{typography.body-sm}"
    padding: 64px
---

## Overview

ADNAVRA's surface is a warm, premium salon-booking SaaS — warm white canvas (`{colors.canvas}` — #FFFBF8) with **warm terracotta** primary CTAs (`{colors.primary}` — #B85C38), modern display typography (Cal Sans / Inter), and `{colors.surface-card}` (#F9EFE8) sand-toned cards holding real product UI fragments. The system reads as hospitable and grounded — generous whitespace, soft-rounded cards (~12px), and a terracotta accent that evokes Sri Lankan earth and salon warmth without ever using purple-to-pink gradients.

Type voice splits into two roles: **Cal Sans** (display, geometric, slightly condensed) for h1–h3 and **Inter** for everything else (body, buttons, nav, captions). Cal Sans uses weight 600 with negative letter-spacing (-0.5px to -2px). All icons are **lucide-react** — never emoji.

Component voltage comes from **real product UI shown in-card** — booking calendars, availability pickers, service grids — displayed at small scale inside marketing cards. No illustrated mockups; show the actual booking flow.

The footer flips to `{colors.surface-dark}` (#1E1C1A) — a warm charcoal that visually closes every long-scroll page. The footer is the only dark surface on the system; everything above stays warm-white with sand cards.

**Key Characteristics:**
- Warm white canvas with terracotta primary CTA (`{colors.primary}` — #B85C38). Buttons are `{rounded.md}` (8px), weight-600 labels, terracotta fill. No gradients — flat color only. Press state shifts to `{colors.primary-active}` (#9E4B2E).
- Single accent color (terracotta #B85C38) + single warm neutral scale (charcoal → sand → warm white). No competing hues, no purple/pink.
- Custom `Cal Sans` display typeface for headlines, `Inter` for body. Negative letter-spacing on display sizes — geometric, precise, slightly condensed.
- Sand card surfaces (`{colors.surface-card}` — #F9EFE8) for feature cards, testimonials. The featured pricing tier flips to `{colors.surface-dark}` (the only dark card on light pages).
- Product UI fragments embedded directly in cards — ADNAVRA shows real booking pickers and salon profile previews inside marketing cards.
- Nav-pill-group (`{component.nav-pill-group}`) — pill-radius wrapper around grouped nav segments. Signature interactive component.
- Avatars are circular (`{rounded.full}`), 36px diameter, with terracotta/sand/sage tints for fills — never violet/pink/orange pastels.
- Footer is warm charcoal (`{colors.surface-dark}` — #1E1C1A) with warm muted text (`{colors.on-dark-soft}` — #C4B8B0).
- Spacing rhythm is `{spacing.section}` (96px) between major bands.
- Border radius is hierarchical: `{rounded.md}` (8px) for buttons + inputs, `{rounded.lg}` (12px) for content cards, `{rounded.xl}` (16px) for hero app-mockup container, `{rounded.pill}` for badges + nav-pill-group, `{rounded.full}` for avatars + icon buttons.
- Icons: **lucide-react** everywhere (Calendar, Clock, Scissors, Sparkles, MapPin, etc.). No emoji.

## Colors

### Brand & Accent
- **Primary / Brand Accent** (`{colors.primary}` / `{colors.brand-accent}` — #B85C38): Warm terracotta. The *only* accent color. All primary CTAs, active states, and small highlights. Press state `{colors.primary-active}` (#9E4B2E). Soft tint `{colors.brand-accent-soft}` (#F5DDD0) for subtle backgrounds and badge fills.
- **Intentionally single-accent:** ADNAVRA does not use a secondary competing hue. Warm neutrals carry the rest of the UI.

### Surface
- **Canvas** (`{colors.canvas}` — #FFFBF8): Warm white page floor. Slightly warmer than pure #ffffff for salon hospitality.
- **Surface Soft** (`{colors.surface-soft}` — #FDF6F0): Nav-pill-group background, very-soft section dividers.
- **Surface Card** (`{colors.surface-card}` — #F9EFE8): Feature cards, testimonial cards, default avatar fills. Warm sand.
- **Surface Strong** (`{colors.surface-strong}` — #E8DDD6): Hairline border alternative; disabled button background.
- **Surface Dark** (`{colors.surface-dark}` — #1E1C1A): Warm charcoal footer + featured pricing tier card. The only dark surface.
- **Surface Dark Elevated** (`{colors.surface-dark-elevated}` — #2E2A28): Nested cards inside dark footer or featured pricing card.
- **Hairline** (`{colors.hairline}` — #E8DDD6): 1px border tone on light surfaces. Inputs, dividers, card outlines.
- **Hairline Soft** (`{colors.hairline-soft}` — #F3EDE8): Barely-visible divider between sections sharing the warm canvas.

### Text
- **Ink** (`{colors.ink}` — #1E1C1A): All headlines and primary text. Warm near-black.
- **Body** (`{colors.body}` — #4A4540): Default running-text color. Warm gray-brown.
- **Muted** (`{colors.muted}` — #8A8580): Secondary text — sub-headings, breadcrumbs, footer body.
- **Muted Soft** (`{colors.muted-soft}` — #A8A4A0): Tertiary text — captions, fine-print.
- **On Primary / On Dark** (`{colors.on-primary}` — #FFFFFF / `{colors.on-dark}` — #FFFBF8): Text on primary buttons and dark footer.
- **On Dark Soft** (`{colors.on-dark-soft}` — #C4B8B0): Footer body text — warm muted white for link rows.

### Badge Tints (derived from the single accent + neutrals, not competing hues)
- **Badge Terracotta** (`{colors.badge-terracotta}` — #F5DDD0): Soft terracotta tint for primary badges.
- **Badge Sand** (`{colors.badge-sand}` — #EDE3DA): Warm neutral badge fill.
- **Badge Sage** (`{colors.badge-sage}` — #D8E6DE): Desaturated sage — the only cool tint, used sparingly for success-adjacent badges (availability, confirmed). Still muted and harmonious with terracotta.

### Semantic
- **Success** (`{colors.success}` — #1B7A5A): Desaturated sage green — confirmation states. Not emerald-neon.
- **Warning** (`{colors.warning}` — #B7791F): Warm amber — warning callouts.
- **Error** (`{colors.error}` — #B93838): Muted clay red — validation errors.

## Typography

### Font Family
The system runs **Cal Sans** for display + brand wordmark and **Inter** for everything else. Cal Sans is the geometric display face — weight 600, negative letter-spacing. Inter handles body, buttons, navigation, captions, and code. Fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.

Split:
- Cal Sans (display, 600, -0.5 to -2px tracking) — h1, h2, h3
- Inter (body + UI, 400–600, 0 tracking) — paragraphs, labels, buttons, nav

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 64px | 600 | 1.05 | -2px | Homepage h1 — Cal Sans |
| `{typography.display-lg}` | 48px | 600 | 1.1 | -1.5px | Section heads — Cal Sans |
| `{typography.display-md}` | 36px | 600 | 1.15 | -1px | Sub-section heads — Cal Sans |
| `{typography.display-sm}` | 28px | 600 | 1.2 | -0.5px | CTA-band heads, pricing prices — Cal Sans |
| `{typography.title-lg}` | 22px | 600 | 1.3 | -0.3px | Pricing plan names — Inter |
| `{typography.title-md}` | 18px | 600 | 1.4 | 0 | Feature card titles |
| `{typography.title-sm}` | 16px | 600 | 1.4 | 0 | Small card titles |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0 | Default running-text |
| `{typography.body-sm}` | 14px | 400 | 1.5 | 0 | Footer body, fine-print |
| `{typography.caption}` | 13px | 500 | 1.4 | 0 | Badge labels, captions |
| `{typography.code}` | 14px | 400 | 1.5 | 0 | Code — JetBrains Mono |
| `{typography.button}` | 14px | 600 | 1.0 | 0 | Button labels |
| `{typography.nav-link}` | 14px | 500 | 1.4 | 0 | Top-nav items |

### Principles
Cal Sans is the brand voice — every display headline uses it. Inter handles supporting type. Never blur the boundary. Cal Sans without negative letter-spacing reads as off-brand.

Display weight stays at 600 — never 700, never 500.

### Note on Font Substitutes
If Cal Sans is unavailable, **Inter** at weight 600 with -0.04em letter-spacing is a usable approximation. **Manrope** at weight 700 is another close alternative.

## Layout

### Spacing System
- **Base unit:** 4px.
- **Tokens:** `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.xxl}` 48px · `{spacing.section}` 96px.
- **Section padding:** `{spacing.section}` (96px) — universal vertical rhythm between editorial bands.
- **Card internal padding:** `{spacing.xl}` (32px) for feature cards and pricing tier cards; `{spacing.lg}` (24px) for testimonial and product-mockup cards.
- **Gutters:** `{spacing.lg}` (24px) between cards in 3-up grids; `{spacing.md}` (16px) inside footer columns.

### Grid & Container
- **Max content width:** ~1200px centered on marketing pages.
- **Editorial body:** Single 12-column grid; hero band often uses 7/5 split (h1 left, app mockup card right).
- **Feature card grids:** 3-up at desktop, 2-up at tablet, 1-up at mobile.
- **Pricing grid:** 4-up at desktop, 2-up at tablet, 1-up at mobile.
- **Footer:** 4-column link list at desktop, wrapping to 2-up at tablet, 1-up at mobile.

### Whitespace Philosophy
Generous but not excessive — 96px section padding, 32px card internal padding. Every band has a single h1 + h2 + supporting cards, never densely packed lists. Confident-not-shouting.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow, no border | Body sections, top nav, hero bands |
| Soft hairline | 1px `{colors.hairline}` border | Inputs, table dividers, occasionally on cards |
| Card surface | `{colors.surface-card}` background — no shadow | Feature cards, testimonials |
| Subtle drop shadow | Faint shadow at low alpha | Pricing tier cards, hover-elevated states (`0 1px 2px rgba(30,28,26,0.05)` and `0 4px 12px rgba(30,28,26,0.08)`) |
| Featured tier | `{colors.surface-dark}` background, no shadow needed | Featured pricing tier — color contrast does elevation |

Elevation is **soft and modern** — small drop shadows on elevated cards, color-block contrast for emphasis. No heavy shadows, no neumorphism, no glassmorphism. All shadows use warm charcoal alpha, never pure black.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Badge accents |
| `{rounded.sm}` | 6px | Small inline buttons, dropdown items |
| `{rounded.md}` | 8px | Standard CTA buttons, text inputs, category tabs |
| `{rounded.lg}` | 12px | Content cards (feature/testimonial/pricing) |
| `{rounded.xl}` | 16px | Hero app-mockup card |
| `{rounded.pill}` | 9999px | Nav-pill-group, badge pills |
| `{rounded.full}` | 9999px / 50% | Avatars, icon buttons |

### Photography Geometry
Avatar photos use `{rounded.full}` (perfect circles) at 36px or 40px. Hero illustration zones use 16:9 or 4:3 ratios with `{rounded.xl}` corners.

## Components

### Top Navigation

**`top-nav`** — Warm-white nav bar pinned to top of every page. 64px tall, `{colors.canvas}` background. Carries ADNAVRA wordmark at left, primary horizontal menu center, right cluster with "Sign in" text-link and "Sign up free" `{component.button-primary}`. Menu items in `{typography.nav-link}`.

**`nav-pill-group`** — Pill-radius wrapper around 2–3 sub-nav segments. Background `{colors.surface-soft}` with 6px internal padding, rounded `{rounded.pill}`. Active segment renders as warm-white pill with subtle drop shadow.

### Buttons

**`button-primary`** — Signature terracotta CTA. Background `{colors.primary}` (#B85C38), text `{colors.on-primary}`, type `{typography.button}`, padding 12px × 20px, height 40px, rounded `{rounded.md}`. Active shifts to `{colors.primary-active}` (#9E4B2E). **No gradients — flat terracotta only.**

**`button-secondary`** — Warm-white button with hairline outline. Background `{colors.canvas}`, text `{colors.ink}`, 1px hairline border, same padding + height + radius as primary.

**`button-icon-circular`** — 36 × 36px circular icon button. Background `{colors.canvas}`, hairline border, ink-color lucide-react icon. Used for share, carousel arrows.

**`button-text-link`** — Inline text button, no background. Used for "Sign in" in top nav.

**`text-link`** — Inline body links in `{colors.ink}`. Underlined on hover.

### Cards & Containers

**`hero-band`** — Warm-white hero with 7-5 grid: h1 + sub-headline + button row left, `{component.hero-app-mockup-card}` right. Vertical padding `{spacing.section}`.

**`hero-app-mockup-card`** — Larger product-UI mockup card showing ADNAVRA booking widget (calendar grid, time slots, Confirm button in terracotta). Background `{colors.canvas}`, 1px hairline border, rounded `{rounded.xl}`, subtle drop shadow.

**`feature-card`** — 3-up feature grids. Background `{colors.surface-card}` (#F9EFE8), rounded `{rounded.lg}`, padding `{spacing.xl}`. Carries a lucide-react icon at top, `{typography.title-md}` headline, body description.

**`feature-icon-card`** — Simpler card variant in 4-up lower-density bands. Background `{colors.canvas}` with hairline border, rounded `{rounded.lg}`, padding `{spacing.lg}`.

**`product-mockup-card`** — Card showing ADNAVRA product UI fragments (availability calendar, service grid). Background `{colors.canvas}`, rounded `{rounded.lg}`, padding `{spacing.lg}`.

**`testimonial-card`** — Customer-quote grids. Background `{colors.surface-card}`, rounded `{rounded.lg}`, padding `{spacing.lg}`. Top row: `{component.avatar-circle}` + name + role; below: quote in `{typography.body-md}`.

**`pricing-tier-card`** — Standard tier card. Background `{colors.canvas}`, rounded `{rounded.lg}`, padding `{spacing.xl}`. Plan name in `{typography.title-lg}`, price in `{typography.display-sm}`, checklist in `{typography.body-md}`, `{component.button-primary}` at bottom.

**`pricing-tier-card-featured`** — Featured tier (Professional). Background flips to `{colors.surface-dark}` (#1E1C1A), text inverts to `{colors.on-dark}`. Dark surface IS the signal — no accent border, no scale shift.

### Inputs & Forms

**`text-input`** — Background `{colors.canvas}`, text `{colors.ink}`, type `{typography.body-md}`, rounded `{rounded.md}`, padding 10px × 14px, height 40px. 1px `{colors.hairline}` border.

**`text-input-focused`** — Border shifts to `{colors.ink}` for emphasis.

### Tags / Badges

**`badge-pill`** — Small pill label. Background `{colors.badge-terracotta}` or `{colors.badge-sand}`, text `{colors.ink}`, type `{typography.caption}`, rounded `{rounded.pill}`, padding 4px × 12px. Never violet/pink/orange.

**`avatar-circle`** — 36px diameter, rounded `{rounded.full}`. Holds photo or warm tint fill with initials in `{typography.caption}`.

**`rating-stars`** — Inline star rating in `{colors.primary}` (#B85C38). Used near testimonial avatars.

### Tab / Filter

**`category-tab`** + **`category-tab-active`** — Inside nav-pill-group. Inactive: transparent, `{colors.muted}` text. Active: `{colors.canvas}` background, `{colors.ink}` text, subtle shadow. Padding 8px × 14px, rounded `{rounded.md}`.

### CTA / Footer

**`cta-band-light`** — Pre-footer CTA card. Background `{colors.surface-card}`, rounded `{rounded.lg}`, padding `{spacing.xxl}` (48px). H2 in `{typography.display-sm}`, sub-line, `{component.button-primary}` centered.

**`footer`** — Warm charcoal footer that closes every page. Background `{colors.surface-dark}` (#1E1C1A), text `{colors.on-dark-soft}`. 4-column link list at desktop. Vertical padding 64px. ADNAVRA wordmark at top-left in `{colors.on-dark}`.

## Icons

All icons use **lucide-react**. Never emoji. Common ADNAVRA icons: `Calendar`, `Clock`, `Scissors`, `Sparkles`, `MapPin`, `Phone`, `Mail`, `User`, `Settings`, `LogOut`, `ChevronRight`, `Star`, `Check`, `X`, `Menu`, `Search`. Import pattern: `import { Calendar } from "lucide-react"`.

## Do's and Don'ts

### Do
- Reserve `{colors.primary}` (#B85C38) for primary CTAs and key interactive highlights. Flat fill, no gradient.
- Use Cal Sans for every display headline. Pair with Inter body. Never blur the boundary.
- Apply negative letter-spacing on display sizes (-0.5 to -2px).
- Use `{component.feature-card}` (sand) and `{component.product-mockup-card}` (warm white with chrome) deliberately — gray→sand now signals "feature claim" vs "look at the product".
- Embed real product UI fragments inside marketing cards.
- Keep avatar circles at 36px, perfect circles, with terracotta/sand/sage tints only.
- Use `{component.nav-pill-group}` for grouped sub-nav segments.
- End every page with the warm charcoal footer.
- Use lucide-react for every icon.

### Don't
- Don't use purple, violet, pink, or blue-to-pink gradients anywhere — no `from-purple-500 to-pink-500`, no `#8b5cf6`, no `#ec4899`.
- Don't use emoji as icons — lucide-react only.
- Don't introduce a second competing accent color. One terracotta + warm neutrals + semantic states is the entire palette.
- Don't bold display weight beyond 600.
- Don't use radius beyond `{rounded.xl}` (16px) on cards.
- Don't put dark surface cards anywhere except the footer and the featured pricing tier.
- Don't repeat the same surface mode in two consecutive bands. Alternate warm-white → sand → warm-white → product-mockup-card → warm-white → dark-footer.
- Don't add hover state styling beyond what the system encodes — primary darkens on press; nothing else changes.
- Don't use inline `style={{}}` — use Tailwind classes and DESIGN.md tokens.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px | Hamburger nav; hero h1 64→32px; hero-app-mockup-card stacks below content; feature grids 1-up; pricing 1-up; footer 4 cols → 1 |
| Tablet | 768–1024px | Top nav stays horizontal but tightens; nav-pill-group wraps; feature cards 2-up; pricing 2-up |
| Desktop | 1024–1440px | Full top-nav; 3-up feature cards; 4-up pricing tiers |
| Wide | > 1440px | Same as desktop with more outer breathing room; max content width caps at 1200px |

### Touch Targets
- `{component.button-primary}` minimum 40 × 40px.
- `{component.button-icon-circular}` at 36 × 36 — slightly under WCAG 44×44 but compensated by full-circle silhouette.
- `{component.text-input}` height is 40px.
- `{component.category-tab}` inside nav-pill-group has 8 × 14 padding; effective tap area meets 44px+ with surrounding pill.

### Collapsing Strategy
- Top nav collapses to hamburger at < 768px; menu opens as full-screen sheet.
- Hero band's 7-5 grid collapses to single-column on mobile.
- Feature grids reduce columns rather than scaling cards down.
- Pricing tier cards collapse 4 → 2 → 1; featured-tier dark surface stays distinct at every breakpoint.
- Nav-pill-group wraps to multi-row on tablet.
- Avatar + testimonial layouts stay grid-aligned at every breakpoint.

## Iteration Guide

1. Focus on ONE component at a time. Reference its YAML key directly (`{component.feature-card}`, `{component.pricing-tier-card-featured}`).
2. Variants (`-active`, `-disabled`, `-focused`) live as separate entries in `components:`.
3. Use `{token.refs}` everywhere — never inline hex.
4. Never document hover. Default and Active/Pressed states only.
5. Display headlines stay Cal Sans 600 with negative letter-spacing. Body stays Inter 400.
6. The dark footer is the only dark surface on most pages.
7. When in doubt about emphasis: bigger Cal Sans before bolder Cal Sans.
8. Icons: always lucide-react — verify every icon exists in the library before using.

## Known Gaps

- Cal Sans is licensed and not available as a public web font; substitutes documented in Typography (Inter 600 / Manrope 700).
- Animation and transition timings (slot picker, confirmation) not in scope — keep to 150–200ms ease-out if needed.
- Form validation states beyond `{component.text-input-focused}` require explicit error styling (`{colors.error}` border + caption).
- The actual booking widget surface (`/{businessSlug}` and `/{businessSlug}/book`) is product UI, not marketing — its tokens inherit from this system but may need denser spacing.
