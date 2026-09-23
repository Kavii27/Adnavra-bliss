"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { SERVICE_CATEGORIES } from "@/lib/categories";

type Tab = "all" | "treatments" | "venues" | "professionals";

type TreatmentsDropdownProps = {
  value: string | null;
  onChange: (slug: string | null, label: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
};

export function TreatmentsDropdown({ value, onChange, query, onQueryChange }: TreatmentsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("treatments");
  const ref = useRef<HTMLDivElement>(null);

  const activeCategory = SERVICE_CATEGORIES.find((c) => c.slug === value);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function handleSelect(slug: string | null, label: string) {
    onChange(slug, label);
    onQueryChange(slug ? label : "");
    setOpen(false);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "treatments", label: "Treatments" },
    { id: "venues", label: "Venues" },
    { id: "professionals", label: "Professionals" },
  ];

  const isTreatmentsTab = activeTab === "treatments" || activeTab === "all";

  return (
    <div ref={ref} className="relative flex-1 min-w-0 overflow-visible">
      {/* Trigger — controlled text input so customers can type a salon
          name or treatment; picking a category mirrors its label here. */}
      <div
        onClick={() => setOpen(true)}
        className="flex w-full min-w-0 items-center gap-2 px-4 py-2.5 text-left outline-none"
      >
        <Search className="h-4 w-4 shrink-0 text-[#8A8377]" />
        <input
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            onQueryChange(next);
            // Typing free text diverges from the picked category — drop the
            // category filter so the two don't fight over what's active.
            if (value && next !== activeCategory?.label) {
              onChange(null, next);
            }
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search treatments or salons"
          aria-label="Search treatments or salons"
          className="min-w-0 flex-1 truncate bg-transparent text-sm text-[#1F1E1D] outline-none placeholder:text-[#8A8377]"
        />
        {value || query ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear search"
            onMouseDown={(e) => {
              // Clear before the input blurs / form submits.
              e.preventDefault();
              e.stopPropagation();
              handleSelect(null, "All treatments");
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(null, "All treatments");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(null, "All treatments");
              }
            }}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#F7F3ED]"
          >
            <X className="h-3.5 w-3.5 text-[#8A8377]" />
          </span>
        ) : null}
      </div>

      {open ? (
        <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 top-[calc(100%+8px)] z-50 w-[360px] max-w-[min(360px,92vw)] rounded-xl border border-[#E5DDD0] bg-white shadow-[0_8px_30px_rgba(16,24,40,0.12)] overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-[#F1EDE7] px-2 py-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  activeTab === t.id
                    ? "bg-[#1F1E1D] text-white"
                    : "bg-transparent text-[#4A4640] hover:bg-[#F7F3ED]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="max-h-[340px] overflow-y-auto p-2">
            {isTreatmentsTab ? (
              <>
                <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-[#8A8377]">Treatments</p>
                {/* All treatments clear row */}
                <button
                  type="button"
                  onClick={() => handleSelect(null, "All treatments")}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[#F7F3ED] ${
                    value === null ? "bg-[#F7F3ED]" : ""
                  }`}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1EDE7] shrink-0">
                    <Search className="h-4 w-4 text-[#795831]" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-[#1F1E1D]">All treatments</span>
                    <span className="block text-xs text-[#8A8377]">Browse everything</span>
                  </span>
                </button>

                {SERVICE_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = value === cat.slug;
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => handleSelect(cat.slug, cat.label)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[#F7F3ED] ${
                        isActive ? "bg-[#F7F3ED] ring-1 ring-[#E5DDD0]" : ""
                      }`}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1EDE7] shrink-0">
                        <Icon className="h-4 w-4 text-[#795831]" />
                      </span>
                      <span className="flex-1">
                        <span className={`block text-sm ${isActive ? "font-semibold" : "font-medium"} text-[#1F1E1D]`}>
                          {cat.label}
                        </span>
                      </span>
                      {isActive ? <span className="h-2 w-2 rounded-full bg-[#795831]" aria-hidden /> : null}
                    </button>
                  );
                })}
              </>
            ) : activeTab === "venues" ? (
              <div className="px-3 py-6 text-center">
                <p className="text-sm font-medium text-[#1F1E1D]">Search venues</p>
                <p className="mt-1 text-xs leading-relaxed text-[#8A8377]">
                  Type a salon name in the search bar and results will appear on the search page.
                </p>
                <div className="mt-4 space-y-1">
                  {SERVICE_CATEGORIES.slice(0, 4).map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => {
                          setActiveTab("treatments");
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#F7F3ED]"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1EDE7] shrink-0">
                          <Icon className="h-4 w-4 text-[#795831]" />
                        </span>
                        <span className="text-sm text-[#1F1E1D]">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="px-3 py-6 text-center">
                <p className="text-sm font-medium text-[#1F1E1D]">Professionals</p>
                <p className="mt-1 text-xs leading-relaxed text-[#8A8377]">
                  Search by professional is coming soon. Browse treatments to find salons for now.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("treatments")}
                  className="mt-4 text-xs font-medium text-[#795831] hover:underline"
                >
                  Browse treatments
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
