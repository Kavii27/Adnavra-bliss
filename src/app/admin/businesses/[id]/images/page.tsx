import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminBusinessImagesManager } from "@/components/admin/business-images-manager";

export default async function AdminBusinessImagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Second check inside the page (AGENTS.md): layout already gates ADMIN,
  // but this page must not depend on middleware/layout alone.
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
      logoUrl: true,
      images: { orderBy: [{ kind: "asc" }, { position: "asc" }, { createdAt: "asc" }] },
    },
  });
  if (!business) notFound();

  return (
    <div>
      <Link
        href="/admin/businesses"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#a89880] hover:text-[#3a2f22] mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to businesses
      </Link>
      <h1 className="text-xl font-semibold tracking-tight text-[#3a2f22]">Photos: {business.name}</h1>
      <p className="mt-1 text-sm text-[#a89880]">
        Replace the logo, cover, or gallery for this salon without signing in as the owner. Minimum 512px wide.
        JPEG, PNG or WebP up to 8MB. Smaller files are rejected.
      </p>
      <div className="mt-6">
        <AdminBusinessImagesManager
          businessId={business.id}
          businessSlug={business.slug}
          initialLogoUrl={business.logoUrl}
          initialImages={business.images}
        />
      </div>
    </div>
  );
}
