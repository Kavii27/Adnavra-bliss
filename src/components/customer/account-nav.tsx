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
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "text-white shadow-[0_2px_10px_rgba(120,88,49,0.3)]" : "text-[#4A4640] hover:bg-[#FBF7EF] hover:text-[#1F1E1D]"
            }`}
            style={active ? { background: "linear-gradient(135deg, #C9A467, #8A6D4F)" } : undefined}
          >
            <Icon className="h-4 w-4" style={active ? { color: "#1B1714" } : undefined} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
