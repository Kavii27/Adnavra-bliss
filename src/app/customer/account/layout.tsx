import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { Cormorant_Garamond } from "next/font/google";
import { LogOut } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { AccountNav } from "@/components/customer/account-nav";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

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
    <div className={`${display.variable} min-h-screen bg-[#FAF7F2]`}>
      {/* `fixed` (not `sticky`) so the header is unconditionally pinned to the viewport and can
          never move, jump, or drift on scroll — same reasoning as the sidebar below. The spacer
          right after it reserves its h-16 (64px) in normal flow so content doesn't render underneath. */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-[#E9E1D3] bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-2" aria-label="ADNAVRA BLISS home">
          <Image src="/logo.png" alt="ADNAVRA BLISS" width={28} height={28} className="h-7 w-7 shrink-0 rounded-md object-contain" />
          <span className="text-base font-semibold tracking-tight text-[#1F1E1D] sm:text-lg">
            ADNAVRA <span className="font-normal text-[#795831]">BLISS</span>
          </span>
        </Link>
        <Link
          href="/customer/search"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E9E1D3] px-4 py-1.5 text-[13px] font-medium text-[#4A4640] transition-colors hover:bg-[#F7F3ED] hover:text-[#1F1E1D]"
        >
          Discover salons
        </Link>
      </header>
      <div className="h-16" aria-hidden="true" />

      {/* Sidebar is truly `fixed` at lg+ (not `sticky`) so it is always fully visible while
          scrolling a long activity list, never drifting or getting cut off at the viewport edge.
          top-24 clears the sticky header (h-16 + breathing room); bottom-6 + overflow-y-auto is a
          safety net for short viewports. `main` gets a matching left margin since the fixed
          sidebar no longer reserves space via flex. On mobile it stays a normal in-flow block. */}
      <div className="flex w-full flex-col gap-8 px-4 py-8 sm:px-6 lg:px-12 lg:py-12">
        <aside className="w-full shrink-0 lg:fixed lg:left-12 lg:top-24 lg:bottom-6 lg:w-[340px] lg:overflow-y-auto">
          <div className="overflow-hidden rounded-3xl border border-[#C9A467]/30 bg-white shadow-[0_12px_40px_rgba(120,88,49,0.18)]">
            <div
              className="flex flex-col items-center gap-4 p-8 text-center"
              style={{ background: "linear-gradient(160deg, #C9A467 0%, #8A6D4F 55%, #6B4F35 100%)" }}
            >
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-white/40 bg-white text-2xl font-semibold text-[#8A6D4F] shadow-[0_6px_18px_rgba(0,0,0,0.2)]">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-semibold leading-tight text-white">{userName}</p>
                <p className="mt-1 truncate text-xs text-white/75">{userEmail}</p>
              </div>
            </div>
            <div className="p-4">
              <AccountNav />
            </div>
            <div className="border-t border-[#F1EDE7] p-4">
              <form
                action={async () => {
                  "use server";
                   await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-[#8A8377] transition-colors hover:bg-[#FBF7EF] hover:text-[#1F1E1D]"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </form>
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1 lg:ml-[372px]">{children}</main>
      </div>
    </div>
  );
}
