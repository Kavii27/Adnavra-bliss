import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { BookingWizard } from "@/components/booking/BookingWizard";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ serviceId?: string; staffId?: string; date?: string; slot?: string }>;
}) {
  const { businessSlug } = await params;
  const { serviceId, staffId, date, slot } = await searchParams;

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
    <main className="min-h-screen bg-[#FDF9F3]">
      <nav className="flex h-16 items-center justify-between border-b border-[#E5DDD0] bg-white px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-2" aria-label="ADNAVRA home">
          <Image src="/logo.png" alt="ADNAVRA" width={28} height={28} className="h-7 w-7 rounded-md object-contain" />
          <span className="text-lg font-semibold tracking-tight text-[#1F1E1D]">ADNAVRA</span>
        </Link>
        <Link
          href={`/${businessSlug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4A4640] hover:text-[#1F1E1D]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to venue
        </Link>
      </nav>
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-12 lg:py-10">
        <BookingWizard
          businessSlug={businessSlug}
          initialServiceId={serviceId}
          initialStaffId={staffId}
          initialDate={date}
          initialSlotStart={slot}
        />
      </div>
    </main>
  );
}
