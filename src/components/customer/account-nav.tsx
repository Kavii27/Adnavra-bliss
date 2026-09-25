"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, CalendarCheck, ClipboardList, Settings } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

const items = [
  { href: "/customer/account/profile", labelKey: "account.profile", icon: User },
  { href: "/customer/account/activity", labelKey: "account.activity", icon: CalendarCheck },
  { href: "/customer/account/forms", labelKey: "account.forms", icon: ClipboardList },
  { href: "/customer/account/settings", labelKey: "account.settings", icon: Settings },
];

export function AccountNav() {
  const { t } = useLocale();
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {items.map(({ href, labelKey, icon: Icon }) => {
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
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
