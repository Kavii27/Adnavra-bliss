"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { HomeHeader } from "@/components/customer/home/home-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { VenueGrid } from "@/components/customer/home/venue-grid";
import { MapPin, Loader2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

type NearVenue = {
  id: string; name: string; slug: string; logoUrl: string | null; address: string | null;
  city: string | null; categories: string[]; salonTypes: string[]; distanceKm: number;
  marketplacePriority: boolean; services: { category: string | null; price: number }[];
};

export default function NearYouPage() {
  const { t } = useLocale();
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "denied" | "unsupported">("idle");
  const [venues, setVenues] = useState<NearVenue[]>([]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`/api/marketplace/near-you?lat=${latitude}&lng=${longitude}`);
          const json = await res.json();
          setVenues(json.data ?? []);
          setStatus("ok");
        } catch {
          setStatus("denied");
        }
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }, []);

  const mapped = venues.map((v) => ({
    id: v.id, name: v.name, slug: v.slug, logoUrl: v.logoUrl, address: v.address, city: v.city,
    category: v.services[0]?.category ?? v.categories[0] ?? null, categories: v.categories,
    salonTypes: v.salonTypes, featured: v.marketplacePriority,
    fromPriceMinor: v.services.length ? Math.min(...v.services.map((s) => s.price)) : null,
  }));

  return (
    <main className="relative min-h-screen bg-[#FDF9F3]">
      <HomeHeader />
      <section className="px-4 sm:px-6 lg:px-12 pt-8 sm:pt-10 pb-16 max-w-[1400px] mx-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2A1D12]">{t("near.eyebrow")}</p>
        <h1 className="mt-1 text-2xl lg:text-3xl font-semibold tracking-tight text-[#1F1E1D]">{t("near.title")}</h1>

        {status === "idle" || status === "loading" ? (
          <div className="mt-8 flex min-h-[44px] items-center gap-2 text-sm text-[#8A8377]">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("near.loading")}
          </div>
        ) : status === "unsupported" || status === "denied" ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#D9CFBE] bg-white p-8 text-center">
            <MapPin className="mx-auto h-6 w-6 text-[#9A7B4F]" />
            <p className="mt-3 text-sm font-semibold text-[#1F1E1D]">{t("near.locNeeded")}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-[#8A8377]">
              {t("near.locDesc")}
            </p>
            <Link href="/customer/search" className="mt-4 inline-flex min-h-[44px] items-center text-sm font-medium text-[#795831] hover:underline">
              {t("near.browseAll")}
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-[#8A8377]">{venues.length} {t("near.countSuffix")}</p>
            <div className="mt-8">
              <VenueGrid businesses={mapped} emptyText={t("near.empty")} />
            </div>
          </>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
