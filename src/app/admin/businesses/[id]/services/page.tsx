import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminBusinessServicesManager } from "@/components/admin/business-services-manager";

/**
 * Admin services page (Task 3.3).
 * Same auth-guard pattern as the images page: layout gates ADMIN,
 * this page double-checks inside (AGENTS.md).
 */
export default async function AdminBusinessServicesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    notFound();
  }

  const business = await db.business.findUnique({
    where: { id },
    select: { id: true, name: true, slug: true },
  });
  if (!business) notFound();

  return (
    <div>
      <Link
        href={`/admin/businesses/${business.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#a89880] hover:text-[#3a2f22]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to {business.name}
      </Link>
      <h1 className="text-xl font-semibold tracking-tight text-[#3a2f22]">Services — {business.name}</h1>
      <p className="mt-1 text-sm text-[#a89880]">
        Manage this salon&apos;s price list without signing in as the owner. Changes appear on the public booking
        page immediately.
      </p>
      <div className="mt-6">
        <AdminBusinessServicesManager businessId={business.id} businessSlug={business.slug} />
      </div>
    </div>
  );
}
