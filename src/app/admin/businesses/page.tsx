import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, Plus, Store } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { AdminBusinessesSearch } from "@/components/admin/admin-businesses-search";

/**
 * Admin businesses list (Task 3.1).
 * Entry point for admin-run onboarding: table of all salons + "Add salon".
 * Second ADMIN check inside the page per AGENTS.md (layout gates first).
 */
export default async function AdminBusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    notFound();
  }

  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const businesses = await db.business.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
            { city: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      createdAt: true,
      subscription: { select: { plan: true, status: true } },
      users: {
        where: { role: "OWNER" },
        select: { email: true },
        take: 3,
      },
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#3a2f22]">Businesses</h1>
          <p className="mt-1 text-sm text-[#a89880]">
            Every salon on the platform. Open one to finish its setup (profile, services, photos) on the
            owner&apos;s behalf.
          </p>
        </div>
        <Link href="/admin/businesses/new">
          <Button className="bg-[#8a6d4f] text-white hover:bg-[#5f4630]">
            <Plus className="mr-2 h-4 w-4" /> Add salon
          </Button>
        </Link>
      </div>

      <div className="mt-6">
        <Suspense>
          <AdminBusinessesSearch initialQuery={query} />
        </Suspense>
      </div>

      {businesses.length === 0 ? (
        <div className="mt-6 rounded-lg border border-[#E3E8F0] bg-white p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#faf6ef]">
            <Store className="h-5 w-5 text-[#a89880]" />
          </div>
          <p className="mt-3 text-sm font-medium text-[#3a2f22]">
            {query ? `No salons match "${query}"` : "No salons yet"}
          </p>
          <p className="mt-1 text-xs text-[#a89880]">
            {query ? "Try a different search." : "Add your first salon — its owner login is created at the same time."}
          </p>
          {!query && (
            <Link
              href="/admin/businesses/new"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#8a6d4f] hover:underline"
            >
              Add salon <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-[#E3E8F0] bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#E3E8F0] bg-[#faf6ef] text-xs uppercase tracking-wide text-[#a89880]">
                <th scope="col" className="px-4 py-3 font-semibold">
                  Salon
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  City
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Plan
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Owner
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Created
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => (
                <tr key={b.id} className="border-b border-[#E3E8F0] last:border-0 hover:bg-[#faf6ef]/60">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#3a2f22]">{b.name}</p>
                    <p className="mt-0.5 text-xs text-[#a89880]">/{b.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-[#475467]">{b.city ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-[#E7ECF2] px-2 py-0.5 text-[11px] font-semibold text-[#3a2f22]">
                      {b.subscription ? b.subscription.plan.charAt(0) + b.subscription.plan.slice(1).toLowerCase() : "No plan"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#475467]">
                    {b.users.length > 0 ? b.users.map((u) => u.email).join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3 text-[#475467]">
                    {new Date(b.createdAt).toLocaleDateString("en-LK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/businesses/${b.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-[#8a6d4f] hover:underline"
                    >
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
