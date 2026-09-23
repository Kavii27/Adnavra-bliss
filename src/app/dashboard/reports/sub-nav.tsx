"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ReportsSubNav({
  links,
}: {
  links: { href: string; label: string; disabled?: boolean }[];
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {links.map(({ href, label, disabled }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        if (disabled) {
          return (
            <span
              key={href}
              className="rounded-lg px-3 py-2 text-sm text-[#6B7280] cursor-not-allowed flex items-center justify-between"
              title="Not available yet"
            >
              {label}
              <span className="text-[10px] uppercase tracking-wide bg-[#f6efe3] px-1.5 py-0.5 rounded">Soon</span>
            </span>
          );
        }
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${active ? "bg-[#f3ebdd] text-[#3a2f22] font-medium" : "text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
