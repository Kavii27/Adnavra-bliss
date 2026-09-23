"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Heart, MapPin, SlidersHorizontal, Map as MapIcon, EyeOff } from "lucide-react";
import { CustomerHeader } from "@/components/customer/customer-header";
import { SearchBar } from "@/components/customer/search/search-bar";
import { Button } from "@/components/ui/button";
import { getCategoryLabel } from "@/lib/categories";

const ResultsMap = dynamic(() => import("@/components/customer/results-map"), { ssr: false });

type Result = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
  categories: string[];
  salonTypes: string[];
  marketplacePriority: boolean;
};

function parseCenter(params: URLSearchParams): [number, number] {
  // New SearchBar format: location="lat,lng"
  const loc = params.get("location");
  if (loc && loc.includes(",")) {
    const [a, b] = loc.split(",");
    const la = parseFloat(a);
    const ln = parseFloat(b);
    if (!Number.isNaN(la) && !Number.isNaN(ln)) return [la, ln];
  }
  // Legacy browse-by-city links use ?lat=&lng= and location as label
  const lat = parseFloat(params.get("lat") ?? "");
  const lng = parseFloat(params.get("lng") ?? "");
  if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [lat, lng];
  // Fallback Colombo default per spec Task 4.5
  return [6.9271, 79.8612];
}

function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatPillLabel(d: Date): string {
  const weekday = d.toLocaleDateString("en-GB", { weekday: "short" });
  const day = d.getDate();
  const month = d.toLocaleDateString("en-GB", { month: "short" });
  return `${weekday} ${day} ${month}`;
}

function SearchInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [radiusKm, setRadiusKm] = useState(10);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [hideMap, setHideMap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"venues" | "professionals">("venues");
  const filtersRef = useRef<HTMLDivElement>(null);

  const center = useMemo(() => parseCenter(params), [params]);
  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const selectedDate = params.get("date") ?? "";

  // Close filters popover on outside click
  useEffect(() => {
    if (!showFilters) return;
    function onDown(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setShowFilters(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showFilters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    const qs = new URLSearchParams({
      lat: String(center[0]),
      lng: String(center[1]),
      radiusKm: String(radiusKm),
      ...(q ? { q } : {}),
      ...(category ? { category } : {}),
      ...(selectedDate ? { date: selectedDate } : {}),
    });
    fetch(`/api/marketplace/search?${qs.toString()}`)
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (!r.ok) throw new Error(j?.error ?? "Search failed");
        return j;
      })
      .then((j) => {
        if (cancelled) return;
        const rows = Array.isArray(j?.data) ? j.data : [];
        // Normalise: older cached payloads may omit the Step-6 fields.
        setResults(
          rows.map((row: Record<string, unknown>) => ({
            id: String(row.id ?? ""),
            name: String(row.name ?? "Salon"),
            slug: String(row.slug ?? ""),
            logoUrl: (row.logoUrl as string | null) ?? null,
            address: (row.address as string | null) ?? null,
            city: (row.city as string | null) ?? null,
            latitude: Number(row.latitude ?? 0),
            longitude: Number(row.longitude ?? 0),
            distanceKm: typeof row.distanceKm === "number" ? row.distanceKm : null,
            categories: Array.isArray(row.categories)
              ? (row.categories as unknown[]).filter((c): c is string => typeof c === "string")
              : [],
            salonTypes: Array.isArray(row.salonTypes)
              ? (row.salonTypes as unknown[]).filter((c): c is string => typeof c === "string")
              : [],
            marketplacePriority: row.marketplacePriority === true,
          })),
        );
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setResults([]);
          setLoadError(e instanceof Error ? e.message : "Search failed");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [center, q, category, selectedDate, radiusKm, retryKey, params]);

  // Generate day pills: Any day | Today | next 12 dates
  const dayPills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pills: { label: string; value: string | null; subLabel?: string }[] = [{ label: "Any day", value: null }];
    const todayStr = formatDateISO(today);
    pills.push({ label: "Today", value: todayStr, subLabel: formatPillLabel(today).split(" ").slice(1).join(" ") });
    for (let i = 1; i <= 12; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      pills.push({ label: formatPillLabel(d), value: formatDateISO(d) });
    }
    return pills;
  }, []);

  function setDateParam(value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("date", value);
    else next.delete("date");
    // Keep existing other params (location, q, category, etc.) intact
    router.push(`/customer/search?${next.toString()}`);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Compact SearchBar - Task 4.4 */}
      <div className="relative overflow-visible z-10 border-b border-[#E5DDD0] bg-white px-4 lg:px-6 py-3">
        <Suspense fallback={<div className="h-[48px] rounded-xl bg-[#FDF9F3] border border-[#E5DDD0] animate-pulse" />}>
          <SearchBar variant="compact" />
        </Suspense>
      </div>

      {/* Day-pill row — Task 5.1: Any day | Today | next 12 dates */}
      <div className="border-b border-[#E5DDD0] bg-white px-4 lg:px-6 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1 -mb-1 snap-x snap-mandatory" style={{ scrollbarWidth: "thin" }}>
          {dayPills.map((pill) => {
            const isActive = (pill.value === null && !selectedDate) || pill.value === selectedDate;
            return (
              <button
                key={pill.label + (pill.value ?? "any")}
                type="button"
                onClick={() => setDateParam(pill.value)}
                className={`shrink-0 snap-start rounded-full border px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#1F1E1D] text-white border-[#1F1E1D] shadow-sm"
                    : "bg-white text-[#1F1E1D] border-[#E5DDD0] hover:bg-[#FDF9F3] hover:border-[#CCC6BD]"
                }`}
                aria-pressed={isActive}
              >
                {pill.label === "Today" ? (
                  <span className="inline-flex flex-col items-center leading-none">
                    <span className="text-[11px] font-semibold uppercase tracking-wide opacity-70">Today</span>
                    <span className="text-xs font-medium">{pill.subLabel}</span>
                  </span>
                ) : pill.label === "Any day" ? (
                  "Any day"
                ) : (
                  pill.label
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`grid flex-1 min-h-0 ${hideMap ? "lg:grid-cols-1" : "lg:grid-cols-[420px_1fr]"}`}>
        <div className="overflow-y-auto border-r border-[#E5DDD0] bg-white p-6">
          {/* Venues / Professionals toggle + Filters / Hide map — Task 5.1 */}
          <div className="flex flex-col gap-3">
            {/* Segmented control */}
            <div className="inline-flex rounded-full bg-[#FDF9F3] p-1 border border-[#E5DDD0] w-fit">
              <button
                type="button"
                onClick={() => setActiveTab("venues")}
                className={`rounded-full px-5 py-1.5 text-sm font-semibold transition ${
                  activeTab === "venues" ? "bg-[#1F1E1D] text-white shadow-sm" : "text-[#4A4640] hover:text-[#1F1E1D]"
                }`}
                aria-pressed={activeTab === "venues"}
              >
                Venues
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("professionals")}
                className="rounded-full px-5 py-1.5 text-sm font-medium text-[#8A8377] cursor-not-allowed relative group/prof"
                aria-disabled="true"
                title="Coming soon"
              >
                Professionals
                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1F1E1D] px-2 py-1 text-xs font-medium text-white group-hover/prof:block">
                  Coming soon
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-[#1F1E1D]">
                {activeTab === "professionals" ? "Professionals" : `${results.length} salons nearby`}
              </p>
              <div className="flex items-center gap-2">
                {/* Filters popover — keeps radius select inside */}
                <div className="relative" ref={filtersRef}>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowFilters((v) => !v)}
                    aria-expanded={showFilters}
                    className="h-9 gap-2 rounded-full px-4 text-sm"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>
                  {showFilters && (
                    <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#E5DDD0] bg-white p-4 shadow-[0_8px_30px_rgba(16,24,40,0.12)] z-20">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#8A8377] mb-2">Search radius</p>
                      <select
                        value={radiusKm}
                        onChange={(e) => {
                          setRadiusKm(Number(e.target.value));
                          setShowFilters(false);
                        }}
                        className="w-full rounded-lg border border-[#E5DDD0] bg-white px-3 py-2 text-sm text-[#1F1E1D] outline-none focus:border-[#795831] focus:ring-1 focus:ring-[#795831]"
                      >
                        <option value={2}>Within 2 km</option>
                        <option value={5}>Within 5 km</option>
                        <option value={10}>Within 10 km</option>
                        <option value={25}>Within 25 km</option>
                      </select>
                      <p className="mt-2 text-xs text-[#8A8377]">Adjust how far from the selected location to search.</p>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setHideMap((v) => !v)}
                  className="h-9 gap-2 rounded-full px-4 text-sm"
                >
                  {hideMap ? <MapIcon className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {hideMap ? "Show map" : "Hide map"}
                </Button>
              </div>
            </div>
          </div>

          {activeTab === "professionals" ? (
            <div className="mt-6 rounded-xl border border-dashed border-[#E5DDD0] bg-[#FDF9F3] p-8 text-center">
              <p className="text-sm font-semibold text-[#1F1E1D]">Professionals search — Coming soon</p>
              <p className="mt-1 text-sm text-[#8A8377]">We are building a dedicated search for individual professionals. For now, browse venues above.</p>
            </div>
          ) : loading ? (
            <p className="mt-6 text-sm text-[#8A8377]">Searching...</p>
          ) : loadError ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-sm font-medium text-red-800">Search failed — {loadError}</p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setRetryKey((k) => k + 1)}
                className="mt-3 h-9 rounded-full px-4 text-sm"
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {results.map((r) => (
                <Link
                  key={r.id}
                  href={`/${r.slug}`}
                  className="group relative block overflow-hidden rounded-xl border border-[#E5DDD0] bg-white hover:border-[#CCC6BD] hover:shadow-[0_4px_16px_rgba(16,24,40,0.08)] transition"
                >
                  {/* Photo / placeholder — Task 5.2: use logoUrl if present, else neutral block, heart/save inert, no rating */}
                  <div className="h-[128px] w-full overflow-hidden bg-[#F7F3ED] relative">
                    {r.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.logoUrl} alt={r.name} className="h-full w-full object-cover group-hover:scale-[1.02] transition" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-semibold tracking-tight text-[#795831] border border-[#E5DDD0]">
                          {r.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      aria-label="Save"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur border border-white shadow-sm hover:bg-white transition"
                    >
                      <Heart className="h-4 w-4 text-[#4A4640]" />
                    </button>
                  </div>
                  <div className="p-4">
                    {r.marketplacePriority && (
                      <span className="mb-1.5 inline-flex items-center rounded-full bg-[#795831] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Featured
                      </span>
                    )}
                    <p className="text-sm font-semibold text-[#1F1E1D] truncate">{r.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-[#8A8377] truncate">
                      <MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{r.address ?? r.city ?? "Sri Lanka"}</span>
                    </p>
                    {(r.salonTypes.length > 0 || r.categories.length > 0) && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {[...r.salonTypes, ...r.categories].slice(0, 2).map((c) => (
                          <span key={c} className="rounded-full bg-[#F7F3ED] px-2 py-0.5 text-[10px] text-[#795831]">{getCategoryLabel(c)}</span>
                        ))}
                      </div>
                    )}
                    {r.distanceKm != null && <p className="text-xs text-[#c9a26d] mt-1">{r.distanceKm.toFixed(1)} km away</p>}
                  </div>
                </Link>
              ))}
              {results.length === 0 && <p className="text-sm text-[#8A8377] mt-6">No salons found in this area yet. Try a larger radius or a different location.</p>}
            </div>
          )}
        </div>
        {!hideMap && (
          <div className="min-h-[320px] lg:min-h-0">
            <ResultsMap center={center} results={results} radiusKm={radiusKm} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerSearchPage() {
  return (
    <main className="min-h-screen bg-[#FDF9F3]">
      <CustomerHeader />
      <Suspense fallback={<div className="p-10 text-sm text-[#8A8377]">Loading search...</div>}>
        <SearchInner />
      </Suspense>
    </main>
  );
}
