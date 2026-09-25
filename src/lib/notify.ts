import { Resend } from "resend";
import { db } from "@/lib/db";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = "ADNAVRA BLISS <bookings@adnavra.lk>"; // must be a domain verified in Resend
const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://adnavra.lk";

export async function notifyOwnerOfNewBooking({
  businessId,
  reference,
  groupId,
}: {
  businessId: string;
  reference: string;
  groupId: string | null;
}) {
  const business = await db.business.findUnique({
    where: { id: businessId },
    select: { name: true, email: true, slug: true },
  });
  if (!business?.email || !resend) return; // no owner email on file, or Resend not configured — skip silently, don't throw
  await resend.emails.send({
    from: FROM,
    to: business.email,
    subject: `New booking request — ${reference}`,
    html: `<p>You have a new booking request (ref ${reference}) at ${business.name} awaiting your approval.</p>
           <p><a href="${DASHBOARD_URL}/dashboard/sales/appointments?status=PENDING">Review it in your dashboard →</a></p>`,
  });
  void groupId;
}

export async function notifyCustomerOfDecision({
  bookingId,
  status,
}: {
  bookingId: string;
  status: string;
}) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      customer: true,
      business: { select: { name: true, phone: true } },
      service: true,
    },
  });
  if (!booking) return;
  const decided =
    status === "CONFIRMED" ? "confirmed" : status === "CANCELLED" ? "declined" : null;
  if (!decided) return;

  if (booking.customer.email && resend) {
    await resend.emails.send({
      from: FROM,
      to: booking.customer.email,
      subject: `Your booking at ${booking.business.name} was ${decided}`,
      html: `<p>Hi ${booking.customer.name}, your booking (ref ${booking.reference}) at ${booking.business.name} has been <strong>${decided}</strong>.</p>`,
    });
  }
  // WhatsApp — fully automated sending needs the WhatsApp Business API / Twilio
  // (verified number, takes days). MVP: salon staff tap a pre-filled wa.me link
  // in the dashboard approval card to send the confirmation manually.
}

/** Pre-filled WhatsApp deep link for salon staff to confirm manually (no API keys needed). */
export function waMeLink(phone: string | null | undefined, message: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
