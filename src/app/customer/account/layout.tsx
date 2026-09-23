import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { CustomerHeader } from "@/components/customer/customer-header";
import { AccountNav } from "@/components/customer/account-nav";

export default async function CustomerAccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    const h = await headers();
    const pathname = h.get("x-pathname") ?? "/customer/account";
    redirect(`/customer/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  const role = (session.user as unknown as { role: string }).role;
  if (role !== "CUSTOMER") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf6ef] px-6">
        <div className="max-w-md text-center bg-white rounded-xl border border-[#E3E8F0] p-8">
          <h1 className="text-xl font-semibold text-[#3a2f22]">Access denied</h1>
          <p className="mt-2 text-sm text-[#a89880]">
            This area is for customer accounts only. Your role is {role}.
          </p>
          <Link href="/" className="mt-6 inline-flex text-sm font-medium text-[#8a6d4f] hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const userName = session.user.name ?? session.user.email ?? "Customer";
  const userEmail = session.user.email ?? "";
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#faf6ef]">
      <CustomerHeader />
      <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col lg:flex-row gap-6">
        <aside className="w-full lg:w-[260px] shrink-0">
          <div className="rounded-xl border border-[#E3E8F0] bg-white p-4">
            <div className="flex items-center gap-3 pb-4 border-b border-[#EEF2F7]">
              <div className="h-10 w-10 rounded-full bg-[#f0e6d6] text-[#8a6d4f] flex items-center justify-center text-sm font-semibold">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#3a2f22] truncate">{userName}</p>
                <p className="text-xs text-[#a89880] truncate">{userEmail}</p>
              </div>
            </div>
            <div className="mt-4">
              <AccountNav />
            </div>
            <div className="mt-4 pt-4 border-t border-[#EEF2F7]">
              <form
                action={async () => {
                  "use server";
                   await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#475467] hover:bg-[#EFF4FA] hover:text-[#3a2f22]"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </form>
            </div>
          </div>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
