import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Cormorant_Garamond } from "next/font/google";
import { ArrowLeft, MapPin } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookingWizard } from "@/components/booking/BookingWizard";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ serviceId?: string; staffId?: string; date?: string; slot?: string }>;
}) {
  const { businessSlug } = await params;
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

  const session = await auth();
  const role = (session?.user as unknown as { role: string } | undefined)?.role ?? null;

  // Require a logged-in CUSTOMER before booking.
  // Owners/staff/admin must still create a real customer account; never reuse staff session as customer.
  if (!session?.user || role !== "CUSTOMER") {
    const qs = new URLSearchParams();
    if (serviceId) qs.set("serviceId", serviceId);
    if (staffId) qs.set("staffId", staffId);
    if (date) qs.set("date", date);
    if (slot) qs.set("slot", slot);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    const cb = `/${businessSlug}/book${suffix}`;
    redirect(`/customer/login?callbackUrl=${encodeURIComponent(cb)}`);
  }

  return (
    <main className={`${display.variable} min-h-screen bg-[#FAF7F2]`}>
      {/* Nav + hero are truly `fixed` to the viewport — not `sticky` — so they cannot drift,
          jump, or unstick under any circumstance regardless of scroll position or page length.
          A matching spacer immediately below reserves their combined height (64px + 144px = 208px)
          in normal document flow so real content never renders underneath them. */}
      <nav className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-[#E9E1D3] bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-2" aria-label="ADNAVRA BLISS home">
          <Image src="/logo.png" alt="ADNAVRA BLISS" width={28} height={28} className="h-7 w-7 shrink-0 rounded-md object-contain" />
          <span className="text-base font-semibold tracking-tight text-[#1F1E1D] sm:text-lg">
            ADNAVRA <span className="font-normal text-[#795831]">BLISS</span>
          </span>
        </Link>
        <Link
          href={`/${businessSlug}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E9E1D3] px-3 py-1.5 text-[13px] font-medium text-[#4A4640] transition-colors hover:bg-[#F7F3ED] hover:text-[#1F1E1D]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Back to venue</span>
        </Link>
      </nav>

      <div className="fixed inset-x-0 top-16 z-30 isolate flex h-36 items-end overflow-hidden bg-[#1B1714]">
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
            Reserve your visit
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
      {/* Spacer: reserves the exact 208px (nav 64px + hero 144px) the two fixed bands above occupy. */}
      <div className="h-52" aria-hidden="true" />

      <div
        className="relative"
        style={{ backgroundImage: "radial-gradient(circle at 15% 0%, rgba(217,190,140,0.10), transparent 45%)" }}
      >
        <div className="w-full px-4 pb-8 sm:px-6 sm:pb-10 lg:px-12 lg:pb-14">
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
