"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ClientsSubNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {links.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
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
