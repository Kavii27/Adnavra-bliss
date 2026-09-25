"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { TreatmentsDropdown } from "./treatments-dropdown";
import { SalonAutocomplete } from "./salon-autocomplete";
import { LocationAutocomplete, type LocationValue } from "./location-autocomplete";
import { taxonomyLabelKey } from "@/lib/categories";
import { DateTimePicker, type DateTimeValue } from "./date-time-picker";
import { useLocale } from "@/lib/i18n/locale-context";

type SearchBarProps = {
  variant: "hero" | "compact";
};

export function SearchBar({ variant }: SearchBarProps) {
  const { t } = useLocale();
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

  // `salon` is the salon-name free text (?q=). `treatmentText` only mirrors
  // the picked category label for display — typing in the treatment field
  // filters the category list and never becomes search text.
  const [salon, setSalon] = useState(initialQ);
  const [treatmentText, setTreatmentText] = useState(() => {
    if (initialCategory) {
      return t(taxonomyLabelKey(initialCategory));
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

  // Keep salon + category in sync if URL changes externally (back nav)
  useEffect(() => {
    const nextQ = searchParams.get("q") ?? "";
    if (nextQ !== salon) setSalon(nextQ);
    const c = searchParams.get("category");
    if (c !== categorySlug) {
      setCategorySlug(c);
      setTreatmentText(c ? t(taxonomyLabelKey(c)) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // `salon` is the only free text sent to the API (?q= matches salon names).
  // `categorySlug` is the explicit category filter; `treatmentText` is
  // display-only. Picking a category mirrors its label into the treatment
  // input via TreatmentsDropdown's onQueryChange.

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    const trimmedSalon = salon.trim();
    if (trimmedSalon) params.set("q", trimmedSalon);
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
          ? "flex flex-col lg:flex-row items-stretch bg-white rounded-2xl border border-[#E5DDD0] shadow-[0_4px_24px_rgba(16,24,40,0.08)] overflow-visible"
          : "flex flex-col sm:flex-row items-stretch bg-white rounded-xl border border-[#E5DDD0] shadow-sm overflow-visible"
      }
    >
      {/* Salon segment — free-text salon name with live suggestions */}
      <div className="flex flex-col justify-center flex-1 min-w-0 px-5 py-2.5">
        {isHero && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#B3ACA0]">
            {t("search.salonLabel")}
          </span>
        )}
        <SalonAutocomplete value={salon} onChange={setSalon} />
      </div>

      <div className="hidden lg:block w-px bg-[#E5DDD0] my-3 shrink-0" />
      <div className="flex flex-col justify-center flex-1 min-w-0 px-5 py-2.5 border-t lg:border-t-0 border-[#E5DDD0]">
        {isHero && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#B3ACA0]">
            {t("search.treatmentLabel")}
          </span>
        )}
        <TreatmentsDropdown
          value={categorySlug}
          onChange={(slug) => {
            setCategorySlug(slug);
          }}
          query={treatmentText}
          onQueryChange={setTreatmentText}
        />
      </div>

      <div className="hidden lg:block w-px bg-[#E5DDD0] my-3 shrink-0" />
      <div className="flex flex-col justify-center flex-1 min-w-0 px-5 py-2.5 border-t lg:border-t-0 border-[#E5DDD0]">
        {isHero && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#B3ACA0]">
            {t("search.locationLabel")}
          </span>
        )}
        <LocationAutocomplete value={location} onChange={setLocation} />
      </div>

      <div className="hidden lg:block w-px bg-[#E5DDD0] my-3 shrink-0" />
      <div className="flex flex-col justify-center flex-1 min-w-0 px-5 py-2.5 border-t lg:border-t-0 border-[#E5DDD0]">
        {isHero && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#B3ACA0]">
            {t("search.dateTimeLabel")}
          </span>
        )}
        <DateTimePicker value={dateTime} onChange={setDateTime} />
      </div>

      <div className="p-2 lg:p-2 border-t lg:border-t-0 border-[#E5DDD0]">
        <button
          type="submit"
          className="flex h-full w-full items-center justify-center gap-2 rounded-xl bg-[#795831] px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#5C4326]"
        >
          <Search className="h-4 w-4" />
          {t("search.submit")}
        </button>
      </div>
    </form>
  );
}
