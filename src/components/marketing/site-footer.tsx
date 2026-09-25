"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { LanguageSwitcher } from "@/components/customer/language-switcher";
import { useLocale } from "@/lib/i18n/locale-context";

const COLUMNS = [
  {
    titleKey: "footer.col.about",
    links: [
      { href: "/about", labelKey: "footer.col.about1" },
      { href: "/contact", labelKey: "footer.col.about2" },
      { href: "/help", labelKey: "footer.col.about3" },
    ],
  },
  {
    titleKey: "footer.col.biz",
    links: [
      { href: "/for-business", labelKey: "footer.col.biz1" },
      { href: "/about#features", labelKey: "footer.col.biz2" },
      { href: "/signup", labelKey: "footer.col.biz3" },
    ],
  },
  {
    titleKey: "footer.col.legal",
    links: [
      { href: "/privacy", labelKey: "footer.col.legal1" },
      { href: "/terms", labelKey: "footer.col.legal2" },
    ],
  },
] as const;

export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="bg-[#f7f3ed] text-[#4a4640] px-6 lg:px-12 py-16 mt-16">
      <div className="max-w-[1400px] mx-auto grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="ADNAVRA BLISS logo" width={32} height={32} className="h-8 w-8 object-contain" />
            <span className="flex items-baseline gap-1.5 whitespace-nowrap leading-none">
              <span className="text-[15px] font-semibold tracking-[0.14em] text-[#050504]">ADNAVRA</span>
              <span className="text-[11px] font-medium tracking-[0.22em] text-[#4a4640]/70">BLISS</span>
            </span>
          </Link>
          <p className="text-sm mt-3 max-w-xs leading-relaxed">
            {t("footer.tagline")}
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
          <div key={col.titleKey}>
            <p className="text-[#050504] text-sm font-semibold">{t(col.titleKey)}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={`${l.href}-${l.labelKey}`}>
                  <Link href={l.href} className="text-sm hover:text-[#050504] transition-colors">
                    {t(l.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="max-w-[1400px] mx-auto border-t border-[#ccc6bd]/40 mt-10 pt-6 text-xs text-[#7b766f] flex flex-wrap items-center justify-between gap-3">
        <span>© {new Date().getFullYear()} ADNAVRA (Pvt) Ltd. All rights reserved. Colombo, Sri Lanka.</span>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/login?callbackUrl=/admin" className="hover:text-[#050504] transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
