import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminBusinessProfileForm } from "@/components/admin/admin-business-profile-form";

/**
 * Admin business detail page (Task 3.1).
 * Tabs: Profile (edit inline) · Services (dedicated manager) ·
 * Photos (existing images manager). Second ADMIN check inside the
 * page per AGENTS.md — never rely on the layout alone.
 */
export default async function AdminBusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    notFound();
  }

  const business = await db.business.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      phone: true,
      email: true,
      address: true,
      city: true,
      district: true,
      categories: true,
      salonTypes: true,
      subscription: { select: { plan: true, status: true } },
      users: { where: { role: "OWNER" }, select: { email: true, name: true } },
      _count: { select: { services: true, images: true } },
    },
  });
  if (!business) notFound();

  const owner = business.users[0] ?? null;

  return (
    <div>
      <Link
        href="/admin/businesses"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#a89880] hover:text-[#3a2f22]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to businesses
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#3a2f22]">{business.name}</h1>
          <p className="mt-1 text-sm text-[#a89880]">
            /{business.slug}
            {business.city ? ` • ${business.city}` : ""}
            {owner ? ` • Owner: ${owner.email}` : " • No owner linked"}
            {" • "}
            {business.subscription
              ? `${business.subscription.plan.charAt(0) + business.subscription.plan.slice(1).toLowerCase()} (${business.subscription.status.charAt(0) + business.subscription.status.slice(1).toLowerCase()})`
              : "No plan"}
          </p>
        </div>
        <a
          href={`/${business.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8a6d4f] hover:underline"
        >
          View public page <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Tab cards — Profile edits inline, Services/Photos link to their managers */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[#8a6d4f] bg-white p-4">
          <p className="text-sm font-semibold text-[#3a2f22]">Profile</p>
          <p className="mt-0.5 text-xs text-[#a89880]">Name, contact, address, salon-type tags. Edit below.</p>
        </div>
        <Link
          href={`/admin/businesses/${business.id}/services`}
          className="group rounded-lg border border-[#E3E8F0] bg-white p-4 transition hover:border-[#8a6d4f]"
        >
          <p className="flex items-center gap-1 text-sm font-semibold text-[#3a2f22]">
            Services
            <ArrowRight className="h-3.5 w-3.5 text-[#a89880] transition group-hover:translate-x-0.5 group-hover:text-[#8a6d4f]" />
          </p>
          <p className="mt-0.5 text-xs text-[#a89880]">
            {business._count.services} service{business._count.services === 1 ? "" : "s"} — add prices on the
            owner&apos;s behalf.
          </p>
        </Link>
        <Link
          href={`/admin/businesses/${business.id}/images`}
          className="group rounded-lg border border-[#E3E8F0] bg-white p-4 transition hover:border-[#8a6d4f]"
        >
          <p className="flex items-center gap-1 text-sm font-semibold text-[#3a2f22]">
            Photos
            <ArrowRight className="h-3.5 w-3.5 text-[#a89880] transition group-hover:translate-x-0.5 group-hover:text-[#8a6d4f]" />
          </p>
          <p className="mt-0.5 text-xs text-[#a89880]">
            {business._count.images} photo{business._count.images === 1 ? "" : "s"} — logo, cover, gallery.
          </p>
        </Link>
      </div>

      <div className="mt-6">
        <AdminBusinessProfileForm
          businessId={business.id}
          initial={{
            name: business.name ?? "",
            slug: business.slug ?? "",
            description: business.description ?? "",
            phone: business.phone ?? "",
            email: business.email ?? "",
            address: business.address ?? "",
            city: business.city ?? "",
            district: business.district ?? "",
            categories: business.categories ?? [],
            salonTypes: business.salonTypes ?? [],
          }}
        />
      </div>
    </div>
  );
}
