import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Cormorant_Garamond } from "next/font/google";
import { MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { getServerT } from "@/lib/i18n/server";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { BackButton } from "@/components/business/back-button";
import { AdSlot } from "@/components/marketplace/ad-slot";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const t = await getServerT();
  const venue = await db.business.findUnique({
    where: { slug: businessSlug },
    select: { name: true },
  });
  return {
    title: venue ? `${venue.name} | ADNAVRA BLISS` : "ADNAVRA BLISS",
    description: t("book.meta.description"),
  };
}

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ serviceId?: string; staffId?: string; date?: string; slot?: string }>;
}) {
  const { businessSlug } = await params;
  const t = await getServerT();
  const { serviceId, staffId, date, slot } = await searchParams;

  const venue = await db.business.findUnique({
    where: { slug: businessSlug },
    select: {
      name: true,
      city: true,
      district: true,
      images: { where: { kind: "cover" }, take: 1, select: { url: true } },
    },
  });
  if (!venue) notFound();
  const coverUrl = venue.images[0]?.url ?? null;
  const locationLine = [venue.city, venue.district].filter(Boolean).join(", ");

  // Phase 4: guest-friendly booking — no login redirect. Name + contact are
  // collected in the wizard's "Your details" step instead.

  return (
    <main className={`${display.variable} min-h-screen bg-[#FAF7F2]`}>
      {/* Nav + hero sit in normal document flow so they scroll away with the page —
          nothing is pinned to the viewport here. */}
      <nav className="relative z-40 flex h-16 items-center justify-between border-b border-[#E9E1D3] bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-2" aria-label={t("book.aria.home")}>
          <Image src="/logo.png" alt="ADNAVRA BLISS" width={28} height={28} className="h-7 w-7 shrink-0 rounded-md object-contain" />
          <span className="text-base font-semibold tracking-tight text-[#1F1E1D] sm:text-lg">
            ADNAVRA <span className="font-normal text-[#795831]">BLISS</span>
          </span>
        </Link>
        <BackButton fallbackHref={`/${businessSlug}`} />
      </nav>

      <div className="relative z-30 isolate flex h-36 items-end overflow-hidden bg-[#1B1714]">
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        )}
        <div
          className={`absolute inset-0 -z-10 ${
            coverUrl ? "bg-gradient-to-t from-[#1B1714] via-[#1B1714]/75 to-[#1B1714]/45" : "bg-gradient-to-br from-[#3A2F22] via-[#2A211A] to-[#1B1714]"
          }`}
        />
        <div className="flex w-full flex-col gap-0.5 px-4 py-5 sm:px-6 lg:px-12">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "#D9BE8C" }}>
            {t("book.eyebrow")}
          </p>
          <h1 className={`${display.variable} font-[family-name:var(--font-display)] text-2xl font-medium leading-tight text-white sm:text-3xl lg:text-4xl`}>
            {venue.name}
          </h1>
          {locationLine && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/70 sm:text-sm">
              <MapPin className="h-3.5 w-3.5" /> {locationLine}
            </p>
          )}
        </div>
      </div>

      <div
        className="relative"
        style={{ backgroundImage: "radial-gradient(circle at 15% 0%, rgba(217,190,140,0.10), transparent 45%)" }}
      >
        <div className="w-full px-4 pb-8 sm:px-6 sm:pb-10 lg:px-12 lg:pb-14">
          <AdSlot placement="booking_page" className="mb-4" />
          <BookingWizard
            businessSlug={businessSlug}
            initialServiceId={serviceId}
            initialStaffId={staffId}
            initialDate={date}
            initialSlotStart={slot}
          />
        </div>
      </div>
    </main>
  );
}
