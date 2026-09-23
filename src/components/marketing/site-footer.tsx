import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Linkedin } from "lucide-react";

const COLUMNS = [
  {
    title: "About",
    links: [
      { href: "/about", label: "About ADNAVRA" },
      { href: "/contact", label: "Contact us" },
      { href: "/contact", label: "Help and support" },
    ],
  },
  {
    title: "For business",
    links: [
      { href: "/for-business", label: "For salons" },
      { href: "/about#features", label: "Features" },
      { href: "/signup", label: "Get started" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#f7f3ed] text-[#4a4640] px-6 lg:px-12 py-16 mt-16">
      <div className="max-w-[1200px] mx-auto grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="ADNAVRA BLISS logo" width={32} height={32} className="h-8 w-8 object-contain" />
            <span className="flex items-baseline gap-1.5 whitespace-nowrap leading-none">
              <span className="text-[15px] font-semibold tracking-[0.14em] text-[#050504]">ADNAVRA</span>
              <span className="text-[11px] font-medium tracking-[0.22em] text-[#4a4640]/70">BLISS</span>
            </span>
          </Link>
          <p className="text-sm mt-3 max-w-xs leading-relaxed">
            Booking infrastructure and a digital presence for Sri Lankan salons and beauty businesses.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <a href="#" aria-label="Facebook" className="hover:text-[#050504] transition-colors">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Instagram" className="hover:text-[#050504] transition-colors">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="LinkedIn" className="hover:text-[#050504] transition-colors">
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-[#050504] text-sm font-semibold">{col.title}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm hover:text-[#050504] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-[1200px] mx-auto border-t border-[#ccc6bd]/40 mt-10 pt-6 text-xs text-[#7b766f] flex items-center justify-between">
        <span>© {new Date().getFullYear()} ADNAVRA. All rights reserved. Colombo, Sri Lanka.</span>
        <Link href="/login?callbackUrl=/admin" className="hover:text-[#050504] transition-colors">
          Admin
        </Link>
      </div>
    </footer>
  );
}
