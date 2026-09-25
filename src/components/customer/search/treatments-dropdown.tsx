"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { SERVICE_CATEGORIES, taxonomyLabelKey } from "@/lib/categories";
import { useLocale } from "@/lib/i18n/locale-context";

type Tab = "all" | "treatments";

type TreatmentsDropdownProps = {
  value: string | null;
  onChange: (slug: string | null, label: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
};

export function TreatmentsDropdown({ value, onChange, query, onQueryChange }: TreatmentsDropdownProps) {
  const { t } = useLocale();
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

  const tabs: { id: Tab; labelKey: string }[] = [
    { id: "all", labelKey: "search.tabAll" },
    { id: "treatments", labelKey: "search.tabTreatments" },
  ];

  // Typing filters the category list below. Salon names have their own
  // dedicated field now (SalonAutocomplete), so free text here never
  // touches the category filter or the search query.
  const typedFilter = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    if (activeCategory && q === t(taxonomyLabelKey(activeCategory.slug)).toLowerCase()) return null;
    return SERVICE_CATEGORIES.filter(
      (c) => t(taxonomyLabelKey(c.slug)).toLowerCase().includes(q) || c.label.toLowerCase().includes(q),
    );
  })();
  const visibleCategories = typedFilter ?? SERVICE_CATEGORIES;

  return (
    <div ref={ref} className="relative flex-1 min-w-0 overflow-visible">
      {/* Trigger — text input filters the treatment list; picking a
          category mirrors its label here. Salon search lives in its own
          field (SalonAutocomplete). */}
      <div
        onClick={() => setOpen(true)}
        className="flex w-full min-w-0 items-center gap-2 px-4 py-2.5 text-left outline-none"
      >
        <Search className="h-4 w-4 shrink-0 text-[#8A8377]" />
        <input
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t("search.treatmentsPlaceholder")}
          aria-label={t("search.treatmentsPlaceholder")}
          className="min-w-0 flex-1 truncate bg-transparent text-sm text-[#1F1E1D] outline-none placeholder:text-[#8A8377]"
        />
        {value || query ? (
          <span
            role="button"
            tabIndex={0}
            aria-label={t("search.clearSearch")}
            onMouseDown={(e) => {
              // Clear before the input blurs / form submits.
              e.preventDefault();
              e.stopPropagation();
              handleSelect(null, t("search.allTreatments"));
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(null, t("search.allTreatments"));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(null, t("search.allTreatments"));
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
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  activeTab === tab.id
                    ? "bg-[#795831] text-white"
                    : "bg-transparent text-[#4A4640] hover:bg-[#F7F3ED]"
                }`}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </div>

          <div className="max-h-[340px] overflow-y-auto p-2">
            <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-[#8A8377]">{t("search.tabTreatments")}</p>
            {/* All treatments clear row */}
            <button
              type="button"
              onClick={() => handleSelect(null, t("search.allTreatments"))}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[#F7F3ED] ${
                value === null ? "bg-[#F7F3ED]" : ""
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1EDE7] shrink-0">
                <Search className="h-4 w-4 text-[#795831]" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-[#1F1E1D]">{t("search.allTreatments")}</span>
                <span className="block text-xs text-[#8A8377]">{t("search.browseEverything")}</span>
              </span>
            </button>

            {visibleCategories.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-[#8A8377]">
                {t("search.noTreatmentsMatch")} &ldquo;{query.trim()}&rdquo;.
              </p>
            ) : (
              visibleCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = value === cat.slug;
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => handleSelect(cat.slug, t(taxonomyLabelKey(cat.slug)))}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[#F7F3ED] ${
                        isActive ? "bg-[#F7F3ED] ring-1 ring-[#E5DDD0]" : ""
                      }`}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1EDE7] shrink-0">
                        <Icon className="h-4 w-4 text-[#795831]" />
                      </span>
                      <span className="flex-1">
                        <span className={`block text-sm ${isActive ? "font-semibold" : "font-medium"} text-[#1F1E1D]`}>
                          {t(taxonomyLabelKey(cat.slug))}
                        </span>
                      </span>
                      {isActive ? <span className="h-2 w-2 rounded-full bg-[#795831]" aria-hidden /> : null}
                    </button>
                  );
                })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
