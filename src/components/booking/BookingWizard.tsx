"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Check, Clock, MapPin, User, Calendar, ChevronLeft, ChevronRight, Scissors, Info } from "lucide-react";
import { SERVICE_CATEGORIES, taxonomyLabelKey } from "@/lib/categories";
import { useLocale } from "@/lib/i18n/locale-context";
import { ServiceImage } from "@/components/business/service-image";

function PrimaryCta({
  onClick,
  disabled,
  children,
  className = "",
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-12 min-w-[150px] items-center justify-center gap-2 rounded-full bg-[#1F1B17] px-7 text-[12px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_4px_14px_rgba(30,28,26,0.25)] transition-all hover:scale-[1.02] hover:bg-[#795831] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-[#1F1B17] ${className}`}
    >
      {children}
    </button>
  );
}

function SecondaryCta({
  onClick,
  disabled,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-12 items-center justify-center rounded-full border border-[#E5DDD0] bg-white px-7 text-[12px] font-bold uppercase tracking-[0.14em] text-[#1F1E1D] transition-colors hover:bg-[#F7F3ED] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

type Step = "services" | "professional" | "time" | "details" | "confirm";

const STEP_ORDER: Step[] = ["services", "professional", "time", "details", "confirm"];
const STEP_LABELS: Record<Step, string> = {
  services: "Services",
  professional: "Professional",
  time: "Time",
  details: "Your details",
  confirm: "Confirm",
};

function periodKey(label: string): string {
  if (label === "Afternoon") return "booking.period.afternoon";
  if (label === "Evening") return "booking.period.evening";
  return "booking.period.morning";
}

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number; // minor units (cents)
  duration: number; // minutes
  category: string | null;
  isActive: boolean;
  imageUrl?: string | null;
};

type StaffLite = { id: string; name: string };
type BusinessLite = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  district: string | null;
  logoUrl: string | null;
  description: string | null;
};

type Slot = { start: string; end: string; reserved?: boolean };

function formatPrice(minor: number): string {
  return (minor / 100).toLocaleString("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 });
}

function formatTimeLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function formatDateLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function slotPeriod(iso: string): "Morning" | "Afternoon" | "Evening" {
  const hour = new Date(iso).getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

function groupSlotsByPeriod(slots: Slot[]): { label: string; slots: Slot[] }[] {
  const order: ("Morning" | "Afternoon" | "Evening")[] = ["Morning", "Afternoon", "Evening"];
  const byPeriod = new Map<string, Slot[]>();
  for (const s of slots) {
    const p = slotPeriod(s.start);
    const arr = byPeriod.get(p) ?? [];
    arr.push(s);
    byPeriod.set(p, arr);
  }
  return order.filter((p) => byPeriod.has(p)).map((p) => ({ label: p, slots: byPeriod.get(p)! }));
}

function groupServices(services: Service[]): { key: string; label: string; services: Service[] }[] {
  const byCategory = new Map<string, Service[]>();
  const uncategorized: Service[] = [];
  for (const s of services) {
    if (s.category && SERVICE_CATEGORIES.some((c) => c.slug === s.category)) {
      const arr = byCategory.get(s.category) ?? [];
      arr.push(s);
      byCategory.set(s.category, arr);
    } else {
      uncategorized.push(s);
    }
  }
  const groups: { key: string; label: string; services: Service[] }[] = [];
  if (uncategorized.length > 0) {
    groups.push({ key: "featured", label: "Featured", services: uncategorized });
  }
  for (const cat of SERVICE_CATEGORIES) {
    const list = byCategory.get(cat.slug);
    if (list && list.length > 0) {
      groups.push({ key: cat.slug, label: cat.label, services: list });
    }
  }
  // Any categories not in SERVICE_CATEGORIES but present in data
  for (const [slug, list] of byCategory.entries()) {
    if (!SERVICE_CATEGORIES.some((c) => c.slug === slug)) {
      const label = slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      groups.push({ key: slug, label, services: list });
    }
  }
  return groups;
}

function getDateStrip(base: Date, offsetDays: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + offsetDays + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function dayLabel(dateStr: string): { dow: string; dayNum: string; isToday: boolean; isTomorrow: boolean } {
  const d = new Date(dateStr + "T00:00:00Z");
  const nowStr = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  const dow = d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
  const dayNum = d.getUTCDate().toString();
  return { dow, dayNum, isToday: dateStr === nowStr, isTomorrow: dateStr === tomorrowStr };
}

function stepLabel(t: (key: string) => string, s: Step): string {
  if (s === "details") {
    const v = t("booking.step.details");
    return v === "booking.step.details" ? (STEP_LABELS[s] ?? s) : v;
  }
  const v = t(`booking.step.${s}`);
  return v === `booking.step.${s}` ? (STEP_LABELS[s] ?? s) : v;
}

export function BookingWizard({
  businessSlug,
  initialServiceId,
  initialStaffId,
  initialDate,
  initialSlotStart,
}: {
  businessSlug: string;
  initialServiceId?: string;
  initialStaffId?: string;
  initialDate?: string;
  initialSlotStart?: string;
}) {
  const [step, setStep] = useState<Step>("services");
  const { t } = useLocale();

  // Phase 4: guest-friendly — no session gate. Identity comes from the
  // "Your details" step (name + phone required, email optional).

  // Data
  const [business, setBusiness] = useState<BusinessLite | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffLite[]>([]);

  // Selections — multi-service cart (checkbox-style, order preserved)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    initialServiceId ? [initialServiceId] : [],
  );
  function toggleService(id: string) {
    setSelectedServiceIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }
  const selectedServices = useMemo(
    () => selectedServiceIds.map((id) => services.find((s) => s.id === id)).filter((s): s is Service => !!s),
    [selectedServiceIds, services],
  );
  const totalDuration = useMemo(() => selectedServices.reduce((sum, s) => sum + s.duration, 0), [selectedServices]);
  const totalPrice = useMemo(() => selectedServices.reduce((sum, s) => sum + s.price, 0), [selectedServices]);

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(initialStaffId ?? null); // null = Any professional
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) return initialDate;
    return new Date().toISOString().slice(0, 10);
  });
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [pendingSlotStart, setPendingSlotStart] = useState<string | null>(initialSlotStart ?? null);
  const [notes, setNotes] = useState("");
  const [logoFailed, setLogoFailed] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Contact fields — replaces the old account-based identity
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState(""); // optional
  const contactValid = customerName.trim().length > 0 && customerPhone.trim().length >= 7;

  // UI state
  const [bizLoading, setBizLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [dateOffset, setDateOffset] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ reference: string } | null>(null);

  const selectedStaffName = useMemo(() => {
    if (!selectedStaffId) return t("booking.pro.any");
    return staff.find((s) => s.id === selectedStaffId)?.name ?? t("booking.pro.any");
  }, [selectedStaffId, staff, t]);

  // Restore a deep-linked slot once slots load. Never auto-select a
  // slot someone else has since booked — just clear the pending marker.
  useEffect(() => {
    if (!pendingSlotStart || selectedSlot || slots.length === 0) return;
    const match = slots.find((s) => s.start === pendingSlotStart);
    if (match && !match.reserved) {
      setSelectedSlot(match);
    }
    setPendingSlotStart(null);
  }, [pendingSlotStart, selectedSlot, slots]);

  // Load business + services + staff
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setBizLoading(true);
      setServicesLoading(true);
      setStaffLoading(true);
      try {
        const r = await fetch(`/api/businesses/by-slug/${encodeURIComponent(businessSlug)}`);
        const j = await r.json();
        if (!cancelled && r.ok && j.data?.id) {
          const b: BusinessLite = j.data;
          setBusiness(b);
          // services
          setServicesLoading(true);
          try {
            const sr = await fetch(`/api/services?businessId=${b.id}&limit=100`);
            const sj = await sr.json();
            if (!cancelled && sr.ok) {
              const list: Service[] = (sj.data ?? []) as Service[];
              setServices(list);
            }
          } catch {
            /* services error handled via empty state */
          } finally {
            if (!cancelled) setServicesLoading(false);
          }
          // staff — public minimal path (id, name only)
          try {
            const tr = await fetch(`/api/staff?businessId=${b.id}&public=true&limit=100`);
            const tj = await tr.json();
            if (!cancelled && tr.ok) {
              setStaff((tj.data ?? []) as StaffLite[]);
            }
          } catch {
            /* staff error -> empty */
          } finally {
            if (!cancelled) setStaffLoading(false);
          }
        } else if (!cancelled) {
          setServicesLoading(false);
          setStaffLoading(false);
        }
      } catch {
        if (!cancelled) {
          setServicesLoading(false);
          setStaffLoading(false);
        }
      } finally {
        if (!cancelled) setBizLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [businessSlug]);

  // Fetch slots when business/services/date/staff changes.
  // Uses the GROUP total duration so the slot fits every selected treatment back-to-back.
  const firstServiceId = selectedServiceIds[0] ?? null;
  useEffect(() => {
    if (!business?.id || !firstServiceId || !selectedDate) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    async function fetchSlots() {
      setSlotsLoading(true);
      setSlotError(null);
      setSelectedSlot(null);
      try {
        const params = new URLSearchParams({
          businessId: business!.id,
          serviceId: firstServiceId as string,
          date: selectedDate,
        });
        if (totalDuration > 0) params.set("totalDurationMin", String(totalDuration));
        if (selectedStaffId) params.set("staffMemberId", selectedStaffId);
        const r = await fetch(`/api/availability?${params.toString()}`);
        const j = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          setSlotError(j.error ?? t("booking.error.slots"));
          setSlots([]);
          return;
        }
        const list: Slot[] = j.data?.slots ?? [];
        setSlots(list);
        if (list.length === 0) setSlotError(t("booking.error.noSlots"));
      } catch {
        if (!cancelled) setSlotError(t("booking.error.slotsNetwork"));
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    }
    fetchSlots();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id, firstServiceId, selectedDate, selectedStaffId, totalDuration]);

  // Navigation helpers
  const currentIndex = STEP_ORDER.indexOf(step);
  function goNext() {
    if (step === "services" && selectedServiceIds.length === 0) return;
    if (step === "time" && !selectedSlot) return;
    if (step === "details" && !contactValid) return;
    const next = STEP_ORDER[currentIndex + 1];
    if (next) {
      setStep(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
  function goBack() {
    if (currentIndex === 0) return;
    const prev = STEP_ORDER[currentIndex - 1];
    if (prev) setStep(prev);
  }

  async function handleConfirm() {
    if (!business?.id || selectedServiceIds.length === 0 || !selectedSlot) return;
    if (!contactValid) {
      setStep("details");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: Record<string, unknown> = {
        businessId: business.id,
        serviceIds: selectedServiceIds,
        startAt: selectedSlot.start,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        notes: notes.trim() || undefined,
      };
      if (selectedStaffId) payload.staffMemberId = selectedStaffId;
      if (customerEmail.trim()) payload.customerEmail = customerEmail.trim();
      const r = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) {
        setSubmitError(j.error ?? t("booking.error.failed"));
        return;
      }
      setSuccess({ reference: j.reference ?? j.data?.[0]?.reference ?? "" });
    } catch {
      setSubmitError(t("booking.error.network"));
    } finally {
      setSubmitting(false);
    }
  }

  const SERIF = "font-[family-name:var(--font-display)]";
  const GOLD = "#D9BE8C";

  // Success state — booking starts PENDING, so say "request sent", not "confirmed"
  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-1">
        <div className="overflow-hidden rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_8px_32px_rgba(30,28,26,0.08)]">
          <div className="bg-gradient-to-br from-[#1F1B17] via-[#2A211A] to-[#1F1B17] px-6 py-10 text-center sm:px-10 sm:py-12">
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full shadow-[0_8px_24px_rgba(217,190,140,0.4)]"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #C9A467)` }}
            >
              <Check className="h-7 w-7 text-[#1B1714]" strokeWidth={3} />
            </div>
            <h2 className={`${SERIF} mt-5 text-3xl font-medium text-white sm:text-4xl`}>{t("booking.success.requestTitle")}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-white/70">
              {t("booking.success.requestLead")} {business?.name ?? businessSlug} {t("booking.success.requestTail")}
            </p>
          </div>
          <div className="px-6 py-8 text-center sm:px-10">
            {success.reference && (
              <div className="mx-auto inline-flex flex-col items-center gap-1 rounded-xl border border-dashed border-[#D9BE8C] bg-[#FBF7EF] px-6 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9A7B4F]">{t("booking.reference.label")}</span>
                <span className="font-mono text-lg font-bold tracking-[0.15em] text-[#1F1E1D]">{success.reference}</span>
              </div>
            )}
            <p className="mt-4 text-xs text-[#8A8377]">{t("booking.reference.hint")}</p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={`/${businessSlug}`}
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#1F1B17] px-6 text-[12px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#795831] sm:w-auto"
              >
                {t("booking.backToVenue")}
              </Link>
              <Link
                href="/"
                className="inline-flex h-11 w-full items-center justify-center rounded-full border border-[#E5DDD0] bg-white px-6 text-[12px] font-bold uppercase tracking-[0.12em] text-[#1F1E1D] transition-colors hover:bg-[#F7F3ED] sm:w-auto"
              >
                {t("nav.home")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const groups = groupServices(services);
  const visibleDates = getDateStrip(new Date(), dateOffset);

  return (
    <div className="flex min-h-[100dvh] w-full flex-col">
      {/* Stepper — sticky in normal flow so it never overlaps content.
          min-h instead of fixed h so longer labels (e.g. Sinhala) grow instead of clipping. */}
      <div className="sticky top-52 z-20 flex min-h-28 shrink-0 items-center bg-[#FAF7F2]">
        <div className="w-full overflow-x-auto overscroll-contain rounded-2xl border border-[#E9E1D3] bg-white px-4 py-5 shadow-[0_2px_16px_rgba(30,28,26,0.04)] sm:px-8">
          <div className="flex min-w-[520px] items-center sm:min-w-0">
            {STEP_ORDER.map((s, idx) => {
              const isActive = s === step;
              const isCompleted = idx < currentIndex;
              const isClickable = isCompleted;
              return (
                <div key={s} className="flex flex-1 items-center last:flex-none">
                  <button
                    onClick={() => isClickable && setStep(s)}
                    disabled={!isClickable}
                    className="flex shrink-0 flex-col items-center gap-2 disabled:cursor-default"
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-bold transition-all ${
                        isActive
                          ? "scale-110 text-[#1B1714] shadow-[0_6px_18px_rgba(217,190,140,0.5)]"
                          : isCompleted
                            ? "bg-[#1F1B17] text-white"
                            : "border border-[#E5DDD0] bg-white text-[#8A8377]"
                      }`}
                      style={isActive ? { background: `linear-gradient(135deg, ${GOLD}, #C9A467)` } : undefined}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                    </span>
                    <span
                      className={`whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] ${
                        isActive || isCompleted ? "text-[#1F1E1D]" : "text-[#B4AC9E]"
                      }`}
                    >
                      {stepLabel(t, s)}
                    </span>
                  </button>
                  {idx < STEP_ORDER.length - 1 && (
                    <span className={`mx-3 h-px flex-1 transition-colors ${isCompleted ? "bg-[#1F1B17]" : "bg-[#E5DDD0]"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mb-2 shrink-0" aria-hidden="true" />

      {/* Left wizard + right summary. The summary is fixed at lg+ so it stays
          visible while scrolling; the left card reserves its column via margin. */}
      <div className="flex flex-col gap-6 lg:block">
        {/* Left: step content — scrolls independently, pb clears the fixed mobile bar */}
        <div className="flex min-h-[560px] flex-1 flex-col overflow-hidden rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_8px_32px_rgba(30,28,26,0.08)] lg:mr-[432px] xl:mr-[452px]">
          {/* Loading state */}
          {bizLoading ? (
            <div className="flex flex-1 items-center justify-center gap-2 py-12 text-sm text-[#8A8377]">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("booking.loading.details")}
            </div>
          ) : (
            <>
              {/* Step 1: Services (multi-select) */}
              {step === "services" && (
                <div className="flex flex-1 flex-col">
                  <div className="shrink-0 border-b border-[#F1EDE7] px-6 pb-5 pt-7 sm:px-9">
                    <h2 className={`${SERIF} text-3xl font-medium tracking-tight text-[#1F1E1D]`}>{t("booking.selectServices")}</h2>
                    <p className="mt-1 text-sm text-[#8A8377]">{t("booking.selectServices.sub")}</p>
                    {groups.length > 1 && (
                      <div className="mb-1 mt-5 flex gap-2 overflow-x-auto overscroll-contain pb-1">
                        <button
                          type="button"
                          onClick={() => setActiveCategory(null)}
                          className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                            activeCategory === null ? "border-[#1F1B17] bg-[#1F1B17] text-white" : "border-[#E5DDD0] bg-white text-[#4A4640] hover:border-[#CCC6BD]"
                          }`}
                        >
                          {t("booking.filter.all")}
                        </button>
                        {groups.map((g) => (
                          <button
                            key={g.key}
                            type="button"
                            onClick={() => setActiveCategory(g.key)}
                            className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                              activeCategory === g.key ? "border-[#1F1B17] bg-[#1F1B17] text-white" : "border-[#E5DDD0] bg-white text-[#4A4640] hover:border-[#CCC6BD]"
                            }`}
                          >
                            {g.key === "featured" ? t("booking.group.featured") : t(taxonomyLabelKey(g.key))}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto overscroll-contain">
                    {servicesLoading ? (
                      <div className="flex items-center gap-2 p-6 text-sm text-[#8A8377]">
                        <Loader2 className="h-4 w-4 animate-spin" /> {t("booking.loading.services")}
                      </div>
                    ) : services.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-sm font-medium text-[#1F1E1D]">{t("booking.services.emptyTitle")}</p>
                        <p className="mt-1 text-sm text-[#8A8377]">{t("booking.services.emptySub")}</p>
                      </div>
                    ) : (
                      <div className="space-y-8 px-6 py-6 sm:px-9">
                        {groups
                          .filter((g) => activeCategory === null || activeCategory === g.key)
                          .map((g) => (
                            <div key={g.key}>
                              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9A7B4F]">{g.key === "featured" ? t("booking.group.featured") : t(taxonomyLabelKey(g.key))}</h3>
                              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {g.services.map((s) => {
                                  const isSelected = selectedServiceIds.includes(s.id);
                                  return (
                                    <button
                                      key={s.id}
                                      type="button"
                                      onClick={() => toggleService(s.id)}
                                      aria-pressed={isSelected}
                                      className={`relative flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                                        isSelected ? "border-[#795831] bg-[#F7F3ED] ring-2 ring-[#795831]/30" : "border-[#E5DDD0] bg-white hover:border-[#C9B99C]"
                                      }`}
                                    >
                                      <ServiceImage name={s.name} category={s.category} imageUrl={s.imageUrl} className="h-16 w-16 shrink-0 rounded-lg" />
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium text-[#1F1E1D]">{s.name}</p>
                                        <p className="mt-0.5 text-xs text-[#8A8377]">{s.duration} {t("booking.min")} · {formatPrice(s.price)}</p>
                                      </div>
                                      <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${isSelected ? "border-[#795831] bg-[#795831]" : "border-[#D9CFBE]"}`}>
                                        {isSelected && <Check className="h-3 w-3 text-white" />}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  {/* Sticky mobile summary bar — running count/price */}
                  {selectedServiceIds.length > 0 && (
                    <div className="shrink-0 border-t border-[#E5DDD0] bg-white/95 px-4 py-3 backdrop-blur sm:mt-4 sm:rounded-xl sm:border sm:bg-[#F7F3ED] sm:py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-[#8A8377]">{selectedServiceIds.length} treatment{selectedServiceIds.length > 1 ? "s" : ""} · {totalDuration} {t("booking.min")}</p>
                          <p className="font-semibold text-[#1F1E1D]">{formatPrice(totalPrice)}</p>
                        </div>
                        <PrimaryCta onClick={goNext}>{t("booking.continue")}</PrimaryCta>
                      </div>
                    </div>
                  )}
                  {selectedServiceIds.length === 0 && (
                    <div className="flex shrink-0 justify-end border-t border-[#F1EDE7] px-6 py-5 sm:px-9">
                      <PrimaryCta onClick={goNext} disabled>
                        {t("booking.continue")}
                      </PrimaryCta>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Professional */}
              {step === "professional" && (
                <div className="flex flex-1 flex-col">
                  <div className="shrink-0 border-b border-[#F1EDE7] px-6 pb-4 pt-7 sm:px-9">
                    <h2 className={`${SERIF} text-3xl font-medium tracking-tight text-[#1F1E1D]`}>{t("booking.pro.title")}</h2>
                    <p className="mt-1 text-sm text-[#8A8377]">{t("booking.pro.sub")}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto overscroll-contain p-6 sm:p-9">
                    {staffLoading ? (
                      <div className="flex items-center gap-2 text-sm text-[#8A8377]">
                        <Loader2 className="h-4 w-4 animate-spin" /> {t("booking.loading.team")}
                      </div>
                    ) : (
                      <>
                        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#9A7B4F]">
                          <User className="h-3.5 w-3.5" /> {t("booking.pro.available")}
                        </label>
                        {staff.length === 0 ? (
                          <p className="mt-3 text-sm text-[#8A8377]">{t("booking.pro.empty")}</p>
                        ) : (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            <button
                              type="button"
                              onClick={() => setSelectedStaffId(null)}
                              className={`group flex items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                                !selectedStaffId
                                  ? "border-[#1F1B17] bg-[#FBF7EF] shadow-[0_8px_20px_rgba(30,28,26,0.1)]"
                                  : "border-[#E9E1D3] bg-white hover:-translate-y-0.5 hover:border-[#CCC6BD] hover:shadow-[0_6px_16px_rgba(30,28,26,0.08)]"
                              }`}
                            >
                              <span
                                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2"
                                style={{ borderColor: !selectedStaffId ? GOLD : "#E5DDD0", background: !selectedStaffId ? `linear-gradient(135deg, ${GOLD}, #C9A467)` : "#F7F3ED" }}
                              >
                                <User className={`h-5 w-5 ${!selectedStaffId ? "text-[#1B1714]" : "text-[#795831]"}`} />
                              </span>
                              <span className="min-w-0">
                                <span className={`${SERIF} block text-lg font-semibold leading-tight text-[#1F1E1D]`}>{t("booking.pro.any")}</span>
                                <span className="block text-xs text-[#8A8377]">{t("booking.pro.anySub")}</span>
                              </span>
                              {!selectedStaffId && <Check className="ml-auto h-4 w-4 shrink-0 text-[#1F1B17]" />}
                            </button>
                            {staff.map((m) => {
                              const isSelected = selectedStaffId === m.id;
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => setSelectedStaffId(m.id)}
                                  className={`group flex items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                                    isSelected
                                      ? "border-[#1F1B17] bg-[#FBF7EF] shadow-[0_8px_20px_rgba(30,28,26,0.1)]"
                                      : "border-[#E9E1D3] bg-white hover:-translate-y-0.5 hover:border-[#CCC6BD] hover:shadow-[0_6px_16px_rgba(30,28,26,0.08)]"
                                  }`}
                                >
                                  <span
                                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${SERIF}`}
                                    style={
                                      isSelected
                                        ? { background: `linear-gradient(135deg, ${GOLD}, #C9A467)`, color: "#1B1714" }
                                        : { border: "2px solid #E5DDD0", background: "#F7F3ED", color: "#795831" }
                                    }
                                  >
                                    {m.name.slice(0, 2).toUpperCase()}
                                  </span>
                                  <span className="min-w-0">
                                    <span className={`${SERIF} block truncate text-lg font-semibold leading-tight text-[#1F1E1D]`}>{m.name}</span>
                                    <span className="block text-xs text-[#8A8377]">{t("booking.pro.specialist")}</span>
                                  </span>
                                  {isSelected && <Check className="ml-auto h-4 w-4 shrink-0 text-[#1F1B17]" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex shrink-0 justify-between gap-3 border-t border-[#F1EDE7] px-6 py-5 sm:px-9">
                    <SecondaryCta onClick={goBack}>{t("booking.back")}</SecondaryCta>
                    <PrimaryCta onClick={goNext}>{t("booking.continue")}</PrimaryCta>
                  </div>
                </div>
              )}

              {/* Step 3: Time */}
              {step === "time" && (
                <div className="flex flex-1 flex-col">
                  <div className="shrink-0 border-b border-[#F1EDE7] px-6 pb-4 pt-7 sm:px-9">
                    <h2 className={`${SERIF} text-3xl font-medium tracking-tight text-[#1F1E1D]`}>{t("booking.time.title")}</h2>
                    <p className="mt-1 text-sm text-[#8A8377]">
                      {selectedServices.length > 0 ? <>{selectedServices.length} treatment{selectedServices.length > 1 ? "s" : ""} · {totalDuration} {t("booking.min")}</> : t("booking.time.pickPrompt")}
                      {selectedStaffId ? ` · ${selectedStaffName}` : ""}
                    </p>
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-6 sm:p-9">
                    {selectedServiceIds.length === 0 ? (
                      <div className="flex gap-2 rounded-lg border border-[#FDECEC] bg-[#FDECEC] p-4 text-sm text-[#B91C1C]">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {t("booking.time.needService")}
                      </div>
                    ) : (
                      <>
                        {/* Date strip: 7 visible days, arrows to page */}
                        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#9A7B4F]">
                          <Calendar className="h-3.5 w-3.5" /> {t("booking.time.chooseDate")}
                        </label>
                        <div className="mt-3 flex items-center gap-1.5 sm:gap-2">
                          <button
                            onClick={() => setDateOffset((v) => Math.max(0, v - 7))}
                            disabled={dateOffset === 0}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E5DDD0] bg-white text-[#4A4640] transition-colors hover:bg-[#F7F3ED] disabled:opacity-40"
                            aria-label={t("booking.time.prevWeek")}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <div className="grid min-w-0 flex-1 grid-cols-7 gap-1.5 sm:gap-2">
                            {visibleDates.map((d) => {
                              const { dow, dayNum, isToday, isTomorrow } = dayLabel(d);
                              const isSelected = d === selectedDate;
                              return (
                                <button
                                  key={d}
                                  onClick={() => setSelectedDate(d)}
                                  className={`flex flex-col items-center rounded-xl border py-2.5 text-xs transition-all sm:py-3 ${
                                    isSelected
                                      ? "border-transparent text-[#1B1714] shadow-[0_6px_16px_rgba(217,190,140,0.45)]"
                                      : "border-[#E9E1D3] bg-white text-[#1F1E1D] hover:border-[#CCC6BD] hover:bg-[#F7F3ED]"
                                  }`}
                                  style={isSelected ? { background: `linear-gradient(135deg, ${GOLD}, #C9A467)` } : undefined}
                                >
                                  <span className={`text-[9px] sm:text-[11px] ${isSelected ? "text-[#1B1714]/70" : "text-[#8A8377]"}`}>
                                    {isToday ? t("booking.date.today") : isTomorrow ? t("booking.date.tomorrow") : dow}
                                  </span>
                                  <span className={`${SERIF} mt-1 text-base font-semibold sm:text-lg`}>{dayNum}</span>
                                </button>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => setDateOffset((v) => v + 7)}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E5DDD0] bg-white text-[#4A4640] transition-colors hover:bg-[#F7F3ED]"
                            aria-label={t("booking.time.nextWeek")}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Slots — grouped by time of day */}
                        <div className="mt-6 min-h-[180px] flex-1">
                          {slotsLoading ? (
                            <div className="flex items-center gap-2 py-6 text-sm text-[#8A8377]">
                              <Loader2 className="h-4 w-4 animate-spin" /> {t("booking.loading.times")}
                            </div>
                          ) : slotError && slots.length === 0 ? (
                            <p className="flex items-center gap-1.5 py-3 text-sm text-[#B91C1C]">
                              <AlertCircle className="h-4 w-4" /> {slotError}
                            </p>
                          ) : slots.length > 0 ? (
                            <div className="space-y-5">
                              {groupSlotsByPeriod(slots).map((group) => (
                                <div key={group.label}>
                                  <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9A7B4F]">{t(periodKey(group.label))}</h4>
                                  <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
                                    {group.slots.map((s) => {
                                      const isSelected = selectedSlot?.start === s.start;
                                      if (s.reserved) {
                                        return (
                                          <span
                                            key={s.start}
                                            aria-disabled="true"
                                            title={t("booking.slot.reservedTitle")}
                                            className="flex cursor-not-allowed flex-col items-center rounded-full border border-dashed border-[#E5DDD0] bg-[#F7F3ED] px-3 py-2 text-[#B4AC9E]"
                                          >
                                            <span className="text-sm font-medium line-through decoration-[#CCC6BD]">{formatTimeLabel(s.start)}</span>
                                            <span className="text-[9px] font-semibold uppercase tracking-wide">{t("booking.slot.reserved")}</span>
                                          </span>
                                        );
                                      }
                                      return (
                                        <button
                                          key={s.start}
                                          onClick={() => setSelectedSlot(s)}
                                          className={`rounded-full border px-3 py-2.5 text-sm font-medium transition-all ${
                                            isSelected
                                              ? "border-[#1F1B17] bg-[#1F1B17] text-white shadow-[0_4px_14px_rgba(30,28,26,0.25)]"
                                              : "border-[#E9E1D3] bg-white text-[#1F1E1D] hover:border-[#CCC6BD] hover:bg-[#F7F3ED]"
                                          }`}
                                        >
                                          {formatTimeLabel(s.start)}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        {selectedSlot && (
                          <p className="mt-4 flex items-center gap-2 rounded-xl border border-[#E9E1D3] bg-[#FBF7EF] px-4 py-3 text-sm font-medium text-[#1F1E1D]">
                            <Clock className="h-4 w-4 shrink-0 text-[#9A7B4F]" />
                            {formatDateLabel(selectedSlot.start)} – {formatTimeLabel(selectedSlot.end)}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex shrink-0 justify-between gap-3 border-t border-[#F1EDE7] px-6 py-5 sm:px-9">
                    <SecondaryCta onClick={goBack}>{t("booking.back")}</SecondaryCta>
                    <PrimaryCta onClick={goNext} disabled={!selectedSlot}>
                      {t("booking.continue")}
                    </PrimaryCta>
                  </div>
                </div>
              )}

              {/* Step 4: Your details (replaces the old sign-in gate) */}
              {step === "details" && (
                <div className="flex flex-1 flex-col">
                  <div className="shrink-0 border-b border-[#F1EDE7] px-6 pb-4 pt-7 sm:px-9">
                    <h2 className={`${SERIF} text-3xl font-medium tracking-tight text-[#1F1E1D]`}>{t("booking.yourDetails")}</h2>
                    <p className="mt-1 text-sm text-[#8A8377]">{t("booking.details.sub")}</p>
                  </div>
                  <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-6 sm:p-9">
                    <div className="max-w-md space-y-4">
                      <div>
                        <label htmlFor="wizard-name" className="text-sm font-medium text-[#1F1E1D]">{t("booking.name")} *</label>
                        <input
                          id="wizard-name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          required
                          autoComplete="name"
                          className="mt-1 h-12 w-full rounded-xl border border-[#E5DDD0] px-4 text-[15px] outline-none focus:border-[#795831]"
                          placeholder={t("booking.details.namePh")}
                        />
                      </div>
                      <div>
                        <label htmlFor="wizard-phone" className="text-sm font-medium text-[#1F1E1D]">{t("booking.phone")} *</label>
                        <input
                          id="wizard-phone"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          required
                          type="tel"
                          autoComplete="tel"
                          className="mt-1 h-12 w-full rounded-xl border border-[#E5DDD0] px-4 text-[15px] outline-none focus:border-[#795831]"
                          placeholder={t("booking.details.phonePh")}
                        />
                        <p className="mt-1 text-xs text-[#8A8377]">{t("booking.details.phoneHint")}</p>
                      </div>
                      <div>
                        <label htmlFor="wizard-email" className="text-sm font-medium text-[#1F1E1D]">{t("booking.email")}</label>
                        <input
                          id="wizard-email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          type="email"
                          autoComplete="email"
                          className="mt-1 h-12 w-full rounded-xl border border-[#E5DDD0] px-4 text-[15px] outline-none focus:border-[#795831]"
                          placeholder="you@example.com"
                        />
                      </div>
                      {!contactValid && (
                        <p className="text-xs text-[#8A8377]">{t("booking.details.requiredHint")}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 justify-between gap-3 border-t border-[#F1EDE7] px-6 py-5 sm:px-9">
                    <SecondaryCta onClick={goBack}>{t("booking.back")}</SecondaryCta>
                    <PrimaryCta onClick={goNext} disabled={!contactValid}>
                      {t("booking.continue")}
                    </PrimaryCta>
                  </div>
                </div>
              )}

              {/* Step 5: Confirm */}
              {step === "confirm" && (
                <div className="flex flex-1 flex-col">
                  <div className="shrink-0 border-b border-[#F1EDE7] px-6 pb-4 pt-7 sm:px-9">
                    <h2 className={`${SERIF} text-3xl font-medium tracking-tight text-[#1F1E1D]`}>{t("booking.confirm.title")}</h2>
                    <p className="mt-1 text-sm text-[#8A8377]">{t("booking.confirm.review")}</p>
                  </div>
                  <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain p-6 sm:p-9">
                    {/* Summary inline for mobile before aside */}
                    {selectedServices.length > 0 && selectedSlot && (
                      <div className="flex items-center gap-3 rounded-xl border border-[#E9E1D3] bg-[#FBF7EF] p-4 lg:hidden">
                        <div className="min-w-0 flex-1">
                          <p className={`${SERIF} truncate text-lg font-semibold text-[#1F1E1D]`}>
                            {selectedServices.length} treatment{selectedServices.length > 1 ? "s" : ""} · {totalDuration} {t("booking.min")}
                          </p>
                          <p className="text-xs text-[#4A4640]">
                            {formatDateLabel(selectedSlot.start)} · {selectedStaffName}
                          </p>
                          <p className="text-sm font-semibold text-[#1F1E1D]">{t("booking.total")} {formatPrice(totalPrice)}</p>
                        </div>
                      </div>
                    )}

                    {!selectedSlot || selectedServices.length === 0 ? (
                      <div className="flex gap-2 rounded-lg border border-[#FDECEC] bg-[#FDECEC] p-4 text-sm text-[#B91C1C]">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {t("booking.confirm.needSelection")}
                      </div>
                    ) : (
                      <>
                        <ul className="divide-y divide-[#F1EBDF] rounded-2xl border border-[#E9E1D3] bg-white px-4">
                          {selectedServices.map((s) => (
                            <li key={s.id} className="flex items-center gap-3 py-3">
                              <ServiceImage
                                name={s.name}
                                category={s.category}
                                imageUrl={s.imageUrl}
                                className="h-12 w-12 shrink-0 rounded-xl sm:h-14 sm:w-14"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-[#1F1E1D]">{s.name}</p>
                                <p className="text-xs text-[#8A8377]">
                                  {s.duration} {t("booking.min")} · {selectedStaffName}
                                </p>
                                <p className="text-xs text-[#4A4640]">{formatDateLabel(selectedSlot!.start)}</p>
                              </div>
                              <span className="shrink-0 text-sm font-semibold text-[#1F1E1D]">{formatPrice(s.price)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex items-center justify-between border-t border-[#E5DDD0] pt-3">
                          <span className="font-semibold text-[#1F1E1D]">{t("booking.total")}</span>
                          <span className={`${SERIF} text-xl font-semibold text-[#1F1E1D]`}>{formatPrice(totalPrice)}</span>
                        </div>

                        {/* Contact recap */}
                        <div className="rounded-2xl border border-[#E9E1D3] bg-[#FBF7EF] p-4 text-sm">
                          <p className="font-semibold text-[#1F1E1D]">{customerName || "—"}</p>
                          <p className="text-[#4A4640]">{customerPhone || "—"}{customerEmail.trim() ? ` · ${customerEmail.trim()}` : ""}</p>
                          <button type="button" onClick={() => setStep("details")} className="mt-1 text-xs font-medium text-[#795831] hover:underline">
                            {t("booking.details.edit")}
                          </button>
                        </div>

                        <div className="flex gap-3 rounded-xl border border-[#E9E1D3] bg-[#FBF7EF] p-4">
                          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#9A7B4F]" />
                          <div>
                            <h3 className="text-sm font-semibold text-[#1F1E1D]">{t("booking.policy.title")}</h3>
                            <p className="mt-1 text-sm leading-relaxed text-[#4A4640]">{t("booking.policy.cancel24")}</p>
                          </div>
                        </div>

                        {business?.description && (
                          <div className="flex gap-3 rounded-xl border border-[#E9E1D3] bg-white p-4">
                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#9A7B4F]" />
                            <div>
                              <h3 className="text-sm font-semibold text-[#1F1E1D]">{t("booking.info.title")}</h3>
                              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#4A4640]">{business.description}</p>
                            </div>
                          </div>
                        )}

                        <div>
                          <label htmlFor="wizard-notes" className="text-sm font-medium text-[#1F1E1D]">
                            {t("booking.notes.label")} <span className="font-normal text-[#8A8377]">{t("booking.notes.optional")}</span>
                          </label>
                          <textarea
                            id="wizard-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            maxLength={1000}
                            placeholder={t("booking.notes.placeholder")}
                            className="mt-2 flex w-full rounded-lg border border-[#E5DDD0] bg-[#FDF9F3] px-3 py-2 text-sm text-[#1F1E1D] placeholder:text-[#8A8377] focus:border-[#1F1E1D] focus:outline-none focus:ring-1 focus:ring-[#1F1B17]"
                          />
                          <p className="mt-1 text-right text-xs text-[#8A8377]">{notes.length}/1000</p>
                        </div>

                        {submitError && (
                          <p className="flex items-center gap-1.5 text-sm text-[#B91C1C]">
                            <AlertCircle className="h-4 w-4 shrink-0" /> {submitError}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-between gap-3 border-t border-[#F1EDE7] px-6 py-5 sm:px-9">
                    <SecondaryCta onClick={goBack} disabled={submitting}>
                      {t("booking.back")}
                    </SecondaryCta>
                    <PrimaryCta onClick={handleConfirm} disabled={submitting || !selectedSlot || selectedServices.length === 0} className="min-w-[160px]">
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> {t("booking.confirming")}
                        </>
                      ) : (
                        t("booking.confirm")
                      )}
                    </PrimaryCta>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: summary panel (live) — fixed at lg+ so it stays visible while
            scrolling. On mobile it is a normal in-flow block below the wizard. */}
        <aside className="h-fit overflow-hidden rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_8px_32px_rgba(30,28,26,0.1)] lg:fixed lg:bottom-6 lg:right-12 lg:top-96 lg:w-[400px] lg:overflow-y-auto lg:overscroll-contain xl:w-[420px]">
          {bizLoading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-[#8A8377]">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("booking.loading.venue")}
            </div>
          ) : business ? (
            <div>
              <div className="flex items-center gap-3 bg-gradient-to-br from-[#241D18] to-[#1F1B17] p-6">
                {business.logoUrl && !logoFailed ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={business.logoUrl}
                    alt={business.name}
                    onError={() => setLogoFailed(true)}
                    className="h-14 w-14 shrink-0 rounded-full border-2 object-cover"
                    style={{ borderColor: GOLD }}
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 bg-white/10" style={{ borderColor: GOLD }}>
                    <Scissors className="h-6 w-6" style={{ color: GOLD }} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                    {t("booking.summary.title")}
                  </p>
                  <p className={`${SERIF} truncate text-xl font-medium leading-tight text-white`}>{business.name}</p>
                  {(business.address || business.city || business.district) && (
                    <p className="mt-1 flex gap-1 text-xs leading-relaxed text-white/60">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 truncate">{[business.address, business.city, business.district].filter(Boolean).join(", ") || business.address}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9A7B4F]">{t("booking.summary.selection")}</h3>
                  {selectedServices.length > 0 ? (
                    <ul className="divide-y divide-[#F1EBDF]">
                      {selectedServices.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                          <span className="min-w-0 truncate text-[#4A4640]">{s.name} · {s.duration} {t("booking.min")}</span>
                          <span className="shrink-0 font-medium text-[#1F1E1D]">{formatPrice(s.price)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-[#8A8377]">{t("booking.summary.service")}</span>
                        <span className="text-right font-medium text-[#1F1E1D]">—</span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-[#8A8377]">{t("booking.step.professional")}</span>
                      <span className="text-right font-medium text-[#1F1E1D]">{selectedStaffName}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-[#8A8377]">{t("booking.summary.datetime")}</span>
                      <span className="text-right font-medium text-[#1F1E1D]">{selectedSlot ? formatDateLabel(selectedSlot.start) : "—"}</span>
                    </div>
                  </div>
                  {notes.trim() && (
                    <div className="rounded-lg border border-[#F1EDE7] bg-[#FBF7EF] p-3">
                      <p className="text-xs font-medium text-[#8A8377]">{t("booking.summary.note")}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-[#4A4640]">{notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#FBF7EF] px-4 py-3">
                  <span className="text-sm font-semibold text-[#1F1E1D]">{t("booking.total")}</span>
                  <span className={`${SERIF} text-xl font-semibold text-[#1F1E1D]`}>{selectedServices.length > 0 ? formatPrice(totalPrice) : "—"}</span>
                </div>
                <p className="text-xs leading-relaxed text-[#8A8377]">
                  {t("booking.summary.guestPending")}
                </p>
              </div>
            </div>
          ) : (
            <p className="p-6 text-sm text-[#8A8377]">{t("booking.venue.notFound")}</p>
          )}
        </aside>
      </div>
    </div>
  );
}
