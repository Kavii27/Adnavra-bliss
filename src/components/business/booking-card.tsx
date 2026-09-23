"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck, ChevronDown, Phone } from "lucide-react";

type BookableService = { id: string; name: string; price: number; duration: number };

function formatPrice(minor: number): string {
  return (minor / 100).toLocaleString("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 });
}

const SERIF = { fontFamily: "var(--font-display, Georgia, 'Times New Roman', serif)" } as const;

// Dark "Ready to book?" card. Picks a treatment (+ optional date) and deep-links
// into the existing booking wizard via ?serviceId=…&date=… (wizard logic untouched).
export function BookingCard({
  businessSlug,
  phone,
  services,
}: {
  businessSlug: string;
  phone: string | null;
  services: BookableService[];
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [today, setToday] = useState("");

  // Sri Lanka "today" (client-side, so the server never bakes in a stale date).
  useEffect(() => {
    setToday(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" }));
  }, []);

  const lowest = useMemo(() => (services.length ? Math.min(...services.map((s) => s.price)) : null), [services]);

  const href = useMemo(() => {
    const qs = new URLSearchParams();
    if (serviceId) qs.set("serviceId", serviceId);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) qs.set("date", date);
    const q = qs.toString();
    return `/${businessSlug}/book${q ? `?${q}` : ""}`;
  }, [businessSlug, serviceId, date]);

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#38312B] to-[#1F1B17] p-6 text-white shadow-[0_12px_32px_rgba(30,28,26,0.22)]">
      <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#D9BE8C]">
        Book online
      </span>
      <h2 className="mt-3 text-3xl font-medium leading-tight" style={SERIF}>
        Ready to book?
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">
        Choose a treatment and a date, then pick your specialist and time.
      </p>

      {lowest !== null && (
        <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <span className="text-xs text-white/70">Services from</span>
          <span className="text-lg font-medium text-[#D9BE8C]" style={SERIF}>
            {formatPrice(lowest)}
          </span>
        </div>
      )}

      {services.length > 0 && (
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="bc-service" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Select treatment
            </label>
            <div className="relative mt-1.5">
              <select
                id="bc-service"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-white/15 bg-white/5 pl-4 pr-10 text-sm text-white outline-none focus:border-[#D9BE8C]"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id} className="text-[#1F1E1D]">
                    {s.name} — {formatPrice(s.price)} ({s.duration} min)
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
            </div>
          </div>

          <div>
            <label htmlFor="bc-date" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Preferred date
            </label>
            <input
              id="bc-date"
              type="date"
              value={date}
              min={today || undefined}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none [color-scheme:dark] focus:border-[#D9BE8C]"
            />
          </div>
        </div>
      )}

      <Link href={href} className="mt-6 block">
        <span className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#1F1B17] transition hover:bg-[#F3EEE4]">
          <CalendarCheck className="h-4 w-4" /> Book appointment
        </span>
      </Link>

      {phone && (
        <a
          href={`tel:${phone}`}
          className="mt-4 flex items-center justify-center gap-2 text-xs text-white/70 transition hover:text-white"
        >
          <Phone className="h-3.5 w-3.5" /> Call studio: <span className="font-medium text-white">{phone}</span>
        </a>
      )}
    </div>
  );
}
