"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SalesSubNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {links.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              active ? "bg-[#FBF7EF] text-[#1F1E1D] font-medium" : "text-[#8A8377] hover:bg-[#FBF7EF] hover:text-[#1F1E1D]"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
