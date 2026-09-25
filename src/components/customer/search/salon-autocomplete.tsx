"use client";

import { useEffect, useRef, useState } from "react";
import { Store, X } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

type Suggestion = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
};

type SalonAutocompleteProps = {
  value: string;
  onChange: (name: string) => void;
};

/** Minimum letters before we hit the API for salon name suggestions. */
const MIN_LETTERS = 2;

export function SalonAutocomplete({ value, onChange }: SalonAutocompleteProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [allSalons, setAllSalons] = useState<Suggestion[] | null>(null);
  const [allLoading, setAllLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const trimmed = value.trim();
  const showLive = trimmed.length >= MIN_LETTERS;
  // Hoisted so effects can depend on the resolved string, not the `t` closure.
  const salonFallback = t("search.salonFallback");

  // Full A–Z salon list, fetched once when the panel first opens — shown
  // whenever fewer than MIN_LETTERS are typed.
  useEffect(() => {
    if (!open || allSalons !== null || allLoading) return;
    setAllLoading(true);
    const ctrl = new AbortController();
    (async () => {
      try {
        const r = await fetch("/api/marketplace/search", { signal: ctrl.signal });
        const j = await r.json().catch(() => null);
        const rows: Record<string, unknown>[] = Array.isArray(j?.data) ? j.data : [];
        const mapped: Suggestion[] = rows
          .map((row: Record<string, unknown>) => ({
            id: String(row.id ?? ""),
            name: String(row.name ?? salonFallback),
            slug: String(row.slug ?? ""),
            city: row.city ? String(row.city) : null,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setAllSalons(mapped);
      } catch {
        // Aborted or network hiccup — retry on next open.
      } finally {
        if (!ctrl.signal.aborted) setAllLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [open, allSalons, allLoading, salonFallback]);

  // Locally filter the A–Z list while fewer than MIN_LETTERS are typed
  // (e.g. a single letter narrows it without hitting the API).
  const visibleAll = (() => {
    if (!allSalons) return [];
    const t = trimmed.toLowerCase();
    if (!t) return allSalons;
    return allSalons.filter((s) => s.name.toLowerCase().includes(t));
  })();

  // Live salon suggestions once 2+ letters are typed (debounced, abortable).
  useEffect(() => {
    if (trimmed.length < MIN_LETTERS) {
      setSuggestions(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/marketplace/search?q=${encodeURIComponent(trimmed)}`, {
          signal: ctrl.signal,
        });
        const j = await r.json().catch(() => null);
        const rows: Record<string, unknown>[] = Array.isArray(j?.data) ? j.data : [];
        setSuggestions(
          rows.slice(0, 6).map((row: Record<string, unknown>) => ({
            id: String(row.id ?? ""),
            name: String(row.name ?? salonFallback),
            slug: String(row.slug ?? ""),
            city: row.city ? String(row.city) : null,
          }))
        );
      } catch {
        // Aborted keystroke or network hiccup — keep previous suggestions.
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [trimmed, salonFallback]);

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

  function handleSelect(name: string) {
    onChange(name);
    setOpen(false);
  }

  function handleClear() {
    onChange("");
    setSuggestions(null);
  }

  return (
    <div ref={ref} className="relative flex-1 min-w-0 overflow-visible">
      {/* Trigger — free-text salon name input with live suggestions */}
      <div
        onClick={() => setOpen(true)}
        className="flex w-full min-w-0 items-center gap-2 px-4 py-2.5 text-left outline-none"
      >
        <Store className="h-4 w-4 shrink-0 text-[#8A8377]" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t("search.salonsPlaceholder")}
          aria-label={t("search.salonsPlaceholder")}
          className="min-w-0 flex-1 truncate bg-transparent text-sm text-[#1F1E1D] outline-none placeholder:text-[#8A8377]"
        />
        {value ? (
          <span
            role="button"
            tabIndex={0}
            aria-label={t("search.clearSalonSearch")}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClear();
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                handleClear();
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
          <div className="max-h-[340px] overflow-y-auto p-2">
            {showLive ? (
              <>
                <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-[#8A8377]">{t("search.salonsHeading")}</p>
                {loading && suggestions === null ? (
                  <p className="px-3 py-6 text-center text-sm text-[#8A8377]">{t("search.searchingSalons")}</p>
                ) : suggestions !== null && suggestions.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-[#8A8377]">
                    {t("search.noSalonsMatch")} &ldquo;{trimmed}&rdquo;.
                  </p>
                ) : (
                  (suggestions ?? []).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelect(s.name)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[#F7F3ED]"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1EDE7] shrink-0">
                        <Store className="h-4 w-4 text-[#795831]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-[#1F1E1D]">{s.name}</span>
                        {s.city ? (
                          <span className="block truncate text-xs text-[#8A8377]">{s.city}</span>
                        ) : null}
                      </span>
                    </button>
                  ))
                )}
              </>
            ) : (
              <>
                <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-[#8A8377]">
                  {t("search.allSalonsAZ")}
                </p>
                {allLoading ? (
                  <p className="px-3 py-6 text-center text-sm text-[#8A8377]">{t("search.loadingSalons")}</p>
                ) : visibleAll.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-[#8A8377]">{t("search.noSalonsFound")}</p>
                ) : (
                  visibleAll.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelect(s.name)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[#F7F3ED]"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1EDE7] shrink-0">
                        <Store className="h-4 w-4 text-[#795831]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-[#1F1E1D]">{s.name}</span>
                        {s.city ? (
                          <span className="block truncate text-xs text-[#8A8377]">{s.city}</span>
                        ) : null}
                      </span>
                    </button>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
