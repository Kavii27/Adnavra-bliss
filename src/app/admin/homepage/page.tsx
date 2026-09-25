import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowLeft, LayoutTemplate } from "lucide-react";
import { HomepageBannerManager } from "@/components/admin/homepage-banner-manager";
import { auth } from "@/lib/auth";
import { getHomepageBannerSetting } from "@/lib/platform-settings";
import type { HomepageBannerSetting } from "@/schemas/platformSettings";

export default async function AdminHomepagePage() {
  const session = await auth();
  const role = (session?.user as unknown as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") notFound();

  let initialSetting: HomepageBannerSetting | null = null;
  let loadError = false;
  try {
    initialSetting = (await getHomepageBannerSetting()).banner;
  } catch {
    loadError = true;
  }

  return (
    <div>
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#a89880] hover:text-[#3a2f22]">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to platform console
      </Link>

      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3F2] text-[#8a6d4f]">
          <LayoutTemplate className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-[#3a2f22]">Homepage banner</h1>
          <p className="mt-0.5 text-sm text-[#a89880]">Update the live banner image and destination without a deploy.</p>
        </div>
      </div>

      <div className="mt-8">
        {loadError || !initialSetting ? (
          <div className="flex items-center gap-2 rounded-xl border border-[#FDECEC] bg-[#FDECEC] p-4 text-sm font-medium text-[#B91C1C]">
            <AlertCircle className="h-4 w-4 shrink-0" /> Could not load the homepage banner. Please try again.
          </div>
        ) : (
          <HomepageBannerManager initialSetting={initialSetting} />
        )}
      </div>
    </div>
  );
}
