import Link from "next/link";
import { Clock, MapPin, Navigation, Store, CalendarCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AddToCalendarButton } from "@/components/customer/account/add-to-calendar";

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

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-[#FDECD8] text-[#B45309] border-[#FDECD8]",
    CONFIRMED: "bg-[#DCF5E7] text-[#15803D] border-[#DCF5E7]",
    CANCELLED: "bg-[#FDECEC] text-[#B91C1C] border-[#FDECEC]",
    COMPLETED: "bg-[#f0e6d6] text-[#8a6d4f] border-[#f0e6d6]",
    NO_SHOW: "bg-[#E7ECF2] text-[#475467] border-[#E7ECF2]",
  };
  return map[status] ?? "bg-[#E7ECF2] text-[#475467] border-[#E7ECF2]";
}

export default async function ActivityPage() {
  const session = await auth();
  const userId = (session?.user as unknown as { id: string }).id;
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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[#3a2f22]">Activity</h1>
        <p className="mt-1 text-sm text-[#a89880]">Your appointments across every salon you have booked with.</p>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E3E8F0] bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF4FA] border border-[#E3E8F0]">
            <CalendarCheck className="h-6 w-6 text-[#8a6d4f]" />
          </div>
          <p className="mt-4 text-sm font-semibold text-[#3a2f22]">No appointments yet</p>
          <p className="mt-1 text-sm text-[#a89880] max-w-md mx-auto">
            When you book a service at any salon on ADNAVRA, it will appear here.
          </p>
          <Link href="/customer/search" className="mt-5 inline-flex rounded-md bg-[#8a6d4f] px-5 py-2 text-sm font-semibold text-white hover:bg-[#5f4630]">
            Discover salons
          </Link>
        </div>
      ) : (
        <>
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#8a6d4f]">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-[#a89880]">No upcoming appointments.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {upcoming.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#a89880]">Past</h2>
            {past.length === 0 ? (
              <p className="mt-3 text-sm text-[#a89880]">No past appointments.</p>
            ) : (
              <div className="mt-3 space-y-3">
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
    <div className="rounded-xl border border-[#E3E8F0] bg-white p-5 flex gap-4">
      <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF4FA] border border-[#E3E8F0] shrink-0">
        {b.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.logoUrl} alt={b.name} className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <Store className="h-5 w-5 text-[#8a6d4f]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <Link href={`/${b.slug}`} className="text-sm font-semibold text-[#3a2f22] hover:text-[#8a6d4f] hover:underline">
              {b.name}
            </Link>
            <p className="text-xs text-[#a89880] flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" /> {b.city ?? b.address ?? "Salon"}
            </p>
          </div>
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusBadge(booking.status)}`}>
            {booking.status}
          </span>
        </div>

        <div className="mt-3 rounded-lg bg-[#faf6ef] border border-[#EEF2F7] px-3 py-2.5 space-y-1">
          <p className="text-sm font-medium text-[#3a2f22] flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-[#8a6d4f]" /> {formatDateTime(booking.startTime)}
          </p>
          <p className="text-xs text-[#475467]">
            {booking.service.name} · {booking.service.duration} min
            {booking.staffMember ? ` · with ${booking.staffMember.name}` : " · Any professional"}
          </p>
          <p className="text-xs text-[#a89880]">Ref: {booking.reference}</p>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
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
              className="inline-flex items-center gap-1.5 rounded-md border border-[#E3E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#3a2f22] hover:bg-[#EFF4FA]"
            >
              <Navigation className="h-3.5 w-3.5 text-[#8a6d4f]" /> Get directions
            </a>
          )}
          <Link
            href={`/${b.slug}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#E3E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#3a2f22] hover:bg-[#EFF4FA]"
          >
            View venue
          </Link>
        </div>
      </div>
    </div>
  );
}
