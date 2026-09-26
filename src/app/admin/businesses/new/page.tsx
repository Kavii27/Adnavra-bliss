import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { CreateBusinessForm } from "@/components/admin/create-business-form";

/**
 * Admin "Add salon" page (Task 3.2 entry point).
 * Hosts the create-business form that provisions the Business row
 * plus the owner's login in one step.
 */
export default async function AdminNewBusinessPage() {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    notFound();
  }

  return (
    <div>
      <Link
        href="/admin/businesses"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#a89880] hover:text-[#3a2f22]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to businesses
      </Link>
      <h1 className="text-xl font-semibold tracking-tight text-[#3a2f22]">Add salon</h1>
      <p className="mt-1 max-w-2xl text-sm text-[#a89880]">
        Create the salon profile and its owner login together. After creating, open the salon detail page to add
        services, photos, and salon-type tags. The owner doesn&apos;t need to touch anything.
      </p>
      <div className="mt-6 max-w-2xl">
        <CreateBusinessForm />
      </div>
    </div>
  );
}
