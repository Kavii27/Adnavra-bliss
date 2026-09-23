"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, MapPin, Building2, X } from "lucide-react";
import type { SriLankaLocation } from "@/lib/sri-lanka-locations";
import { DISTRICT_TO_PROVINCE, PROVINCE_ORDER } from "@/lib/district-province";
import { Reveal } from "./reveal";

// Town -> live business count, e.g. { Colombo: 42, Kandy: 11 }. Pass {} if not available yet.
type CityCounts = Record<string, number>;

function cityHref(t: SriLankaLocation) {
  return `/customer/search?location=${encodeURIComponent(t.name)}&lat=${t.lat}&lng=${t.lng}`;
}

function groupByProvince(locations: SriLankaLocation[]) {
  const map = new Map<string, SriLankaLocation[]>();
  for (const loc of locations) {
    const province = DISTRICT_TO_PROVINCE[loc.district] ?? "Other";
    const arr = map.get(province) ?? [];
    arr.push(loc);
    map.set(province, arr);
  }
  // Keep a stable, sensible province order; largest towns first within each.
  return PROVINCE_ORDER.filter((p) => map.has(p)).map((p) => [p, map.get(p)!] as const);
}

export function BrowseByCity({
  locations,
  counts = {},
}: {
  locations: SriLankaLocation[];
  counts?: CityCounts;
}) {
  const grouped = useMemo(() => groupByProvince(locations), [locations]);
  const [activeProvince, setActiveProvince] = useState(grouped[0]?.[0] ?? "");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  const activeTowns = grouped.find(([p]) => p === activeProvince)?.[1] ?? [];

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return locations
      .filter((l) => l.name.toLowerCase().includes(q) || l.district.toLowerCase().includes(q))
      .slice(0, 10);
  }, [query, locations]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <section id="locations" className="px-6 lg:px-12 py-10 max-w-[1200px] mx-auto scroll-mt-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#795831]">All locations</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#1F1E1D]">
            Explore salons across Sri Lanka
          </h2>
          <p className="mt-1 text-sm text-[#8A8377]">
            Find trusted salons and spas across your favorite towns and neighborhoods.
          </p>
        </div>

        {/* Search overlay trigger */}
        <div ref={searchRef} className="relative w-full sm:w-72">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8377]" />
            <input
              type="text"
              value={query}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              placeholder="Search any town…"
              className="w-full rounded-full border border-[#E5DDD0] bg-white pl-9 pr-9 py-2.5 text-sm text-[#1F1E1D] placeholder:text-[#B3ACA0] outline-none focus:border-[#795831] focus:ring-2 focus:ring-[#795831]/15 transition"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSearchOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B3ACA0] hover:text-[#4A4640]"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {searchOpen && query && (
            <div className="absolute z-20 mt-2 w-full rounded-xl border border-[#E5DDD0] bg-white shadow-lg overflow-hidden">
              {searchResults.length > 0 ? (
                <ul className="max-h-72 overflow-y-auto py-1">
                  {searchResults.map((t) => (
                    <li key={`${t.district}-${t.name}`}>
                      <Link
                        href={cityHref(t)}
                        className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm hover:bg-[#F7F3ED] transition"
                      >
                        <span className="flex items-center gap-2 text-[#1F1E1D]">
                          <MapPin className="h-3.5 w-3.5 text-[#B3ACA0]" />
                          {t.name}
                        </span>
                        <span className="text-xs text-[#B3ACA0]">{t.district}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-3 text-sm text-[#8A8377]">No towns match &ldquo;{query}&rdquo;.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Province tabs */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {grouped.map(([province, towns]) => (
          <button
            key={province}
            type="button"
            onClick={() => setActiveProvince(province)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition border ${
              activeProvince === province
                ? "bg-[#795831] border-[#795831] text-white"
                : "bg-white border-[#E5DDD0] text-[#4A4640] hover:border-[#795831] hover:text-[#795831]"
            }`}
          >
            {province}
            <span className={`ml-1.5 text-xs ${activeProvince === province ? "text-white/70" : "text-[#B3ACA0]"}`}>
              {towns.length}
            </span>
          </button>
        ))}
      </div>

      {/* City card grid for the active province */}
      <Reveal className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 reveal-stagger">
        {activeTowns.map((t) => {
          const count = counts[t.name];
          return (
            <Link
              key={t.name}
              href={cityHref(t)}
              className="group card-lift rounded-xl border border-[#E5DDD0] bg-white p-4 hover:border-[#795831]"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F3ED] text-[#795831] group-hover:bg-[#795831] group-hover:text-white transition">
                  <MapPin className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-[#1F1E1D]">{t.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-[#8A8377]">
                <Building2 className="h-3 w-3" />
                {typeof count === "number" ? `${count} salon${count === 1 ? "" : "s"}` : t.district}
              </p>
            </Link>
          );
        })}
      </Reveal>
    </section>
  );
}
