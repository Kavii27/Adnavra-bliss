"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, AlertCircle, X } from "lucide-react";

type StaffOption = { id: string; name: string };
type ServiceOption = { id: string; name: string; duration: number; price: number };

type AddBookingModalProps = {
  businessId: string;
  staff: StaffOption[];
  defaultDate: string;
  onClose: () => void;
  onCreated: () => void;
};

const inputClass =
  "min-h-11 w-full rounded-lg border border-[#e6dcc8] bg-white px-3 py-2 text-sm text-[#3a2f22] placeholder:text-[#a89880] focus:outline-none focus:ring-2 focus:ring-[var(--color-sidebar-active)]";
const labelClass = "mb-1 block text-xs font-medium text-[#3a2f22]";

/**
 * Manual booking entry for staff (walk-ins / phone bookings).
 * POSTs to the existing /api/bookings endpoint with the staff session —
 * customer name + phone are required since this is never a CUSTOMER session.
 */
export function AddBookingModal({ businessId, staff, defaultDate, onClose, onCreated }: AddBookingModalProps) {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [serviceId, setServiceId] = useState("");
  const [staffMemberId, setStaffMemberId] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("09:00");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadServices() {
      setServicesLoading(true);
      try {
        const r = await fetch(`/api/services?businessId=${businessId}&limit=100`);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Failed to load services");
        if (!cancelled) {
          const list: ServiceOption[] = Array.isArray(j.data) ? j.data : [];
          setServices(list);
          if (list.length > 0) setServiceId((prev) => prev || list[0].id);
        }
      } catch (e: unknown) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setServicesLoading(false);
      }
    }
    loadServices();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!serviceId) {
      setError("Choose a service.");
      return;
    }
    if (!customerName.trim()) {
      setError("Customer name is required.");
      return;
    }
    if (!customerPhone.trim()) {
      setError("Customer phone is required.");
      return;
    }
    if (!date || !time) {
      setError("Pick a date and time.");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          serviceId,
          staffMemberId: staffMemberId || null,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          startAt: new Date(`${date}T${time}:00`).toISOString(),
          notes: notes.trim() || null,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed to create booking");
      onCreated();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Add booking"
    >
      <div
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-2xl border border-[#e6dcc8] bg-[#faf6ef] p-4 sm:rounded-xl sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#3a2f22]">Add booking</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-xs text-[#a89880]">Walk-in or phone booking — added to the calendar immediately.</p>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {servicesLoading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-[#a89880]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading services...
          </div>
        ) : services.length === 0 && !error ? (
          <div className="mt-6 rounded-lg border border-[#e6dcc8] bg-[#f6efe3] p-4 text-center">
            <p className="text-sm font-medium text-[#3a2f22]">No services yet</p>
            <p className="mt-1 text-xs text-[#a89880]">Add a service in Settings before creating manual bookings.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
            <div>
              <label htmlFor="ab-service" className={labelClass}>Service</label>
              <select id="ab-service" value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={inputClass}>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ab-staff" className={labelClass}>Team member</label>
              <select id="ab-staff" value={staffMemberId} onChange={(e) => setStaffMemberId(e.target.value)} className={inputClass}>
                <option value="">Unassigned</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ab-date" className={labelClass}>Date</label>
                <input id="ab-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="ab-time" className={labelClass}>Time</label>
                <input id="ab-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label htmlFor="ab-name" className={labelClass}>Customer name</label>
              <input
                id="ab-name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in customer"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="ab-phone" className={labelClass}>Customer phone</label>
              <input
                id="ab-phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="ab-notes" className={labelClass}>Notes (optional)</label>
              <input
                id="ab-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything staff should know"
                className={inputClass}
              />
            </div>
            <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#e6dcc8] bg-[#f6efe3] px-4 py-2 text-sm font-medium text-[#3a2f22] hover:bg-[#f3ebdd] sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-sidebar-active)] px-4 py-2 text-sm font-semibold text-[#3a2f22] hover:opacity-90 disabled:opacity-50 sm:w-auto"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : "Create booking"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
