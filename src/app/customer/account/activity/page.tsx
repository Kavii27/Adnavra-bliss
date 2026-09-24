import Link from "next/link";
import { Clock, MapPin, Navigation, CalendarCheck, ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AddToCalendarButton } from "@/components/customer/account/add-to-calendar";
import { SalonAvatar } from "@/components/customer/account/salon-avatar";

const SERIF = "font-[family-name:var(--font-display)]";
const GOLD = "#D9BE8C";

function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function formatPrice(minor: number): string {
  return (minor / 100).toLocaleString("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 });
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-[#FDECD8] text-[#B45309]",
    CONFIRMED: "bg-[#DCF5E7] text-[#15803D]",
    CANCELLED: "bg-[#FDECEC] text-[#B91C1C]",
    COMPLETED: "bg-[#F3EEE4] text-[#795831]",
    NO_SHOW: "bg-[#E7ECF2] text-[#475467]",
  };
  return map[status] ?? "bg-[#E7ECF2] text-[#475467]";
}

export default async function ActivityPage() {
  const session = await auth();
  const userId = (session?.user as unknown as { id: string } | undefined)?.id;
  if (!userId) return null;

  const bookings = await db.booking.findMany({
    where: { customer: { userId } },
    orderBy: { startTime: "desc" },
    include: { service: true, business: true, staffMember: true },
  });

  const now = new Date();
  const upcoming = bookings.filter((b) => b.startTime >= now && b.status !== "CANCELLED");
  const past = bookings.filter((b) => b.startTime < now || b.status === "CANCELLED");

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#9A7B4F" }}>
          Your bookings
        </p>
        <h1 className={`${SERIF} mt-1 text-3xl font-medium tracking-tight text-[#1F1B17]`}>Activity</h1>
        <p className="mt-1.5 text-sm text-[#8A8377]">Your appointments across every salon you have booked with.</p>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5DDD0] bg-white p-12 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #C9A467)` }}
          >
            <CalendarCheck className="h-6 w-6 text-[#1B1714]" />
          </div>
          <p className={`${SERIF} mt-5 text-xl font-semibold text-[#1F1B17]`}>No appointments yet</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-[#8A8377]">
            When you book a service at any salon on ADNAVRA BLISS, it will appear here.
          </p>
          <Link
            href="/customer/search"
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#1F1B17] px-7 text-[12px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_4px_14px_rgba(30,28,26,0.25)] transition-all hover:scale-[1.02] hover:bg-[#795831]"
          >
            Discover salons <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <>
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "#9A7B4F" }}>
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-[#8A8377]">No upcoming appointments.</p>
            ) : (
              <div className="mt-3 space-y-4">
                {upcoming.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B4AC9E]">Past</h2>
            {past.length === 0 ? (
              <p className="mt-3 text-sm text-[#8A8377]">No past appointments.</p>
            ) : (
              <div className="mt-3 space-y-4">
                {past.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function BookingCard({
  booking,
}: {
  booking: {
    id: string;
    reference: string;
    startTime: Date;
    endTime: Date;
    status: string;
    notes: string | null;
    service: { name: string; price: number; duration: number };
    business: { name: string; slug: string; address: string | null; city: string | null; logoUrl: string | null; latitude: number | null; longitude: number | null };
    staffMember: { name: string } | null;
  };
}) {
  const b = booking.business;
  const hasCoords = typeof b.latitude === "number" && typeof b.longitude === "number";
  const locationLabel = [b.address, b.city].filter(Boolean).join(", ") || b.name;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_6px_24px_rgba(120,88,49,0.08)] transition-shadow hover:shadow-[0_10px_32px_rgba(120,88,49,0.14)]">
      <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #C9A467, #8A6D4F)" }} />
      <div className="flex items-center gap-4 p-6 pb-4">
        <SalonAvatar name={b.name} logoUrl={b.logoUrl} className="h-16 w-16" iconClassName="h-6 w-6" />
        <div className="min-w-0 flex-1">
          <Link href={`/${b.slug}`} className={`${SERIF} block truncate text-xl font-semibold leading-tight text-[#1F1B17] hover:text-[#795831]`}>
            {b.name}
          </Link>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-[#8A8377]">
            <MapPin className="h-3 w-3" /> {b.city ?? b.address ?? "Salon"}
          </p>
        </div>
        <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${statusBadge(booking.status)}`}>
          {booking.status}
        </span>
      </div>

      <div className="mx-6 flex items-start justify-between gap-4 rounded-xl border border-[#F1EDE7] bg-[#FBF7EF] px-5 py-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#1F1B17]">
            <Clock className="h-4 w-4 shrink-0 text-[#9A7B4F]" /> {formatDateTime(booking.startTime)}
          </p>
          <p className="mt-1.5 text-xs text-[#4A4640]">
            {booking.service.name} · {booking.service.duration} min
            {booking.staffMember ? ` · with ${booking.staffMember.name}` : " · Any professional"}
          </p>
          <p className="mt-1 text-xs text-[#8A8377]">Ref: {booking.reference}</p>
        </div>
        <span className={`${SERIF} shrink-0 text-lg font-semibold text-[#1F1B17]`}>{formatPrice(booking.service.price)}</span>
      </div>

      <div className="flex flex-wrap gap-2 p-6 pt-4">
        <AddToCalendarButton
          title={`${booking.service.name} at ${b.name}`}
          description={`Booking ${booking.reference} — ${booking.service.name}`}
          location={locationLabel}
          startTime={booking.startTime.toISOString()}
          endTime={booking.endTime.toISOString()}
        />
        {hasCoords && (
          <a
            href={`https://www.openstreetmap.org/?mlat=${b.latitude}&mlon=${b.longitude}#map=16/${b.latitude}/${b.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DDD0] bg-white px-4 py-2 text-xs font-semibold text-[#1F1E1D] transition-colors hover:bg-[#FBF7EF]"
          >
            <Navigation className="h-3.5 w-3.5 text-[#9A7B4F]" /> Get directions
          </a>
        )}
        <Link
          href={`/${b.slug}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DDD0] bg-white px-4 py-2 text-xs font-semibold text-[#1F1E1D] transition-colors hover:bg-[#FBF7EF]"
        >
          View venue
        </Link>
      </div>
    </div>
  );
}
