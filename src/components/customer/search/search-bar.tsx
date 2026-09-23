"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TreatmentsDropdown } from "./treatments-dropdown";
import { LocationAutocomplete, type LocationValue } from "./location-autocomplete";
import { SERVICE_CATEGORIES } from "@/lib/categories";
import { DateTimePicker, type DateTimeValue } from "./date-time-picker";

type SearchBarProps = {
  variant: "hero" | "compact";
};

export function SearchBar({ variant }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialise from URL when mounted (compact variant uses this to pre-fill)
  const initialQ = searchParams.get("q") ?? "";
  const initialCategory = searchParams.get("category");
  const initialDate = searchParams.get("date");
  const initialTimeBand = searchParams.get("timeBand");
  const initialCustomFrom = searchParams.get("timeFrom");
  const initialCustomTo = searchParams.get("timeTo");

  const initialLocationRaw = searchParams.get("location"); // "lat,lng"
  const initialLocationLabel = searchParams.get("locationLabel");
  const initialLat = searchParams.get("lat");
  const initialLng = searchParams.get("lng");

  // Legacy browse-by-city links use ?location=CityName&lat=&lng=
  // New SearchBar uses ?location=lat,lng & locationLabel
  const initialLocation: LocationValue = (() => {
    if (initialLocationRaw && initialLocationRaw.includes(",")) {
      const [a, b] = initialLocationRaw.split(",");
      const la = parseFloat(a);
      const ln = parseFloat(b);
      if (!Number.isNaN(la) && !Number.isNaN(ln)) {
        return { label: initialLocationLabel ?? `${la.toFixed(4)}, ${ln.toFixed(4)}`, lat: la, lng: ln };
      }
    }
    if (initialLat && initialLng) {
      const la = parseFloat(initialLat);
      const ln = parseFloat(initialLng);
      if (!Number.isNaN(la) && !Number.isNaN(ln) && initialLocationLabel) {
        return { label: initialLocationLabel, lat: la, lng: ln };
      }
      if (!Number.isNaN(la) && !Number.isNaN(ln) && searchParams.get("location")) {
        return { label: searchParams.get("location")!, lat: la, lng: ln };
      }
    }
    if (initialLocationLabel) {
      // label without coords — will be resolved by LocationAutocomplete geocoding? keep as is with 0,0? Better keep null but show label as query
      // For now keep null and let placeholder show; actual lat/lng fallback will be Colombo
      return null;
    }
    return null;
  })();

  const [q, setQ] = useState(() => {
    if (initialQ) return initialQ;
    // Deep link like ?category=hair with no q — mirror the category label
    // into the input so the field still shows what's active.
    if (initialCategory) {
      return SERVICE_CATEGORIES.find((c) => c.slug === initialCategory)?.label ?? "";
    }
    return "";
  });
  // But q is now also derived from category slug? Spec says "q" is treatment-or-category. We treat category separately.
  // If q matches a category slug, map it; also handle category param explicitly.
  const [categorySlug, setCategorySlug] = useState<string | null>(() => {
    if (initialCategory) return initialCategory;
    // if q happens to be a category label slug? keep independent
    return null;
  });
  const [location, setLocation] = useState<LocationValue>(initialLocation);
  const [dateTime, setDateTime] = useState<DateTimeValue>(() => {
    if (!initialDate) return null;
    const band = (initialTimeBand as DateTimeValue extends { band: infer B } ? B : never) ?? "any";
    const allowed = ["any", "morning", "afternoon", "evening", "custom"] as const;
    const safeBand = allowed.includes(band as typeof allowed[number]) ? (band as typeof allowed[number]) : "any";
    if (safeBand === "custom") {
      return { date: initialDate, band: "custom", from: initialCustomFrom ?? "09:00", to: initialCustomTo ?? "17:00" };
    }
    return { date: initialDate, band: safeBand };
  });

  // Keep q + category slug in sync if URL changes externally (back nav)
  useEffect(() => {
    const nextQ = searchParams.get("q") ?? "";
    if (nextQ !== q) setQ(nextQ);
    const c = searchParams.get("category");
    if (c !== categorySlug) setCategorySlug(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // q is free text (salon name / treatment word); categorySlug is the
  // explicit category filter. Picking a category mirrors its label into the
  // input for display, but handleSubmit suppresses that mirrored text so we
  // don't over-filter (name CONTAINS label AND category) on category browse.
  // Typing anything else clears categorySlug (see TreatmentsDropdown).

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    const trimmedQ = q.trim();
    // Don't send the mirrored category label as free text — the category
    // param already captures it. Only send q when it's genuine free text.
    const mirroredLabel = categorySlug
      ? SERVICE_CATEGORIES.find((c) => c.slug === categorySlug)?.label
      : undefined;
    if (trimmedQ && trimmedQ !== mirroredLabel) params.set("q", trimmedQ);
    if (categorySlug) params.set("category", categorySlug);
    if (location) {
      params.set("location", `${location.lat},${location.lng}`);
      params.set("locationLabel", location.label);
      // also keep legacy lat/lng for API compatibility
      params.set("lat", String(location.lat));
      params.set("lng", String(location.lng));
    }
    if (dateTime?.date) {
      params.set("date", dateTime.date);
      params.set("timeBand", dateTime.band);
      if (dateTime.band === "custom" && dateTime.from && dateTime.to) {
        params.set("timeFrom", dateTime.from);
        params.set("timeTo", dateTime.to);
      }
    }
    router.push(`/customer/search?${params.toString()}`);
  }

  const isHero = variant === "hero";

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isHero
          ? "flex flex-col sm:flex-row gap-0 bg-white rounded-full border border-[#E5DDD0] p-2 shadow-[0_4px_20px_rgba(16,24,40,0.08)] text-left items-stretch overflow-visible"
          : "flex flex-col sm:flex-row gap-0 bg-white rounded-xl border border-[#E5DDD0] p-1.5 shadow-sm text-left items-stretch overflow-visible"
      }
    >
      {/* Treatments segment — free-text input lives inside the dropdown trigger */}
      <div className="flex items-center gap-0 flex-1 min-w-0 overflow-visible">
        <TreatmentsDropdown
          value={categorySlug}
          onChange={(slug) => {
            setCategorySlug(slug);
          }}
          query={q}
          onQueryChange={setQ}
        />
      </div>

      <div className="hidden sm:block w-px bg-[#E5DDD0] self-stretch my-1 shrink-0" />
      <div className="flex-1 flex items-center min-w-0 border-t sm:border-t-0 border-[#E5DDD0] pt-1 sm:pt-0 overflow-visible">
        <LocationAutocomplete value={location} onChange={setLocation} />
      </div>

      <div className="hidden sm:block w-px bg-[#E5DDD0] self-stretch my-1 shrink-0" />
      <div className="flex-1 flex items-center min-w-0 border-t sm:border-t-0 border-[#E5DDD0] pt-1 sm:pt-0 overflow-visible">
        <DateTimePicker value={dateTime} onChange={setDateTime} />
      </div>

      <div className="flex items-center shrink-0 border-t sm:border-t-0 border-[#E5DDD0] mt-1 pt-2 sm:mt-0 sm:pt-0 sm:ml-2">
        <Button
          type="submit"
          variant={isHero ? "gradient" : "primary"}
          className={`shrink-0 ${isHero ? "rounded-full w-full sm:w-auto mt-0" : "rounded-lg w-full sm:w-auto"}`}
        >
          Search
        </Button>
      </div>
    </form>
  );
}
