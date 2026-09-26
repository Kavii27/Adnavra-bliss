import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";
import { db } from "@/lib/db";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { PlanProvider } from "@/components/dashboard/plan-context";
import { normalizePlan, type Plan } from "@/lib/plan-features";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

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
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-[#1F1E1D]">Access denied</h1>
          <p className="mt-2 text-sm text-[#8A8377]">
            Dashboard is available to salon owners and staff only. Your role is {role}.
          </p>
          <Link href="/" className="mt-6 inline-flex text-sm font-medium text-[#795831] hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const businessId = (session.user as unknown as { businessId: string | null }).businessId;

  // Forced password change (Phase 11): admin-created accounts carry
  // mustChangePassword=true until the owner sets their own password.
  // Read the DB as source of truth so a token minted before the flag
  // existed (or before it was cleared) can never bypass or stick the gate.
  const userId = (session.user as unknown as { id?: string }).id;
  let mustChangePassword = Boolean(
    (session.user as unknown as { mustChangePassword?: boolean }).mustChangePassword,
  );
  if (userId) {
    try {
      const fresh = await db.user.findUnique({
        where: { id: userId },
        select: { mustChangePassword: true },
      });
      if (fresh) mustChangePassword = fresh.mustChangePassword;
    } catch {
      // keep session value on DB error
    }
  }

  // The change-password page itself lives under /dashboard/*, so it must
  // be allowlisted — otherwise the gate below would replace the form with
  // another "go set your password" prompt pointing at itself (infinite loop).
  const headersForGate = await headers();
  const gatePathname =
    headersForGate.get("x-pathname") ??
    headersForGate.get("x-next-pathname") ??
    headersForGate.get("next-url") ??
    "";
  const isChangePasswordRoute = gatePathname.startsWith("/dashboard/change-password");

  if (mustChangePassword && !isChangePasswordRoute) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#faf6ef] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-[#E3E8F0] bg-white p-6 text-center">
          <p className="text-sm text-[#3a2f22]">You need to set your own password before continuing.</p>
          <a
            href="/dashboard/change-password"
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-[linear-gradient(135deg,#3a2f22_0%,#8a6d4f_100%)] text-sm font-semibold text-white"
          >
            Set password
          </a>
        </div>
      </div>
    );
  }

  if (mustChangePassword && isChangePasswordRoute) {
    // Render the form full-screen, without sidebar/topbar chrome, so the
    // owner sees only the password step until it is completed.
    return <>{children}</>;
  }

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
    <div className={`${display.variable} flex min-h-screen bg-[#FAF7F2]`}>
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar businessName={businessName} businessId={businessId} businessSlug={businessSlug} userName={userName} userInitials={userInitials} />
        {/* Mobile nav trigger - visible only on small screens, rendered below topbar */}
        <div className="flex md:hidden items-center px-4 py-2 border-b border-[#E9E1D3] bg-[#FAF7F2]">
          <MobileNav />
          <span className="ml-2 text-sm text-[#8A8377] truncate">{businessName}</span>
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
    </PlanProvider>
  );
}
