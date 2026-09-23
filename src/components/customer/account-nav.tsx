"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, CalendarCheck, ClipboardList, Settings } from "lucide-react";

const items = [
  { href: "/customer/account/profile", label: "Profile", icon: User },
  { href: "/customer/account/activity", label: "Activity", icon: CalendarCheck },
  { href: "/customer/account/forms", label: "Forms", icon: ClipboardList },
  { href: "/customer/account/settings", label: "Settings", icon: Settings },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-[#3a2f22] text-white" : "text-[#475467] hover:bg-[#EFF4FA] hover:text-[#3a2f22]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
