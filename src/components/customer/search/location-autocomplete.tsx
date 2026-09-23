"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Navigation, X, LocateFixed } from "lucide-react";
import { SRI_LANKA_LOCATIONS, type SriLankaLocation } from "@/lib/sri-lanka-locations";

export type LocationValue = {
  label: string;
  lat: number;
  lng: number;
} | null;

type LocationAutocompleteProps = {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestLocation(lat: number, lng: number): SriLankaLocation {
  let best = SRI_LANKA_LOCATIONS[0];
  let bestDist = haversine(lat, lng, best.lat, best.lng);
  for (const loc of SRI_LANKA_LOCATIONS) {
    const d = haversine(lat, lng, loc.lat, loc.lng);
    if (d < bestDist) {
      best = loc;
      bestDist = d;
    }
  }
  return best;
}

export function LocationAutocomplete({ value, onChange }: LocationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep query in sync when value changes from outside (e.g. initial searchParams)
  useEffect(() => {
    if (value?.label) setQuery(value.label);
    else if (value === null) setQuery("");
  }, [value?.label, value]);

  // Debounce query 180ms
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 180);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = useMemo(() => {
    if (!debounced) return SRI_LANKA_LOCATIONS.slice(0, 6);
    const q = debounced;
    const byName: SriLankaLocation[] = [];
    const byDistrict: SriLankaLocation[] = [];
    for (const loc of SRI_LANKA_LOCATIONS) {
      const nameMatch = loc.name.toLowerCase().includes(q);
      const districtMatch = loc.district.toLowerCase().includes(q);
      if (nameMatch) byName.push(loc);
      else if (districtMatch) byDistrict.push(loc);
    }
    return [...byName, ...byDistrict].slice(0, 6);
  }, [debounced]);

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

  function handleSelect(loc: SriLankaLocation) {
    onChange({ label: loc.name, lat: loc.lat, lng: loc.lng });
    setQuery(loc.name);
    setOpen(false);
  }

  function handleClear() {
    onChange(null);
    setQuery("");
    setGeoError(null);
    inputRef.current?.focus();
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported in this browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = nearestLocation(pos.coords.latitude, pos.coords.longitude);
        onChange({ label: nearest.name, lat: nearest.lat, lng: nearest.lng });
        setQuery(nearest.name);
        setOpen(false);
        setGeoLoading(false);
      },
      () => {
        setGeoError("Unable to get your location. Please pick a town below.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }

  const displayPlaceholder = "Current location";

  return (
    <div ref={ref} className="relative flex-1 overflow-visible">
      <div className="flex items-center gap-2 px-4 py-0">
        <MapPin className="h-4 w-4 shrink-0 text-[#8A8377]" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // If user is typing and we previously had a selected value, clear its coords until they pick again
            if (value && e.target.value !== value.label) {
              // keep parent value until they pick? We'll clear to avoid stale coords being submitted
              // but do it without closing dropdown
              onChange(null);
            }
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={displayPlaceholder}
          aria-label="Location"
          className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-[#8A8377] text-[#1F1E1D]"
        />
        {query || value ? (
          <button
            type="button"
            aria-label="Clear location"
            onClick={handleClear}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#F7F3ED]"
          >
            <X className="h-3.5 w-3.5 text-[#8A8377]" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 top-[calc(100%+8px)] z-50 w-[360px] max-w-[min(360px,92vw)] overflow-hidden rounded-xl border border-[#E5DDD0] bg-white shadow-[0_8px_30px_rgba(16,24,40,0.12)]">
          {/* Current location row */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={geoLoading}
            className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-[#F7F3ED] disabled:opacity-60"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1EDE7] shrink-0">
              <LocateFixed className="h-4 w-4 text-[#795831]" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium text-[#795831]">{geoLoading ? "Locating…" : "Current location"}</span>
              <span className="block text-xs text-[#8A8377]">Use your device location</span>
            </span>
            <Navigation className="h-4 w-4 text-[#8A8377]" />
          </button>

          {geoError ? <p className="px-3 pb-2 text-xs text-[#B91C1C]">{geoError}</p> : null}

          <div className="border-t border-[#F1EDE7]" />

          <div className="max-h-[280px] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-[#8A8377]">No towns match &ldquo;{debounced}&rdquo;.</p>
            ) : (
              filtered.map((loc) => (
                <button
                  key={`${loc.name}-${loc.district}`}
                  type="button"
                  onClick={() => handleSelect(loc)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[#F7F3ED]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F3ED] border border-[#E5DDD0] shrink-0">
                    <MapPin className="h-4 w-4 text-[#4A4640]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[#1F1E1D]">{loc.name}</span>
                    <span className="block truncate text-xs text-[#8A8377]">{loc.district}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          <div className="border-t border-[#F1EDE7] px-3 py-2">
            <p className="text-[11px] leading-relaxed text-[#8A8377]">Locations are approximate centres for Sri Lankan towns.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
