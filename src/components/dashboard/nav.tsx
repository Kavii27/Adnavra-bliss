"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Scissors, Users, Calendar, Settings, UsersRound, QrCode } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Bookings", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/services", label: "Services", icon: Scissors },
  { href: "/dashboard/staff", label: "Staff", icon: UsersRound },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/qr-code", label: "QR code", icon: QrCode },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();
  return (
    <div className="border-b border-[#E3E8F0] bg-white">
      <nav className="max-w-[1200px] mx-auto px-6 flex gap-1 overflow-x-auto py-2">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                active
                  ? "bg-[#3a2f22] text-[#3a2f22]"
                  : "text-[#475467] hover:bg-[#EFF4FA] hover:text-[#3a2f22] border border-transparent"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
