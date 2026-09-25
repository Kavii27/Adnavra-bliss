import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/onboarding");

  const role = (session.user as unknown as { role: string }).role;
  if (!["OWNER", "STAFF", "ADMIN"].includes(role)) redirect("/");

  return <div className="min-h-screen bg-[#faf6ef]">{children}</div>;
}
