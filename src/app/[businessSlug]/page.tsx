import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Cormorant_Garamond } from "next/font/google";
import { db } from "@/lib/db";
import {
  ArrowRight,
  Clock,
  Globe,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Scissors,
  Star,
  Tag,
  Users,
} from "lucide-react";
import { VenueGallery } from "@/components/business/venue-gallery";
import { ServiceTabs } from "@/components/business/service-tabs";
import { BookingCard } from "@/components/business/booking-card";
import { taxonomyLabelKey, isBusinessTypeSlug } from "@/lib/categories";
import { getServerT } from "@/lib/i18n/server";

// Elegant serif for headings (falls back to Georgia if the font can't load).
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

// Always render fresh: admins edit this page's data and customers scan the QR
// code at any time of day (the "Open now" badge depends on the current time).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const t = await getServerT();
  const business = await db.business.findUnique({
    where: { slug: businessSlug },
    select: { name: true },
  });
  return {
    title: business ? `${business.name} | ADNAVRA BLISS` : "ADNAVRA BLISS",
    description: t("salon.meta.description"),
  };
}

/* ────────────────────────────── helpers ────────────────────────────── */

type HoursEntry = { open: string; close: string; closed?: boolean };
type HoursMap = Record<string, HoursEntry>;

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

// Salons on ADNAVRA are in Sri Lanka, so "today" and "now" are read in that
// timezone no matter where the server runs.
const VENUE_TIMEZONE = "Asia/Colombo";

const SERIF = "font-[family-name:var(--font-display)]";
const EYEBROW = "text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9A7B4F]";
const GOLD = "#D9BE8C";

// Initials for avatar fallback — uses name words, max 2 letters
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function sortedOpeningHours(raw: HoursMap): [string, HoursEntry][] {
  const entries = Object.entries(raw);
  entries.sort((a, b) => {
    const ia = DAY_ORDER.indexOf(a[0].toLowerCase() as (typeof DAY_ORDER)[number]);
    const ib = DAY_ORDER.indexOf(b[0].toLowerCase() as (typeof DAY_ORDER)[number]);
    if (ia === -1 && ib === -1) return a[0].localeCompare(b[0]);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  return entries;
}

function toMinutes(hm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function formatTime(hm: string): string {
  const mins = toMinutes(hm);
  if (mins === null) return hm;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function formatPrice(minor: number): string {
  return (minor / 100).toLocaleString("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 });
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

function localizeDay(day: string, t: (key: string) => string): string {
  const lower = day.toLowerCase();
  if ((DAY_KEYS as readonly string[]).includes(lower)) return t(`salon.day.${lower}`);
  return capitalize(day);
}

function venueNow(): { day: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: VENUE_TIMEZONE,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { day: get("weekday").toLowerCase(), minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

type OpenStatus = { day: string; isOpen: boolean; label: string; detail: string };

function getOpenStatus(hours: HoursMap, t: (key: string) => string): OpenStatus | null {
  const { day, minutes } = venueNow();
  const key = Object.keys(hours).find((k) => k.toLowerCase() === day);
  if (!key) return null;
  const today = hours[key];
  if (today.closed) return { day: key, isOpen: false, label: t("salon.hours.closedToday"), detail: "" };
  const open = toMinutes(today.open);
  const close = toMinutes(today.close);
  if (open === null || close === null) return null;
  if (minutes >= open && minutes < close) {
    return { day: key, isOpen: true, label: t("salon.hours.openNow"), detail: `${t("salon.hours.until")} ${formatTime(today.close)}` };
  }
  if (minutes < open) {
    return { day: key, isOpen: false, label: t("salon.hours.closed"), detail: `${t("salon.hours.opens")} ${formatTime(today.open)}` };
  }
  return { day: key, isOpen: false, label: t("salon.hours.closedForToday"), detail: "" };
}

// Merge consecutive days with identical hours: "Monday – Friday  09:00 AM – 07:00 PM"
function groupHours(hours: HoursMap, t: (key: string) => string): { label: string; value: string; days: string[] }[] {
  const groups: { value: string; days: string[] }[] = [];
  for (const [day, v] of sortedOpeningHours(hours)) {
    const value = v.closed ? t("salon.hours.closed") : `${formatTime(v.open)} – ${formatTime(v.close)}`;
    const last = groups[groups.length - 1];
    if (last && last.value === value) last.days.push(day);
    else groups.push({ value, days: [day] });
  }
  return groups.map((g) => ({
    ...g,
    label:
      g.days.length === 1
        ? localizeDay(g.days[0], t)
        : `${localizeDay(g.days[0], t)} – ${localizeDay(g.days[g.days.length - 1], t)}`,
  }));
}

// "Noeline's Hair & Beauty Studio" -> italic gold accent on the middle words.
function splitTitle(name: string): { before: string; accent: string; after: string } {
  const w = name.trim().split(/\s+/).filter(Boolean);
  if (w.length >= 3) return { before: w[0], accent: w.slice(1, -1).join(" "), after: w[w.length - 1] };
  if (w.length === 2) return { before: w[0], accent: w[1], after: "" };
  return { before: name, accent: "", after: "" };
}

/* ─────────────────────────── small UI pieces ─────────────────────────── */

// Content wrapper: fills the full screen width, side padding only (no max-width cap).
const WRAP = "w-full px-4 sm:px-6 lg:px-12";

const CARD = "rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_1px_3px_rgba(30,28,26,0.04)]";

function SectionHeader({
  id,
  eyebrow,
  title,
  right,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div id={id} className="flex scroll-mt-24 flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div>
        <p className={EYEBROW}>{eyebrow}</p>
        <h2 className={`${SERIF} mt-1 text-3xl font-medium leading-tight text-[#1F1B17] sm:text-4xl`}>{title}</h2>
      </div>
      {right}
    </div>
  );
}

/* ─────────────────────────────── page ─────────────────────────────── */

export default async function BusinessProfilePage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const t = await getServerT();
  const { businessSlug } = await params;
  const business = await db.business.findUnique({
    where: { slug: businessSlug },
    include: {
      services: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      staffMembers: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      images: { orderBy: [{ kind: "asc" }, { position: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!business) notFound();

  const cover = business.images.find((img) => img.kind === "cover") ?? null;
  const gallery = business.images.filter((img) => img.kind === "gallery");
  // Hero uses the cover photo (or the first gallery photo if there is no cover).
  const heroUrl = cover?.url ?? gallery[0]?.url ?? null;
  const galleryPhotos = gallery.map((img) => ({ id: img.id, url: img.url, kind: img.kind }));

  const hoursMap: HoursMap | null =
    business.openingHours !== null &&
    typeof business.openingHours === "object" &&
    !Array.isArray(business.openingHours) &&
    Object.keys(business.openingHours as Record<string, unknown>).length > 0
      ? (business.openingHours as HoursMap)
      : null;
  const status = hoursMap ? getOpenStatus(hoursMap, t) : null;

  const hasContact = Boolean(business.phone || business.email || business.website);

  const lat = typeof business.latitude === "number" ? business.latitude : null;
  const lng = typeof business.longitude === "number" ? business.longitude : null;
  const hasCoords = lat !== null && lng !== null;
  const mapEmbed = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02}%2C${lat - 0.02}%2C${lng + 0.02}%2C${lat + 0.02}&layer=mapnik&marker=${lat}%2C${lng}`
    : null;
  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : business.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          [business.address, business.city].filter(Boolean).join(", "),
        )}`
      : null;
  const hasLocation = Boolean(mapEmbed || hasContact || business.address || business.directions);

  // Prefer the dedicated salonTypes column; fall back to legacy rows where
  // type slugs still sit inside categories.
  const salonTypes = Array.isArray((business as unknown as Record<string, unknown>).salonTypes)
    ? ((business as unknown as Record<string, unknown>).salonTypes as string[])
    : business.categories.filter((c) => isBusinessTypeSlug(c));

  const locationLine = [business.city, business.district].filter(Boolean).join(", ") || business.address;
  const fullAddress = [business.address, business.city, business.district].filter(Boolean).join(", ");
  const websiteHref = business.website
    ? business.website.startsWith("http")
      ? business.website
      : `https://${business.website}`
    : null;

  const services = business.services;
  const lowestPrice = services.length > 0 ? Math.min(...services.map((s) => s.price)) : null;
  const categoryCount = new Set(services.map((s) => s.category).filter(Boolean)).size;
  const bookHref = `/${business.slug}/book`;
  const title = splitTitle(business.name);

  // Hero stats — only facts we really have, never placeholders.
  const stats: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (lowestPrice !== null) {
    stats.push({ icon: <Tag className="h-4 w-4" />, label: t("salon.stat.from"), value: formatPrice(lowestPrice) });
  }
  if (services.length > 0) {
    stats.push({
      icon: <Scissors className="h-4 w-4" />,
      label: t("salon.stat.treatments"),
      value:
        categoryCount > 1
          ? `${services.length} · ${categoryCount} ${t("salon.stat.categories")}`
          : `${services.length} ${services.length === 1 ? t("salon.stat.service") : t("salon.stat.services")}`,
    });
  }
  if (status) {
    stats.push({
      icon: <Clock className="h-4 w-4" />,
      label: t("salon.stat.today"),
      value: status.isOpen ? `${t("salon.hours.open")} ${status.detail}` : status.detail ? `${status.label}, ${status.detail}` : status.label,
    });
  } else if (business.staffMembers.length > 0) {
    stats.push({
      icon: <Users className="h-4 w-4" />,
      label: t("salon.stat.team"),
      value: `${business.staffMembers.length} ${business.staffMembers.length === 1 ? t("salon.stat.specialist") : t("salon.stat.specialists")}`,
    });
  }

  const navLinks = [
    { href: "#services", label: t("salon.nav.services"), show: true },
    { href: "#atmosphere", label: t("salon.nav.atmosphere"), show: galleryPhotos.length > 0 },
    { href: "#specialists", label: t("salon.nav.specialists"), show: true },
    { href: "#hours-side", label: t("salon.nav.hours"), show: true },
    { href: "#location", label: t("salon.nav.location"), show: hasLocation },
  ].filter((l) => l.show);

  // Opening hours card — always rendered (with an empty state) so customers
  // can always find it. Today's group is highlighted.
  const hoursCard = (
    <div className={`${CARD} p-6`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={EYEBROW}>{t("salon.hours.schedule")}</p>
          <h3 className={`${SERIF} mt-1 text-2xl font-medium text-[#1F1B17]`}>{t("salon.hours.title")}</h3>
        </div>
        {status && (
          <span
            className={`mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${
              status.isOpen ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.isOpen ? "bg-emerald-500" : "bg-rose-500"}`} />
            {status.isOpen ? t("salon.hours.openNow") : t("salon.hours.closed")}
          </span>
        )}
      </div>
      {hoursMap ? (
        <div className="mt-4 divide-y divide-[#F1EBDF]">
          {groupHours(hoursMap, t).map((g) => {
            const isToday = status ? g.days.includes(status.day) : false;
            return (
              <div
                key={g.label}
                className={`flex items-center justify-between gap-3 py-2.5 text-[13px] ${
                  isToday ? "font-semibold text-[#1F1B17]" : "text-[#5A544B]"
                }`}
              >
                <span className="flex items-center gap-2">
                  {g.label}
                  {isToday && (
                    <span className="rounded-full bg-[#F3EEE4] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#795831]">
                      {t("salon.hours.today")}
                    </span>
                  )}
                </span>
                <span className={g.value === t("salon.hours.closed") ? "text-[#9A9184]" : ""}>{g.value}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-[#F7F3ED] p-4 text-sm text-[#8A8377]">
          {t("salon.hours.empty")}
        </p>
      )}
    </div>
  );

  return (
    <main className={`${display.variable} min-h-screen bg-[#FAF7F2] pb-24 lg:pb-0`}>
      {/* ── Top nav: ADNAVRA BLISS brand ── */}
      <nav className="sticky top-0 z-40 border-b border-[#E9E1D3] bg-white/90 backdrop-blur">
        <div className={`${WRAP} flex h-16 items-center justify-between gap-3`}>
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={t("salon.aria.home")}>
            <Image src="/logo.png" alt="ADNAVRA BLISS logo" width={28} height={28} className="h-7 w-7 rounded-md object-contain" />
            <span className="text-lg font-semibold tracking-tight text-[#1F1E1D]">
              ADNAVRA <span className="font-normal text-[#795831]">BLISS</span>
            </span>
          </Link>

          <div className="hidden items-center gap-0.5 md:flex" aria-label={t("salon.nav.sections")}>
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-3 py-2 text-[13px] font-medium text-[#4A4640] transition-colors hover:bg-[#F1E9DC] hover:text-[#1F1E1D]"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-4">
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="hidden items-center gap-1.5 text-[13px] font-medium text-[#4A4640] hover:text-[#1F1E1D] xl:inline-flex"
              >
                <Phone className="h-3.5 w-3.5 text-[#9A7B4F]" /> {business.phone}
              </a>
            )}
            <Link href={bookHref}>
              <span className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1F1B17] px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#795831]">
                {t("salon.cta.bookExperience")} <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="relative isolate overflow-hidden bg-[#1B1714]">
        <style>{`
          @keyframes heroKenBurns {
            0% { transform: scale(1); }
            100% { transform: scale(1.1); }
          }
          @keyframes heroFadeUp {
            0% { opacity: 0; transform: translateY(14px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        {heroUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUrl}
            alt=""
            className="absolute inset-0 -z-20 h-full w-full object-cover"
            style={{ animation: "heroKenBurns 22s ease-in-out infinite alternate" }}
          />
        )}
        <div
          className={`absolute inset-0 -z-10 ${
            heroUrl
              ? "bg-gradient-to-t from-[#1B1714] via-[#1B1714]/60 to-[#1B1714]/30"
              : "bg-gradient-to-br from-[#3A2F22] via-[#2A211A] to-[#1B1714]"
          }`}
        />
        {heroUrl && <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1B1714]/90 via-[#1B1714]/30 to-transparent" />}

        <div
          className={`${WRAP} flex min-h-[520px] flex-col justify-end py-14 sm:min-h-[600px] lg:min-h-[680px] lg:py-20`}
          style={{ animation: "heroFadeUp 0.9s ease-out both" }}
        >
          <div className="flex flex-wrap items-center gap-2">
            {business.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.logoUrl}
                alt={`${business.name} logo`}
                className="mr-2 h-12 w-12 rounded-full border-2 shadow-lg object-cover"
                style={{ borderColor: GOLD }}
              />
            )}
            {business.marketplacePriority && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#D9BE8C]/50 bg-[#D9BE8C]/15 px-3 py-1 text-[11px] font-medium text-[#EBD5A7]">
                <Star className="h-3 w-3 fill-current" /> {t("salon.badge.featured")}
              </span>
            )}
            {salonTypes.slice(0, 4).map((c) => (
              <span
                key={c}
                className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur"
              >
                {t(taxonomyLabelKey(c))}
              </span>
            ))}
            {locationLine && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
                <MapPin className="h-3 w-3" /> {locationLine}
              </span>
            )}
          </div>

          {salonTypes[0] && (
            <p
              className="mt-6 text-[11px] font-bold uppercase tracking-[0.35em]"
              style={{ color: GOLD }}
            >
              {t(taxonomyLabelKey(salonTypes[0]))} · {locationLine || "Sri Lanka"}
            </p>
          )}

          <h1
            className={`${SERIF} mt-3 max-w-4xl text-5xl font-medium leading-[0.98] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.4)] sm:text-6xl lg:text-7xl`}
          >
            {title.before}
            {title.accent && (
              <>
                {" "}
                <em className="font-normal italic" style={{ color: GOLD }}>
                  {title.accent}
                </em>
              </>
            )}
            {title.after && <> {title.after}</>}
          </h1>

          {business.description && (
            <p className="mt-5 line-clamp-1 max-w-xl text-lg font-medium leading-snug text-white/90 sm:text-xl">
              {business.description.split(/(?<=[.!?])\s/)[0]}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={bookHref}>
              <span
                className="inline-flex h-14 items-center gap-2 rounded-full px-7 text-[12px] font-bold uppercase tracking-[0.16em] text-[#1B1714] shadow-[0_8px_30px_rgba(217,190,140,0.35)] transition-transform hover:scale-[1.03]"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #C9A467)` }}
              >
                {t("salon.cta.bookNow")} <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
            <a href="#services">
              <span className="inline-flex h-14 items-center rounded-full border border-white/30 bg-white/5 px-6 text-[12px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur transition-colors hover:bg-white/15">
                {t("salon.cta.viewServices")}
              </span>
            </a>
          </div>

          {stats.length > 0 && (
            <div className="mt-10 grid gap-6 border-t border-white/15 pt-7 sm:grid-cols-3">
              {stats.map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#1B1714]"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, #C9A467)` }}
                  >
                    {f.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/50">{f.label}</p>
                    <p className={`${SERIF} truncate text-xl font-semibold text-white`}>{f.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scroll cue */}
        <div className="pointer-events-none absolute inset-x-0 bottom-5 hidden justify-center sm:flex">
          <span className="flex h-9 w-9 animate-bounce items-center justify-center rounded-full border border-white/25 text-white/60">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </span>
        </div>
      </header>

      <div className={`${WRAP} grid gap-8 py-8 lg:grid-cols-[1fr_380px] lg:gap-10 lg:py-12 xl:grid-cols-[1fr_400px]`}>
        {/* ── Main column ── */}
        <div className="min-w-0 space-y-12">
          {/* Services & pricing */}
          <section id="services" aria-label={t("salon.nav.services")} className="scroll-mt-24">
            <ServiceTabs
              businessSlug={business.slug}
              services={services.map((s) => ({
                id: s.id,
                name: s.name,
                description: s.description,
                price: s.price,
                duration: s.duration,
                category: s.category,
                imageUrl: s.imageUrl,
              }))}
            />
          </section>

          {/* Opening hours (phones) — up high because most QR scans happen on mobile */}
          <div id="hours" className="scroll-mt-24 md:hidden">
            {hoursCard}
          </div>

          {/* The Space (only when the venue has gallery photos) */}
          {galleryPhotos.length > 0 && (
            <section aria-label={t("salon.aria.gallery")}>
              <SectionHeader
                id="atmosphere"
                eyebrow={t("salon.nav.atmosphere")}
                title={t("salon.space.title")}
                right={
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A9184]">
                    {galleryPhotos.length} {galleryPhotos.length === 1 ? t("salon.space.photo") : t("salon.space.photos")}
                  </span>
                }
              />
              <div className="mt-5">
                <VenueGallery photos={galleryPhotos} venueName={business.name} />
              </div>
            </section>
          )}

          {/* Team — honest generic role label (no invented titles) */}
          <section aria-label={t("salon.aria.team")}>
            <SectionHeader id="specialists" eyebrow={t("salon.team.eyebrow")} title={t("salon.team.title")} />
            {business.staffMembers.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-[#D9CFBE] bg-white p-8 text-center">
                <p className="text-sm text-[#8A8377]">{t("salon.team.empty")}</p>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {business.staffMembers.map((m) => (
                  <div key={m.id} className={`${CARD} flex items-center gap-4 p-4`}>
                    <div
                      className={`${SERIF} flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#E4D6BF] bg-[#F7F1E4] text-xl font-semibold text-[#795831]`}
                    >
                      {initials(m.name)}
                    </div>
                    <div className="min-w-0">
                      <p className={`${SERIF} truncate text-xl font-medium leading-tight text-[#1F1B17]`}>{m.name}</p>
                      <p className="mt-0.5 text-xs text-[#8A8377]">{t("salon.team.member")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Reviews — honest empty state (no fake ratings) */}
          <section aria-label={t("salon.aria.reviews")}>
            <SectionHeader id="reviews" eyebrow={t("salon.reviews.eyebrow")} title={t("salon.reviews.title")} />
            <div className={`${CARD} mt-5 p-8 text-center`}>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F3ED]">
                <Star className="h-5 w-5 text-[#C9B99C]" />
              </div>
              <p className="mt-3 text-sm font-semibold text-[#1F1E1D]">{t("salon.reviews.emptyTitle")}</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-[#8A8377]">
                {t("salon.reviews.emptySub")}
              </p>
            </div>
          </section>
        </div>

        {/* ── Sidebar ── */}
        <aside className="min-w-0 space-y-5 lg:self-start">
          <BookingCard
            businessSlug={business.slug}
            phone={business.phone}
            services={services.map((s) => ({ id: s.id, name: s.name, price: s.price, duration: s.duration }))}
          />

          {/* Location + contact */}
          {hasLocation && (
            <div id="location" className={`${CARD} scroll-mt-24 p-6`}>
              <p className={EYEBROW}>{t("salon.location.eyebrow")}</p>
              <h3 className={`${SERIF} mt-1 text-2xl font-medium text-[#1F1B17]`}>{t("salon.location.title")}</h3>
              {mapEmbed && (
                <iframe
                  title={`${business.name} — ${t("salon.map.suffix")}`}
                  src={mapEmbed}
                  loading="lazy"
                  className="mt-4 h-72 w-full rounded-xl border border-[#E9E1D3] sm:h-80"
                />
              )}
              <ul className="mt-4 space-y-3 text-[13px]">
                {fullAddress && (
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#9A7B4F]" />
                    <span className="text-[#4A4640]">{fullAddress}</span>
                  </li>
                )}
                {business.phone && (
                  <li className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#9A7B4F]" />
                    <a href={`tel:${business.phone}`} className="font-medium text-[#4A4640] hover:text-[#795831] hover:underline">
                      {business.phone}
                    </a>
                  </li>
                )}
                {business.email && (
                  <li className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#9A7B4F]" />
                    <a href={`mailto:${business.email}`} className="break-all text-[#4A4640] hover:text-[#795831] hover:underline">
                      {business.email}
                    </a>
                  </li>
                )}
                {websiteHref && (
                  <li className="flex items-start gap-3">
                    <Globe className="mt-0.5 h-4 w-4 shrink-0 text-[#9A7B4F]" />
                    <a
                      href={websiteHref}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-[#4A4640] hover:text-[#795831] hover:underline"
                    >
                      {business.website}
                    </a>
                  </li>
                )}
              </ul>
              {business.directions && (
                <p className="mt-4 whitespace-pre-wrap rounded-xl bg-[#F7F3ED] p-3.5 text-xs leading-relaxed text-[#6B655B]">
                  {business.directions}
                </p>
              )}
              {directionsUrl && (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#E2D9C8] text-[11px] font-bold uppercase tracking-[0.14em] text-[#1F1B17] transition hover:bg-[#F7F3ED]"
                >
                  <Navigation className="h-3.5 w-3.5 text-[#9A7B4F]" /> {t("salon.directions.cta")}
                </a>
              )}
            </div>
          )}

          {/* Opening hours (desktop / tablet) */}
          <div id="hours-side" className="hidden scroll-mt-24 md:block">
            {hoursCard}
          </div>
        </aside>
      </div>

      {/* ── Sticky mobile action bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-[#E9E1D3] bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        {business.phone && (
          <a
            href={`tel:${business.phone}`}
            aria-label={`${t("salon.aria.call")} ${business.name}`}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#E9E1D3] bg-white text-[#795831]"
          >
            <Phone className="h-5 w-5" />
          </a>
        )}
        <Link href={bookHref} className="flex-1">
          <span className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1F1B17] px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#795831]">
            {t("salon.cta.bookAppointment")} <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-[#1B1714] text-[#C9C1B4]">
        <div className={`${WRAP} grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]`}>
          <div>
            <div className="flex items-center gap-3">
              {business.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={business.logoUrl}
                  alt=""
                  className="h-10 w-10 rounded-full border border-white/25 bg-white object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 text-[#D9BE8C]">
                  <Scissors className="h-4 w-4" />
                </span>
              )}
              <span className={`${SERIF} text-xl font-medium uppercase tracking-[0.12em] text-white`}>{business.name}</span>
            </div>
            {business.description && (
              <p className="mt-4 line-clamp-3 max-w-sm text-[13px] leading-relaxed text-[#A69E90]">{business.description}</p>
            )}
          </div>

          {services.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">{t("salon.footer.services")}</p>
              <ul className="mt-4 space-y-2.5 text-[13px]">
                {services.slice(0, 4).map((s) => (
                  <li key={s.id}>
                    <Link href={`/${business.slug}/book?serviceId=${s.id}`} className="transition-colors hover:text-white">
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(fullAddress || business.phone || business.email) && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/50">{t("salon.footer.visit")}</p>
              <ul className="mt-4 space-y-2.5 text-[13px]">
                {fullAddress && <li>{fullAddress}</li>}
                {business.phone && (
                  <li>
                    {t("salon.footer.hotline")}{" "}
                    <a href={`tel:${business.phone}`} className="text-white hover:underline">
                      {business.phone}
                    </a>
                  </li>
                )}
                {business.email && (
                  <li>
                    {t("salon.footer.email")}{" "}
                    <a href={`mailto:${business.email}`} className="break-all text-white hover:underline">
                      {business.email}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-white/10">
          <div className={`${WRAP} flex flex-col justify-between gap-2 py-5 text-xs text-[#8F877A] sm:flex-row sm:items-center`}>
            <span>
              © {new Date().getFullYear()} {business.name}. {t("salon.footer.rights")}
            </span>
            <Link href="/" className="inline-flex items-center gap-2 transition-colors hover:text-white">
              {t("salon.footer.poweredBy")}
              <Image src="/logo.png" alt="" width={16} height={16} className="h-4 w-4 rounded object-contain" />
              <span className="font-semibold text-white">
                ADNAVRA <span className="font-normal text-[#D9BE8C]">BLISS</span>
              </span>
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
