import Link from "next/link";
import { MapPin, Building2, ArrowRight } from "lucide-react";
import type { SriLankaLocation } from "@/lib/sri-lanka-locations";
import { getServerT } from "@/lib/i18n/server";
import { Reveal } from "./reveal";

function cityHref(t: SriLankaLocation) {
  return `/customer/search?location=${encodeURIComponent(t.name)}&lat=${t.lat}&lng=${t.lng}`;
}

/**
 * Compact, static preview of a handful of towns — the full interactive
 * province-tab directory (search, all towns) lives on the dedicated
 * /locations page. Kept lightweight here so the homepage stays short.
 */
export async function LocationsTeaser({
  locations,
  counts = {},
  limit = 8,
}: {
  locations: SriLankaLocation[];
  counts?: Record<string, number>;
  limit?: number;
}) {
  const t = await getServerT();
  const preview = locations.slice(0, limit);

  return (
    <section id="locations" className="px-6 lg:px-10 py-10 max-w-[1600px] mx-auto scroll-mt-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#795831]">{t("search.allLocations")}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#1F1E1D]">
            {t("search.exploreTitle")}
          </h2>
        </div>
        <Link
          href="/locations"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[#795831] hover:underline"
        >
          {t("search.viewAllLocations")} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <Reveal className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 reveal-stagger">
        {preview.map((town) => {
          const count = counts[town.name];
          return (
            <Link
              key={town.name}
              href={cityHref(town)}
              className="group card-lift rounded-xl border border-[#E5DDD0] bg-white p-4 hover:border-[#795831]"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F3ED] text-[#795831] group-hover:bg-[#795831] group-hover:text-white transition">
                  <MapPin className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-[#1F1E1D]">{town.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-[#8A8377]">
                <Building2 className="h-3 w-3" />
                {typeof count === "number" ? `${count} ${t(count === 1 ? "search.salonOne" : "search.salonMany")}` : town.district}
              </p>
            </Link>
          );
        })}
      </Reveal>
    </section>
  );
}
