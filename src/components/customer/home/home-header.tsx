"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/customer/language-switcher";
import { useLocale } from "@/lib/i18n/locale-context";

const NAV_LINKS = [
  { href: "/", key: "nav.home" },
  { href: "/about", key: "nav.about" },
  { href: "/locations", key: "nav.locations" },
  { href: "/contact", key: "nav.contact" },
] as const;

/**
 * Dark marketing navbar used on the homepage only — the whole bar floats
 * as a single rounded pill with margin around it, not just the nav links.
 */
export function HomeHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Spacer — reserves the pill's in-flow space now that the bar below
          is fixed. pt-4 + h-16 mirrors the floating pill geometry exactly,
          so page content never jumps or slides underneath it. */}
      <div aria-hidden className="px-4 pt-4 lg:px-8">
        <div className="mx-auto h-16 max-w-[1600px]" />
      </div>
      <div
        className={`fixed inset-x-0 top-4 z-50 px-4 lg:px-8 transition-all ${scrolled ? "top-3" : ""}`}
      >
      <header
        className={`mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 rounded-full border border-white/10 bg-[#2A1D12] px-4 lg:px-6 transition-shadow ${
          scrolled ? "shadow-[0_8px_30px_rgba(0,0,0,0.35)]" : "shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="ADNAVRA BLISS logo"
            width={28}
            height={28}
            className="h-7 w-7 rounded-md object-contain"
          />
          <span className="flex items-baseline gap-1.5 whitespace-nowrap leading-none">
            <span className="text-[15px] font-semibold tracking-[0.14em] text-white">ADNAVRA</span>
            <span className="text-[11px] font-medium tracking-[0.22em] text-white/50">BLISS</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className="rounded-full px-4 py-2 text-[13px] font-medium tracking-wide text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher dark />
          <Link
            href="/login"
            className="card-lift inline-flex items-center rounded-full bg-[#C9A063] px-4 py-2 text-[13px] font-semibold text-[#2A1D12] hover:bg-[#D8B27A]"
          >
            Access Portal
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white lg:hidden"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </header>

      {/* Backdrop — blurs and dims the whole page behind the open mobile menu.
          -z-10 keeps it inside this z-50 stacking context, so it sits above the
          page but behind the pill and the menu panel. */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={-1}
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 -z-10 h-dvh w-screen cursor-default bg-[#1B1714]/45 backdrop-blur-md lg:hidden"
        />
      )}

      {/* Mobile menu — original layout: plain left-aligned link list plus the
          Access Portal pill. Language switcher lives here so it is mobile-only
          (the desktop cluster has its own). max-h/overflow kept as a safety
          net for tall Sinhala labels. */}
      {mobileOpen && (
        <div className="mx-auto mt-2 max-w-[1600px] rounded-2xl border border-white/10 bg-[#2A1D12] px-6 py-4 lg:hidden max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-white/85 hover:bg-white/5"
              >
                {t(l.key)}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-[#C9A063] px-4 py-2.5 text-sm font-semibold text-[#2A1D12]"
            >
              Access Portal
            </Link>
            <div className="mt-1 flex justify-center py-1">
              <LanguageSwitcher dark />
            </div>
          </nav>
        </div>
      )}
      </div>
    </>
  );
}

