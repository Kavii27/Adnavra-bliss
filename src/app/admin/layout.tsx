import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { Shield, LogOut } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  const role = (session.user as unknown as { role: string }).role;
  if (role !== "ADMIN") {
    // AGENTS.md: admin routes reject non-admin with 403, not a redirect that leaks data first.
    // We render a 403 inline. No redirect.
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf6ef] px-6">
        <div className="max-w-md rounded-lg border border-[#E3E8F0] bg-white p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f5ead9]">
            <Shield className="h-5 w-5 text-[#8a6d4f]" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-[#3a2f22]">Forbidden. Admin only</h1>
          <p className="mt-2 text-sm text-[#a89880]">Your account does not have platform admin privileges.</p>
          <Link href="/dashboard" className="mt-6 inline-flex text-sm font-medium text-[#8a6d4f] hover:underline">
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const initials = (session.user.name ?? session.user.email ?? "A").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-[#faf6ef]">
      <nav className="flex h-16 items-center gap-2 overflow-hidden bg-[linear-gradient(135deg,#3a2f22_0%,#5f4630_55%,#8a6d4f_100%)] px-4 text-white shadow-[0_1px_2px_rgba(58,47,34,0.10),0_4px_16px_rgba(58,47,34,0.18)] sm:px-6">
        <Link href="/admin" className="flex min-w-0 shrink items-center gap-2 font-semibold tracking-tight sm:gap-2.5">
          <Image
            src="/logo.png"
            alt="ADNAVRA logo"
            width={30}
            height={30}
            className="h-7 w-7 shrink-0 rounded-lg object-contain ring-1 ring-white/20 sm:h-[30px] sm:w-[30px]"
          />
          <span className="flex min-w-0 items-center gap-1.5">
            <Shield className="h-4 w-4 shrink-0 text-[#c9a26d]" />
            <span className="truncate">ADNAVRA</span>
            <span className="ml-1 hidden shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium tracking-wide text-[#f5ead9] md:inline-flex">
              Platform Console
            </span>
          </span>
        </Link>
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-1 sm:pr-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#c9a26d] text-[11px] font-semibold text-[#3a2f22]">
              {initials}
            </span>
            <span className="hidden max-w-[160px] truncate text-xs font-medium text-[#f0e6d6] sm:inline">
              {session.user.email}
            </span>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm text-[#C4B8B0] transition hover:bg-white/10 hover:text-white sm:px-3"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </nav>
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-8 sm:py-8">{children}</div>
    </div>
  );
}
