"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, X, Loader2, AlertCircle, Check, Clock, MapPin, User, Calendar, ChevronLeft, ChevronRight, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SERVICE_CATEGORIES } from "@/lib/categories";
import { ServiceImage } from "@/components/business/service-image";

type Step = "services" | "professional" | "time" | "confirm";

const STEP_ORDER: Step[] = ["services", "professional", "time", "confirm"];
const STEP_LABELS: Record<Step, string> = {
  services: "Services",
  professional: "Professional",
  time: "Time",
  confirm: "Confirm",
};

// Static cancellation policy per Phase 7 spec (constant, not per-business yet)
const CANCELLATION_POLICY = "Please cancel at least 24 hours before your appointment.";

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number; // minor units (cents)
  duration: number; // minutes
  category: string | null;
  isActive: boolean;
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

type Slot = { start: string; end: string };

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

  // Step 4: require a CUSTOMER account before a booking is confirmed.
  // The /[businessSlug]/book page already redirects logged-out visitors, but the
  // wizard also gates its own confirm step so a mid-flow session expiry (or any
  // other embed of this component) shows a sign-in prompt — never a dead-end
  // error after clicking confirm.
  const { data: session, status: sessionStatus } = useSession();
  const sessionRole = (session?.user as unknown as { role?: string } | undefined)?.role ?? null;
  const isCustomer = sessionStatus === "authenticated" && sessionRole === "CUSTOMER";

  // Data
  const [business, setBusiness] = useState<BusinessLite | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffLite[]>([]);

  // Selections — single-service cart per Phase 7 default (radio-style)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(initialServiceId ?? null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(initialStaffId ?? null); // null = Any professional
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) return initialDate;
    return new Date().toISOString().slice(0, 10);
  });
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [pendingSlotStart, setPendingSlotStart] = useState<string | null>(initialSlotStart ?? null);
  const [notes, setNotes] = useState("");

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

  const selectedService = useMemo(() => services.find((s) => s.id === selectedServiceId) ?? null, [services, selectedServiceId]);
  const selectedStaffName = useMemo(() => {
    if (!selectedStaffId) return "Any professional";
    return staff.find((s) => s.id === selectedStaffId)?.name ?? "Any professional";
  }, [selectedStaffId, staff]);

  // Step 4: sign-in return URL preserving the current selection, so callbackUrl
  // lands the customer back on the same step instead of restarting the flow.
  const currentUrlWithSelection = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedServiceId) params.set("serviceId", selectedServiceId);
    if (selectedStaffId) params.set("staffId", selectedStaffId);
    if (selectedDate) params.set("date", selectedDate);
    if (selectedSlot) params.set("slot", selectedSlot.start);
    const qs = params.toString();
    return `/${businessSlug}/book${qs ? `?${qs}` : ""}`;
  }, [businessSlug, selectedServiceId, selectedStaffId, selectedDate, selectedSlot]);

  // Restore a deep-linked slot (from callbackUrl) once slots load.
  useEffect(() => {
    if (!pendingSlotStart || selectedSlot || slots.length === 0) return;
    const match = slots.find((s) => s.start === pendingSlotStart);
    if (match) {
      setSelectedSlot(match);
      setPendingSlotStart(null);
    }
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
              // default service selection if not provided
              if (!initialServiceId && list.length > 0 && !selectedServiceId) {
                // keep null until user picks — force explicit choice (no auto-select) per wizard UX,
                // but if initialServiceId was not set keep null; user must pick.
              }
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
    // initialServiceId intentionally not in deps to avoid re-trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessSlug]);

  // Fetch slots when business/service/date/staff changes and step is time
  useEffect(() => {
    if (!business?.id || !selectedServiceId || !selectedDate) {
      setSlots([]);
      return;
    }
    // Only fetch when relevant step is active or user has selected a date
    // Always fetch so summary can be prepared even before entering time step
    let cancelled = false;
    async function fetchSlots() {
      setSlotsLoading(true);
      setSlotError(null);
      setSelectedSlot(null);
      try {
        const params = new URLSearchParams({
          businessId: business!.id,
          serviceId: selectedServiceId as string,
          date: selectedDate,
        });
        if (selectedStaffId) params.set("staffMemberId", selectedStaffId);
        // TODO: filter by staffMemberId once per-staff schedules exist — availability route currently
        // respects staffMemberId for booking overlap but does not yet model per-staff working windows.
        // This param is already forwarded and will be used when that feature ships.
        const r = await fetch(`/api/availability?${params.toString()}`);
        const j = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          setSlotError(j.error ?? "Unable to load slots");
          setSlots([]);
          return;
        }
        const list: Slot[] = j.data?.slots ?? [];
        setSlots(list);
        if (list.length === 0) setSlotError("No slots available on this day. Try another date.");
      } catch {
        if (!cancelled) setSlotError("Network error loading slots");
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    }
    fetchSlots();
    return () => {
      cancelled = true;
    };
    // business object stable after load; tracking id is sufficient for slot refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id, selectedServiceId, selectedDate, selectedStaffId]);

  // Navigation helpers
  const currentIndex = STEP_ORDER.indexOf(step);
  function goNext() {
    if (step === "services" && !selectedServiceId) return;
    if (step === "time" && !selectedSlot) return;
    const next = STEP_ORDER[currentIndex + 1];
    if (next) setStep(next);
  }
  function goBack() {
    if (currentIndex === 0) return;
    const prev = STEP_ORDER[currentIndex - 1];
    if (prev) setStep(prev);
  }

  async function handleConfirm() {
    if (!business?.id || !selectedServiceId || !selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: Record<string, unknown> = {
        businessId: business.id,
        serviceId: selectedServiceId,
        startAt: selectedSlot.start,
        notes: notes.trim() || undefined,
      };
      if (selectedStaffId) payload.staffMemberId = selectedStaffId;
      // Customer identity is now derived from the authenticated CUSTOMER session server-side
      // (customerName/customerPhone backfilled per Phase 7.6). No free-text name/phone form.
      const r = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) {
        if (j.error === "auth_required" || r.status === 401) {
          setSubmitError("Please sign in to confirm your booking — your selection is saved.");
        } else {
          setSubmitError(j.error ?? "Booking failed. Please try again.");
        }
        return;
      }
      setSuccess({ reference: j.reference ?? j.data?.reference ?? "" });
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Success state — replaces wizard content per Task 7.7
  if (success) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="rounded-xl border border-[#E5DDD0] bg-white p-8 shadow-[0_2px_8px_rgba(16,24,40,0.06)] text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#DCF5E7] border border-[#B5D0BF]">
            <Check className="h-6 w-6 text-[#15803D]" />
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-[#1F1E1D]">Appointment confirmed</h2>
          <p className="mt-2 text-sm text-[#4A4640]">Your appointment at {business?.name ?? businessSlug} is confirmed.</p>
          {success.reference && (
            <p className="mt-4 inline-flex rounded-md bg-[#FDF9F3] border border-[#E5DDD0] px-4 py-2 font-mono text-sm font-bold tracking-widest text-[#1F1E1D]">
              {success.reference}
            </p>
          )}
          <p className="mt-3 text-xs text-[#8A8377]">Show this reference at the venue. You can also take a screenshot of this page.</p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/customer/account/activity" className="inline-flex h-10 items-center rounded-md bg-[#795831] px-5 text-sm font-semibold text-white hover:bg-[#5F4426] transition-colors">
              View in your activity
            </Link>
            <Link href={`/${businessSlug}`} className="inline-flex h-10 items-center rounded-md border border-[#E5DDD0] bg-white px-5 text-sm font-semibold text-[#1F1E1D] hover:bg-[#F7F3ED] transition-colors">
              Back to venue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const groups = groupServices(services);
  const visibleDates = getDateStrip(new Date(), dateOffset);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Top bar: close X, back arrow, breadcrumbs */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/${businessSlug}`}
          aria-label="Close"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E5DDD0] bg-white text-[#4A4640] hover:bg-[#F7F3ED] transition-colors"
        >
          <X className="h-4 w-4" />
        </Link>
        {currentIndex > 0 ? (
          <button
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4A4640] hover:text-[#1F1E1D]"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        ) : (
          <span className="text-sm text-[#8A8377]">Book an appointment</span>
        )}
        <div className="ml-auto hidden sm:flex items-center gap-1 text-sm">
          {STEP_ORDER.map((s, idx) => {
            const isActive = s === step;
            const isCompleted = idx < currentIndex;
            const label = STEP_LABELS[s];
            return (
              <span key={s} className="inline-flex items-center gap-1">
                {idx > 0 && <span className="text-[#C9C1B4] mx-1">·</span>}
                {isCompleted ? (
                  <button
                    onClick={() => setStep(s)}
                    className="font-medium text-[#795831] hover:underline underline-offset-4"
                  >
                    {label}
                  </button>
                ) : (
                  <span className={isActive ? "font-semibold text-[#1F1E1D]" : "text-[#8A8377]"}>{label}</span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* Mobile breadcrumbs row */}
      <div className="sm:hidden flex items-center gap-1 text-xs mb-4 overflow-x-auto">
        {STEP_ORDER.map((s, idx) => {
          const isActive = s === step;
          const isCompleted = idx < currentIndex;
          return (
            <span key={s} className="inline-flex items-center gap-1 shrink-0">
              {idx > 0 && <span className="text-[#C9C1B4] mx-1">›</span>}
              {isCompleted ? (
                <button onClick={() => setStep(s)} className="font-medium text-[#795831]">
                  {STEP_LABELS[s]}
                </button>
              ) : (
                <span className={isActive ? "font-semibold text-[#1F1E1D]" : "text-[#8A8377]"}>{STEP_LABELS[s]}</span>
              )}
            </span>
          );
        })}
      </div>

      {/* Main grid: left wizard + right summary (mirror screenshots 8–10 right column) */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Left: step content */}
        <div className="rounded-xl border border-[#E5DDD0] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.06)] overflow-hidden min-h-[480px] flex flex-col">
          {/* Loading state */}
          {bizLoading ? (
            <div className="flex-1 flex items-center justify-center gap-2 text-sm text-[#8A8377] py-12">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading booking details...
            </div>
          ) : (
            <>
              {/* Step 1: Services */}
              {step === "services" && (
                <div className="flex-1 flex flex-col">
                  <div className="px-6 pt-6 pb-3 border-b border-[#F1EDE7]">
                    <h2 className="text-lg font-semibold tracking-tight text-[#1F1E1D]">Select a service</h2>
                    <p className="mt-1 text-sm text-[#8A8377]">Choose one service for this appointment.</p>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {servicesLoading ? (
                      <div className="flex items-center gap-2 text-sm text-[#8A8377] p-6">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading services...
                      </div>
                    ) : services.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-sm font-medium text-[#1F1E1D]">No services listed yet</p>
                        <p className="mt-1 text-sm text-[#8A8377]">This venue has not published its service menu yet.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#F1EDE7]">
                        {groups.map((g) => (
                          <div key={g.key} className="px-6 py-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8A8377]">{g.label}</h3>
                            <ul className="mt-3 space-y-2">
                              {g.services.map((s) => {
                                const isSelected = selectedServiceId === s.id;
                                return (
                                  <li
                                    key={s.id}
                                    className={`flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors ${isSelected ? "border-[#795831] bg-[#F7F3ED]" : "border-[#E5DDD0] bg-white hover:border-[#CCC6BD]"}`}
                                  >
                                    <ServiceImage name={s.name} category={s.category} className="h-16 w-16 rounded-lg" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-semibold leading-tight text-[#1F1E1D]">{s.name}</p>
                                      {s.description && <p className="mt-1 text-xs leading-relaxed text-[#4A4640] line-clamp-2">{s.description}</p>}
                                      <p className="mt-1.5 flex items-center gap-2 text-xs text-[#8A8377]">
                                        <Clock className="h-3.5 w-3.5" /> {s.duration} min
                                      </p>
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end gap-2">
                                      <span className="text-sm font-semibold text-[#1F1E1D]">{formatPrice(s.price)}</span>
                                      <button
                                        onClick={() => setSelectedServiceId(s.id)}
                                        aria-pressed={isSelected}
                                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${isSelected ? "bg-[#795831] border-[#795831] text-white" : "bg-white border-[#E5DDD0] text-[#795831] hover:bg-[#F7F3ED]"}`}
                                        aria-label={isSelected ? "Selected" : `Select ${s.name}`}
                                      >
                                        {isSelected ? <Check className="h-4 w-4" /> : "+"}
                                      </button>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="px-6 py-4 border-t border-[#F1EDE7] flex justify-end">
                    <Button onClick={goNext} disabled={!selectedServiceId} className="min-w-[140px]">
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Professional */}
              {step === "professional" && (
                <div className="flex-1 flex flex-col">
                  <div className="px-6 pt-6 pb-3 border-b border-[#F1EDE7]">
                    <h2 className="text-lg font-semibold tracking-tight text-[#1F1E1D]">Choose a professional</h2>
                    <p className="mt-1 text-sm text-[#8A8377]">Pick who you&apos;d like to book with, or choose any professional.</p>
                  </div>
                  <div className="flex-1 p-6 space-y-4">
                    {staffLoading ? (
                      <div className="flex items-center gap-2 text-sm text-[#8A8377]">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading team...
                      </div>
                    ) : (
                      <>
                        <label className="text-sm font-medium text-[#1F1E1D] flex items-center gap-2">
                          <User className="h-4 w-4 text-[#795831]" /> Professional
                        </label>
                        <select
                          value={selectedStaffId ?? ""}
                          onChange={(e) => setSelectedStaffId(e.target.value || null)}
                          className="flex h-10 w-full rounded-md border border-[#E5DDD0] bg-[#FDF9F3] px-3 text-sm text-[#1F1E1D] focus:outline-none focus:border-[#1F1E1D]"
                        >
                          <option value="">Any professional</option>
                          {staff.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                        {staff.length === 0 && (
                          <p className="text-sm text-[#8A8377]">This venue has not listed individual professionals. &quot;Any professional&quot; will be used.</p>
                        )}
                        <div className="rounded-lg bg-[#FDF9F3] border border-[#F1EDE7] p-4 flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F3ED] border border-[#E5DDD0] text-sm font-semibold text-[#795831] shrink-0">
                            {selectedStaffId ? (staff.find((s) => s.id === selectedStaffId)?.name?.slice(0, 2).toUpperCase() ?? "—") : "AP"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#1F1E1D]">{selectedStaffName}</p>
                            <p className="text-xs text-[#8A8377]">{selectedStaffId ? "Selected professional" : "We will assign an available professional"}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="px-6 py-4 border-t border-[#F1EDE7] flex justify-between gap-3">
                    <Button variant="secondary" onClick={goBack}>
                      Back
                    </Button>
                    <Button onClick={goNext} className="min-w-[140px]">
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Time */}
              {step === "time" && (
                <div className="flex-1 flex flex-col">
                  <div className="px-6 pt-6 pb-3 border-b border-[#F1EDE7]">
                    <h2 className="text-lg font-semibold tracking-tight text-[#1F1E1D]">Select a time</h2>
                    <p className="mt-1 text-sm text-[#8A8377]">
                      {selectedService ? `${selectedService.name} · ${selectedService.duration} min` : "Pick a date and time"}
                      {selectedStaffId ? ` · ${selectedStaffName}` : ""}
                    </p>
                  </div>

                  <div className="p-6 space-y-4 flex-1 flex flex-col min-h-0">
                    {!selectedServiceId ? (
                      <div className="rounded-lg border border-[#FDECEC] bg-[#FDECEC] p-4 flex gap-2 text-sm text-[#B91C1C]">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> Please go back and select a service first.
                      </div>
                    ) : (
                      <>
                        {/* Date strip: 7 visible days, arrows to page */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDateOffset((v) => Math.max(0, v - 7))}
                            disabled={dateOffset === 0}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E5DDD0] bg-white text-[#4A4640] hover:bg-[#F7F3ED] disabled:opacity-40 shrink-0"
                            aria-label="Previous week"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <div className="flex-1 grid grid-cols-7 gap-1.5 min-w-0">
                            {visibleDates.map((d) => {
                              const { dow, dayNum, isToday, isTomorrow } = dayLabel(d);
                              const isSelected = d === selectedDate;
                              return (
                                <button
                                  key={d}
                                  onClick={() => setSelectedDate(d)}
                                  className={`flex flex-col items-center rounded-lg border px-1 py-2.5 text-xs transition-colors ${isSelected ? "bg-[#795831] border-[#795831] text-white" : "bg-white border-[#E5DDD0] text-[#1F1E1D] hover:bg-[#F7F3ED]"}`}
                                >
                                  <span className={`text-[11px] ${isSelected ? "text-white/80" : "text-[#8A8377]"}`}>
                                    {isToday ? "Today" : isTomorrow ? "Tomorrow" : dow}
                                  </span>
                                  <span className="mt-1 text-sm font-semibold">{dayNum}</span>
                                </button>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => setDateOffset((v) => v + 7)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E5DDD0] bg-white text-[#4A4640] hover:bg-[#F7F3ED] shrink-0"
                            aria-label="Next week"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-[#8A8377]">
                          <Calendar className="h-3.5 w-3.5" /> {selectedDate}
                        </div>

                        {/* Slots */}
                        <div className="flex-1 min-h-[180px]">
                          {slotsLoading ? (
                            <div className="flex items-center gap-2 text-sm text-[#8A8377] py-6">
                              <Loader2 className="h-4 w-4 animate-spin" /> Loading times...
                            </div>
                          ) : slotError && slots.length === 0 ? (
                            <p className="text-sm text-[#B91C1C] flex items-center gap-1.5 py-3">
                              <AlertCircle className="h-4 w-4" /> {slotError}
                            </p>
                          ) : slots.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {slots.map((s) => {
                                const isSelected = selectedSlot?.start === s.start;
                                return (
                                  <button
                                    key={s.start}
                                    onClick={() => setSelectedSlot(s)}
                                    className={`rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${isSelected ? "bg-[#795831] text-white border-[#795831]" : "bg-white border-[#E5DDD0] text-[#1F1E1D] hover:bg-[#F7F3ED]"}`}
                                  >
                                    {formatTimeLabel(s.start)}
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>

                        {selectedSlot && (
                          <p className="text-xs text-[#4A4640] bg-[#FDF9F3] border border-[#F1EDE7] rounded-md px-3 py-2">
                            Selected: {formatDateLabel(selectedSlot.start)} – {formatTimeLabel(selectedSlot.end)}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="px-6 py-4 border-t border-[#F1EDE7] flex justify-between gap-3">
                    <Button variant="secondary" onClick={goBack}>
                      Back
                    </Button>
                    <Button onClick={goNext} disabled={!selectedSlot} className="min-w-[140px]">
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Confirm */}
              {step === "confirm" && (
                <div className="flex-1 flex flex-col">
                  <div className="px-6 pt-6 pb-3 border-b border-[#F1EDE7]">
                    <h2 className="text-lg font-semibold tracking-tight text-[#1F1E1D]">Confirm your appointment</h2>
                    <p className="mt-1 text-sm text-[#8A8377]">Review your details and add any notes.</p>
                  </div>
                  <div className="flex-1 p-6 space-y-5 overflow-y-auto">
                    {/* Summary inline for mobile before aside */}
                    {selectedService && selectedSlot && (
                      <div className="lg:hidden rounded-lg border border-[#E5DDD0] bg-[#FDF9F3] p-4 space-y-2">
                        <p className="text-sm font-semibold text-[#1F1E1D]">{selectedService.name}</p>
                        <p className="text-xs text-[#4A4640]">
                          {formatDateLabel(selectedSlot.start)} · {selectedStaffName}
                        </p>
                        <p className="text-sm font-semibold text-[#1F1E1D]">Total {formatPrice(selectedService.price)}</p>
                      </div>
                    )}

                    {!selectedSlot || !selectedService ? (
                      <div className="rounded-lg border border-[#FDECEC] bg-[#FDECEC] p-4 flex gap-2 text-sm text-[#B91C1C]">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> Please go back and complete service and time selection.
                      </div>
                    ) : (
                      <>
                        <div className="rounded-lg border border-[#E5DDD0] bg-white p-4 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-[#1F1E1D]">{selectedService!.name}</p>
                              <p className="mt-1 text-xs text-[#8A8377]">
                                {selectedService!.duration} min · {selectedStaffName}
                              </p>
                              <p className="mt-1 text-xs text-[#4A4640]">{formatDateLabel(selectedSlot!.start)}</p>
                            </div>
                            <span className="text-sm font-semibold text-[#1F1E1D]">{formatPrice(selectedService!.price)}</span>
                          </div>
                        </div>

                        <div className="rounded-lg border border-[#E5DDD0] bg-[#FDF9F3] p-4">
                          <h3 className="text-sm font-semibold text-[#1F1E1D]">Cancellation policy</h3>
                          <p className="mt-1 text-sm leading-relaxed text-[#4A4640]">{CANCELLATION_POLICY}</p>
                        </div>

                        {business?.description && (
                          <div className="rounded-lg border border-[#E5DDD0] bg-white p-4">
                            <h3 className="text-sm font-semibold text-[#1F1E1D]">Important information</h3>
                            <p className="mt-1 text-sm leading-relaxed text-[#4A4640] whitespace-pre-wrap">{business.description}</p>
                          </div>
                        )}

                        <div>
                          <label htmlFor="wizard-notes" className="text-sm font-medium text-[#1F1E1D]">
                            Comments or requests <span className="text-[#8A8377] font-normal">(optional)</span>
                          </label>
                          <textarea
                            id="wizard-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            maxLength={1000}
                            placeholder="Anything the salon should know?"
                            className="mt-2 flex w-full rounded-md border border-[#E5DDD0] bg-[#FDF9F3] px-3 py-2 text-sm text-[#1F1E1D] placeholder:text-[#8A8377] focus:outline-none focus:border-[#1F1E1D] focus:ring-1 focus:ring-[#1F1E1D]"
                          />
                          <p className="mt-1 text-xs text-[#8A8377] text-right">{notes.length}/1000</p>
                        </div>

                        {submitError && (
                          <p className="text-sm text-[#B91C1C] flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4 shrink-0" /> {submitError}
                          </p>
                        )}

                        {/* Step 4: sign-in gate — render before the confirm button,
                            never a dead-end error after clicking it. */}
                        {sessionStatus !== "loading" && !isCustomer && (
                          <div className="rounded-xl border border-[#E5DDD0] bg-[#F7F3ED] p-4 text-center">
                            <p className="text-sm font-medium text-[#1F1E1D]">Sign in to confirm your booking</p>
                            <p className="mt-1 text-xs text-[#8A8377]">Your selection is saved — you&apos;ll come right back here.</p>
                            <div className="mt-3 flex justify-center gap-2">
                              <Link
                                href={`/customer/login?callbackUrl=${encodeURIComponent(currentUrlWithSelection)}`}
                                className="rounded-lg bg-[#795831] px-4 py-2 text-sm font-medium text-white hover:bg-[#5C4326] transition-colors"
                              >
                                Log in
                              </Link>
                              <Link
                                href={`/customer/signup?callbackUrl=${encodeURIComponent(currentUrlWithSelection)}`}
                                className="rounded-lg border border-[#E5DDD0] bg-white px-4 py-2 text-sm font-medium text-[#1F1E1D] hover:bg-[#FDF9F3] transition-colors"
                              >
                                Sign up
                              </Link>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="px-6 py-4 border-t border-[#F1EDE7] flex justify-between gap-3">
                    <Button variant="secondary" onClick={goBack} disabled={submitting}>
                      Back
                    </Button>
                    {sessionStatus === "loading" ? (
                      <Button disabled className="min-w-[160px]">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Checking session...
                      </Button>
                    ) : !isCustomer ? (
                      <Link
                        href={`/customer/login?callbackUrl=${encodeURIComponent(currentUrlWithSelection)}`}
                        className="inline-flex h-10 min-w-[160px] items-center justify-center rounded-md bg-[#795831] px-4 text-sm font-medium text-white hover:bg-[#5C4326] transition-colors"
                      >
                        Sign in to confirm
                      </Link>
                    ) : (
                      <Button onClick={handleConfirm} disabled={submitting || !selectedSlot || !selectedService} className="min-w-[160px]">
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Confirming...
                          </>
                        ) : (
                          "Confirm booking"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: summary panel (live) — screenshots 8–10 right column */}
        <aside className="rounded-xl border border-[#E5DDD0] bg-white shadow-[0_2px_8px_rgba(16,24,40,0.06)] p-6 h-fit lg:sticky lg:top-6">
          {bizLoading ? (
            <div className="flex items-center gap-2 text-sm text-[#8A8377]">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading venue...
            </div>
          ) : business ? (
            <div className="space-y-4">
              <div className="flex gap-3">
                {business.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={business.logoUrl} alt={business.name} className="h-12 w-12 rounded-full object-cover border border-[#E5DDD0] shrink-0" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-[#F7F3ED] border border-[#E5DDD0] flex items-center justify-center shrink-0">
                    <Scissors className="h-5 w-5 text-[#795831]" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight text-[#1F1E1D]">{business.name}</p>
                  {(business.address || business.city || business.district) && (
                    <p className="mt-1 text-xs leading-relaxed text-[#8A8377] flex gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#8A8377]" />
                      <span className="min-w-0">{[business.address, business.city, business.district].filter(Boolean).join(", ") || business.address}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#F1EDE7] space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#8A8377]">Your selection</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-[#4A4640]">Service</span>
                    <span className="font-medium text-[#1F1E1D] text-right">{selectedService ? selectedService.name : "—"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#4A4640]">Professional</span>
                    <span className="font-medium text-[#1F1E1D] text-right">{selectedStaffName}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#4A4640]">Date & time</span>
                    <span className="font-medium text-[#1F1E1D] text-right">{selectedSlot ? formatDateLabel(selectedSlot.start) : "—"}</span>
                  </div>
                </div>
                {notes.trim() && (
                  <div className="rounded-md bg-[#FDF9F3] border border-[#F1EDE7] p-3">
                    <p className="text-xs font-medium text-[#8A8377]">Note</p>
                    <p className="mt-1 text-sm text-[#4A4640] whitespace-pre-wrap">{notes}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#F1EDE7] flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1F1E1D]">Total</span>
                <span className="text-sm font-bold text-[#1F1E1D]">{selectedService ? formatPrice(selectedService.price) : "—"}</span>
              </div>
              <p className="text-xs text-[#8A8377]">
                {isCustomer
                  ? "You are booking as a logged-in customer. Your name and contact will be taken from your account."
                  : "Sign-in is required to confirm — your selection is kept when you return."}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[#8A8377]">Venue not found.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
