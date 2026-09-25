"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Home,
  Calendar,
  Tag,
  Smile,
  BookOpen,
  Megaphone,
  Users,
  LineChart,
  Grid3x3,
  Settings,
  QrCode,
} from "lucide-react";
import { PLAN_RANK, type Plan } from "@/lib/plan-features";
import { useCurrentPlan } from "@/components/dashboard/plan-context";

const SECTIONS: { href: string; label: string; icon: typeof Home; exact?: boolean; badge?: { label: string; minPlan: Plan } }[] = [
  { href: "/dashboard", label: "Home", icon: Home, exact: true },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/sales", label: "Sales", icon: Tag },
  { href: "/dashboard/clients", label: "Clients", icon: Smile, badge: { label: "PRO", minPlan: "PROFESSIONAL" } },
  { href: "/dashboard/catalog", label: "Catalog", icon: BookOpen, badge: { label: "PRO", minPlan: "PROFESSIONAL" } },
  { href: "/dashboard/marketing", label: "Marketing", icon: Megaphone, badge: { label: "PRO", minPlan: "PROFESSIONAL" } },
  { href: "/dashboard/team", label: "Team", icon: Users, badge: { label: "PRO", minPlan: "PROFESSIONAL" } },
  { href: "/dashboard/reports", label: "Reports", icon: LineChart },
  { href: "/dashboard/apps", label: "Apps", icon: Grid3x3 },
  { href: "/dashboard/qr-code", label: "QR code", icon: QrCode },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const plan = useCurrentPlan();

  return (
    <>
      <button
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
        className="md:hidden flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]"
      >
        <Menu className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="flex-1 bg-black/50"
          />
          <div className="flex max-h-[100dvh] w-[min(20rem,88vw)] shrink-0 flex-col overflow-y-auto overscroll-contain border-l border-[#e6dcc8] bg-[#faf6ef] px-3 py-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-[#3a2f22]">
                <Image src="/logo.png" alt="ADNAVRA logo" width={24} height={24} className="h-6 w-6 rounded-md object-contain" />
                ADNAVRA
              </span>
              <button
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1">
              {SECTIONS.map(({ href, label, icon: Icon, exact, badge }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                const showBadge = badge && PLAN_RANK[plan] < PLAN_RANK[badge.minPlan];
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? "bg-[var(--color-sidebar-active)] text-[#3a2f22]" : "text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1">{label}</span>
                    {showBadge && (
                      <span className="rounded-full bg-[#8a6d4f] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                        {badge.label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
