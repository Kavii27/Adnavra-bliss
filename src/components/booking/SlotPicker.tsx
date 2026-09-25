"use client";
import { useState, useEffect } from "react";
import { Clock, Calendar, Loader2, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n/locale-context";

type Slot = { start: string; end: string };
type Service = { id: string; name: string; duration: number; price: number };

export function SlotPicker({
  businessSlug,
  initialServiceId,
}: {
  businessSlug: string;
  initialServiceId?: string;
}) {
  const { t } = useLocale();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>(initialServiceId ?? "");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [businessLoading, setBusinessLoading] = useState(true);

  // Customer form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ reference: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Resolve businessId from slug via fetching profile? Simpler: fetch business by slug via API we add, or infer from services fetch trick.
  // We will fetch the business id by calling /api/businesses/by-slug. That endpoint does not exist yet, so the availability fetch will need a businessId.
  // Workaround: fetch from page's embedded data is not available here, so we fetch list of services via business slug lookup using Prisma not exposed.
  // For now we call an endpoint we create: /api/businesses/by-slug/[slug]
  useEffect(() => {
    async function load() {
      setBusinessLoading(true);
      try {
        const r = await fetch(`/api/businesses/by-slug/${encodeURIComponent(businessSlug)}`);
        const j = await r.json();
        if (r.ok && j.data?.id) {
          setBusinessId(j.data.id);
          // also load services
          const sr = await fetch(`/api/services?businessId=${j.data.id}&limit=100`);
          const sj = await sr.json();
          if (sr.ok) {
            const list: Service[] = (sj.data ?? []).map((s: Service & { price: number; duration: number }) => ({
              id: s.id,
              name: s.name,
              duration: s.duration,
              price: s.price,
            }));
            setServices(list);
            if (!initialServiceId && list.length > 0) setSelectedService(list[0].id);
          }
        }
      } catch {
        // will surface via empty services
      } finally {
        setBusinessLoading(false);
      }
    }
    load();
  }, [businessSlug, initialServiceId]);

  useEffect(() => {
    if (!businessId || !selectedService || !date) {
      setSlots([]);
      return;
    }
    async function fetchSlots() {
      setLoadingSlots(true);
      setSlotError(null);
      setSelectedSlot(null);
      try {
        const url = `/api/availability?businessId=${businessId}&serviceId=${selectedService}&date=${date}`;
        const r = await fetch(url);
        const j = await r.json();
        if (!r.ok) {
          setSlotError(j.error ?? t("booking.error.slots"));
          setSlots([]);
          return;
        }
        setSlots(j.data.slots ?? []);
        if ((j.data.slots ?? []).length === 0) setSlotError(t("booking.error.noSlots"));
      } catch {
        setSlotError(t("booking.error.slotsNetwork"));
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchSlots();
    // t() omitted: error fallback text does not need a refetch on locale switch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, selectedService, date]);

  async function handleBook() {
    if (!selectedSlot || !businessId) return;
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError(t("booking.error.namePhone"));
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          serviceId: selectedService,
          customerName: name,
          customerPhone: phone,
          customerEmail: email || undefined,
          startAt: selectedSlot.start,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error ?? t("booking.error.failedShort"));
        return;
      }
      setResult({ reference: j.reference ?? j.data?.reference });
    } catch {
      setError(t("booking.error.network"));
    } finally {
      setSubmitting(false);
    }
  }

  if (businessLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#8A8377] py-6">
        <Loader2 className="h-4 w-4 animate-spin" /> {t("booking.loading.services")}
      </div>
    );
  }

  if (result) {
    return (
      <div className="rounded-lg bg-[#DCF5E7] border border-[#B5D0BF] p-6 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white">
          <Check className="h-5 w-5 text-[#15803D]" />
        </div>
        <h3 className="mt-3 text-lg font-semibold text-[#1F1E1D]">{t("booking.booked.title")}</h3>
        <p className="mt-1 text-sm text-[#4A4640]">{t("booking.reference.yourRef")}</p>
        <p className="mt-2 inline-flex rounded-md bg-white px-4 py-2 font-mono text-lg font-bold tracking-widest text-[#1F1E1D]">{result.reference}</p>
        <p className="mt-3 text-xs text-[#4A4640]">{t("booking.reference.hint")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service select */}
      <div>
        <label className="text-sm font-medium text-[#1F1E1D]">{t("booking.summary.service")}</label>
        {services.length === 0 ? (
          <p className="mt-2 text-sm text-[#8A8377]">{t("booking.services.none")}</p>
        ) : (
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="mt-2 flex h-10 w-full rounded-md border border-[#E5DDD0] bg-[#FDF9F3] px-3 text-sm focus:outline-none focus:border-[#1F1E1D]"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.duration} min, {(s.price / 100).toLocaleString("en-LK", { style: "currency", currency: "LKR" })})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Date pick */}
      <div>
        <label className="text-sm font-medium text-[#1F1E1D]">{t("booking.date.label")}</label>
        <div className="mt-2 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#8A8377]" />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="max-w-[200px]" />
        </div>
      </div>

      {/* Slots */}
      <div>
        <p className="text-sm font-medium text-[#1F1E1D] flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#795831]" /> {t("booking.slots.title")}
        </p>
        {loadingSlots && (
          <div className="mt-3 flex items-center gap-2 text-sm text-[#8A8377]">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("booking.loading.slots")}
          </div>
        )}
        {slotError && !loadingSlots && <p className="mt-2 text-sm text-[#B91C1C] flex items-center gap-1.5"><AlertCircle className="h-4 w-4" /> {slotError}</p>}
        {!loadingSlots && slots.length > 0 && (
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((s) => {
              const label = new Date(s.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const isSelected = selectedSlot?.start === s.start;
              return (
                <button
                  key={s.start}
                  onClick={() => setSelectedSlot(s)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${isSelected ? "bg-[#795831] text-white border-[#795831]" : "bg-white border-[#E5DDD0] text-[#1F1E1D] hover:bg-[#F7F3ED]"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer form */}
      {selectedSlot && (
        <div className="rounded-lg border border-[#E5DDD0] bg-[#F7F3ED] p-5 space-y-4">
          <p className="text-sm font-semibold text-[#1F1E1D]">{t("booking.yourDetails")}</p>
          <p className="text-xs text-[#8A8377]">
            {t("booking.selected.label")} {new Date(selectedSlot.start).toLocaleString()} to {new Date(selectedSlot.end).toLocaleTimeString()}
          </p>
          <Input placeholder={t("booking.form.namePh")} value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder={t("booking.form.phonePh")} value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input placeholder={t("booking.email")} value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          {error && <p className="text-sm text-[#B91C1C] flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {error}</p>}
          <Button onClick={handleBook} disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> {t("booking.confirming")}
              </>
            ) : (
              t("booking.confirm")
            )}
          </Button>
          <p className="text-xs text-[#8A8377] text-center">{t("booking.reference.after")}</p>
        </div>
      )}
    </div>
  );
}
