"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Menu as MenuIcon, X, ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

type Audience = "business" | "customer";

const BUSINESS_LINKS = [
  { href: "/login", labelKey: "mkt.menu.loginSignup" },
  { href: "/about", labelKey: "mkt.menu.home" },
  { href: "/blog", labelKey: "mkt.menu.blog" },
  { href: "/help", labelKey: "mkt.menu.help" },
];

const CUSTOMER_LINKS = [
  { href: "/customer/login", labelKey: "mkt.menu.loginSignup" },
  { href: "/", labelKey: "mkt.menu.home" },
  { href: "/blog", labelKey: "mkt.menu.blog" },
  { href: "/help", labelKey: "mkt.menu.help" },
];

export function MenuDropdown({ audience }: { audience: Audience }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const links = audience === "business" ? BUSINESS_LINKS : CUSTOMER_LINKS;
  const sectionLabel = audience === "business" ? t("mkt.menu.sectionBusiness") : t("mkt.menu.sectionCustomer");
  const crossHref = audience === "business" ? "/" : "/for-business";
  const crossLabel = audience === "business" ? t("mkt.menu.forCustomers") : t("mkt.menu.forBusiness");

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 h-11 rounded-full border border-[#ccc6bd]/60 px-4 text-sm font-medium text-[#050504] hover:bg-[#f1ede7]"
        aria-expanded={open}
        aria-label={t("mkt.menu.label")}
      >
        {open ? <X className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
        {t("mkt.menu.label")}
      </button>
      {open && (
        <div className="fixed inset-x-0 top-16 z-50 mx-3 rounded-xl border border-[#ccc6bd]/40 bg-[#fdf9f3] shadow-[0_8px_30px_rgba(28,28,24,0.12)] p-2 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:mx-0 sm:w-72 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain">
          <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-[#7b766f] text-center sm:text-left">
            {sectionLabel}
          </p>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-3 sm:py-2 text-center sm:text-left text-[15px] sm:text-sm ${
                l.labelKey === "mkt.menu.loginSignup" ? "font-semibold text-[#795831]" : "text-[#050504] hover:bg-[#f1ede7]"
              }`}
            >
              {t(l.labelKey)}
            </Link>
          ))}
          <div className="mt-1 border-t border-[#ccc6bd]/40 pt-1">
            <Link
              href={crossHref}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center sm:justify-between gap-2 rounded-md px-3 py-3 sm:py-2 text-[15px] sm:text-sm font-semibold text-[#050504] hover:bg-[#f1ede7]"
            >
              {crossLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
