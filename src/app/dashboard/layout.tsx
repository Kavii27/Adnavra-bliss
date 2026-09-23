import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { db } from "@/lib/db";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { PlanProvider } from "@/components/dashboard/plan-context";
import { normalizePlan, type Plan } from "@/lib/plan-features";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Second line of defense: layout re-checks auth even if middleware is bypassed
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const role = (session.user as unknown as { role: string }).role;
  const allowed: string[] = ["OWNER", "STAFF", "ADMIN"];
  if (!allowed.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf6ef] px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-[#3a2f22]">Access denied</h1>
          <p className="mt-2 text-sm text-[#a89880]">
            Dashboard is available to salon owners and staff only. Your role is {role}.
          </p>
          <Link href="/" className="mt-6 inline-flex text-sm font-medium text-[#8a6d4f] hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const businessId = (session.user as unknown as { businessId: string | null }).businessId;
  // Onboarding guardrail: new OWNER/STAFF with no business should create salon profile first
  // ADMIN can view dashboard without a business
  if ((role === "OWNER" || role === "STAFF") && !businessId) {
    const headersList = await headers();
    const pathname =
      headersList.get("x-pathname") ??
      headersList.get("x-next-pathname") ??
      headersList.get("next-url") ??
      "";
    // Avoid redirect loop when already on onboarding/settings
    if (
      !pathname.startsWith("/dashboard/settings") &&
      !pathname.startsWith("/dashboard/onboarding") &&
      !pathname.startsWith("/dashboard/qr-code")
    ) {
      redirect("/dashboard/onboarding");
    }
  }
  const userName = session.user.name ?? session.user.email ?? "User";
  const userInitials = userName
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AD";

  let businessName = "Your business";
  let businessSlug: string | null = null;
  let currentPlan: Plan = "STARTER";
  if (businessId) {
    try {
      const business = await db.business.findUnique({
        where: { id: businessId },
        select: { name: true, slug: true, subscription: { select: { plan: true, status: true } } },
      });
      if (business?.name) businessName = business.name;
      if (business?.slug) businessSlug = business.slug;
      currentPlan =
        business?.subscription?.status === "ACTIVE"
          ? normalizePlan(business.subscription.plan)
          : "STARTER";
    } catch {
      // keep fallback
    }
  }

  return (
    <PlanProvider value={currentPlan}>
    <div className="flex min-h-screen bg-[#faf6ef]">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar businessName={businessName} businessId={businessId} businessSlug={businessSlug} userName={userName} userInitials={userInitials} />
        {/* Mobile nav trigger - visible only on small screens, rendered below topbar */}
        <div className="flex md:hidden items-center px-4 py-2 border-b border-[#e6dcc8] bg-[#faf6ef]">
          <MobileNav />
          <span className="ml-2 text-sm text-[#a89880] truncate">{businessName}</span>
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
    </PlanProvider>
  );
}
