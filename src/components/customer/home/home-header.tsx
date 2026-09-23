"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, Search } from "lucide-react";

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/categories", label: "Categories" },
  { href: "/locations", label: "Locations" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * Dark marketing navbar used on the homepage only — the whole bar floats
 * as a single rounded pill with margin around it, not just the nav links.
 */
export function HomeHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`sticky top-4 z-50 px-4 lg:px-8 transition-all ${scrolled ? "top-3" : ""}`}
    >
      <header
        className={`mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 rounded-full border border-white/10 bg-[#1F1E1D] px-4 lg:px-6 transition-shadow ${
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
              key={l.label}
              href={l.href}
              className="rounded-full px-4 py-2 text-[13px] font-medium tracking-wide text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="#search"
            aria-label="Search"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/75 transition-colors hover:border-white/30 hover:text-white"
          >
            <Search className="h-4 w-4" />
          </a>
          <Link
            href="/login"
            className="card-lift inline-flex items-center rounded-full bg-[#C9A063] px-4 py-2 text-[13px] font-semibold text-[#1F1E1D] hover:bg-[#D8B27A]"
          >
            Access Portal
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white lg:hidden"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mx-auto mt-2 max-w-[1400px] rounded-2xl border border-white/10 bg-[#1F1E1D] px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-white/85 hover:bg-white/5"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-[#C9A063] px-4 py-2.5 text-sm font-semibold text-[#1F1E1D]"
            >
              Access Portal
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
