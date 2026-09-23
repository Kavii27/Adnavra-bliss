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

  return (
    <div className="min-h-screen bg-[#faf6ef]">
      <nav className="h-16 border-b border-[#E3E8F0] flex items-center px-6 bg-[#3a2f22] text-white">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <Image src="/logo.png" alt="ADNAVRA logo" width={28} height={28} className="h-7 w-7 rounded-md object-contain" />
          <Shield className="h-4 w-4 text-[#f5ead9]" /> ADNAVRA Admin
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm text-[#C4B8B0]">{session.user.email} • ADMIN</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="inline-flex items-center gap-1.5 text-sm text-[#C4B8B0] hover:text-white">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      </nav>
      <div className="max-w-[1200px] mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
