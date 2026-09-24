"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
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
  HelpCircle,
  QrCode,
} from "lucide-react";
import { PLAN_RANK, type Plan } from "@/lib/plan-features";
import { useCurrentPlan } from "@/components/dashboard/plan-context";

type SectionBadge = { label: string; minPlan: Plan };

const SECTIONS: { href: string; label: string; icon: typeof Home; exact?: boolean; badge?: SectionBadge }[] = [
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

function badgeVisible(plan: Plan, minPlan: Plan): boolean {
  return PLAN_RANK[plan] < PLAN_RANK[minPlan];
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const plan = useCurrentPlan();
  return (
    <aside className="hidden md:flex w-16 shrink-0 flex-col items-center border-r border-[#E9E1D3] bg-[#FAF7F2] py-4">
      <Link href="/dashboard" aria-label="ADNAVRA home" className="mb-3 flex h-11 w-11 items-center justify-center">
        <Image src="/logo.png" alt="ADNAVRA logo" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" />
      </Link>
      <nav className="flex flex-1 flex-col items-center gap-1">
        {SECTIONS.map(({ href, label, icon: Icon, exact, badge }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          const showBadge = badge && badgeVisible(plan, badge.minPlan);
          return (
            <Link
              key={href}
              href={href}
              title={showBadge ? `${label} (${badge.label})` : label}
              aria-label={showBadge ? `${label} (${badge.label})` : label}
              className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                active ? "bg-[var(--color-sidebar-active)] text-[#1F1E1D]" : "text-[#8A8377] hover:bg-[#FBF7EF] hover:text-[#1F1E1D]"
              }`}
            >
              <Icon className="h-5 w-5" />
              {showBadge && (
                <span className="absolute -right-1 -top-1 rounded-full bg-[#795831] px-1 text-[8px] font-bold leading-4 text-white">
                  {badge.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/help"
        title="Help"
        aria-label="Help"
        className="flex h-11 w-11 items-center justify-center rounded-xl text-[#8A8377] hover:bg-[#FBF7EF] hover:text-[#1F1E1D]"
      >
        <HelpCircle className="h-5 w-5" />
      </Link>
    </aside>
  );
}
