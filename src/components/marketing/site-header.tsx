"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { MenuDropdown } from "./menu-dropdown";
import { useLocale } from "@/lib/i18n/locale-context";

const NAV_LINKS = [{ href: "/about", labelKey: "mkt.header.about" }];

export function SiteHeader() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // NOTE: no background / decorative shape on the header itself while at
    // the top of the page. The header sits directly on top of the hero
    // section below it, so the hero's own curved image is what shows
    // through on the right — this is what makes the nav + hero read as ONE
    // continuous curve, like the reference. Do not add a separate cream
    // box/ellipse here again, it creates a mismatched seam against the
    // hero's clip-path. Once the user scrolls past the hero, `scrolled`
    // flips the header to a solid cream bar so it stays legible over
    // whatever section is underneath it.
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "bg-[#fdf9f3]/95 backdrop-blur shadow-[0_4px_24px_rgba(23,21,20,0.06)] border-b border-[#ccc6bd]/40"
          : "bg-transparent"
      }`}
    >
      <nav className="relative mx-auto flex h-[82px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" className="relative z-10 flex shrink-0 items-center gap-2">
          <Image
            src="/logo.png"
            alt="ADNAVRA BLISS"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            priority
          />
          <span className="text-[17px] font-semibold tracking-[-0.02em] text-[#171514]">
            ADNAVRA BLISS
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 lg:gap-10">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="relative text-[13px] font-medium text-[#4a4640] transition-colors hover:text-[#171514]"
            >
              {t(l.labelKey)}
            </Link>
          ))}
        </div>

        {/* This right-hand cluster sits directly over the curved hero image
            while scrolled=false (see hero clip-path in page.tsx, which is
            flat/full-width at y=0 from roughly the "For business" link
            onward). Every element here needs its own solid/opaque
            background so it stays legible against the photo behind it —
            never plain text with no bg. Styled with plain Tailwind classes
            rather than a shared Button component, so no external theme
            (e.g. a default blue) can override these colors. */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-white/90 px-4 py-2 text-[13px] font-medium text-[#171514] shadow-sm backdrop-blur hover:bg-white"
          >
            {t("mkt.header.marketplace")}
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center rounded-full bg-[#2A1D12] px-5 text-[13px] font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition-colors hover:bg-[#17100A]"
          >
            {t("mkt.header.signup")}
          </Link>
          <MenuDropdown audience="business" />
        </div>

        <button
          className="relative z-10 rounded-full bg-white/90 p-3 text-[#171514] shadow-sm backdrop-blur md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={t("mkt.header.toggleMenu")}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-[#ccc6bd]/40 bg-[#fdf9f3]/98 px-6 py-5 shadow-lg backdrop-blur">
          <div className="space-y-4">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block text-sm font-medium text-[#4a4640]"
                onClick={() => setOpen(false)}
              >
                {t(l.labelKey)}
              </Link>
            ))}
          </div>

          <div className="mt-5 space-y-3 border-t border-[#ccc6bd]/40 pt-4">
            <Link
              href="/login"
              className="block text-sm font-medium text-[#171514]"
              onClick={() => setOpen(false)}
            >
              {t("mkt.header.loginSignup")}
            </Link>
            <Link
              href="/"
              className="block text-sm font-medium text-[#171514]"
              onClick={() => setOpen(false)}
            >
              {t("mkt.header.marketplace")}
            </Link>
            <Link
              href="/"
              className="flex items-center justify-between text-sm font-semibold text-[#171514]"
              onClick={() => setOpen(false)}
            >
              {t("mkt.header.forCustomers")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
