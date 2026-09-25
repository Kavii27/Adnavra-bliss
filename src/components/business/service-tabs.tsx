"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { ServiceImage } from "@/components/business/service-image";
import { taxonomyLabelKey } from "@/lib/categories";
import { useLocale } from "@/lib/i18n/locale-context";

export type TabbedService = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  category: string | null;
  imageUrl?: string | null;
};

const SERIF = { fontFamily: "var(--font-display, Georgia, 'Times New Roman', serif)" } as const;

function formatPrice(priceMinor: number): string {
  return (priceMinor / 100).toLocaleString("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  });
}

// "Services & Pricing": heading + category filter pills + a responsive grid of
// photo cards. Each card deep-links into the booking wizard with ?serviceId=
// preselected (wizard logic untouched). Empty categories are never rendered.
export function ServiceTabs({
  services,
  businessSlug,
}: {
  services: TabbedService[];
  businessSlug: string;
}) {
  const { t } = useLocale();
  const tabs = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of services) {
      if (s.category && !seen.has(s.category)) seen.set(s.category, s.category);
    }
    return [
      { key: "all", label: t("salon.svc.all"), count: services.length },
      ...[...seen.entries()].map(([key]) => ({
        key,
        label: t(taxonomyLabelKey(key)),
        count: services.filter((s) => s.category === key).length,
      })),
    ];
  }, [services, t]);

  const [active, setActive] = useState("all");
  const visible = active === "all" ? services : services.filter((s) => s.category === active);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9A7B4F]">{t("salon.svc.eyebrow")}</p>
          <h2 className="mt-1 text-3xl font-medium leading-tight text-[#1F1B17] sm:text-4xl" style={SERIF}>
            {t("salon.svc.title")}
          </h2>
        </div>

        {services.length > 0 && tabs.length > 2 && (
          <div className="-mx-4 flex max-w-[100vw] gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:max-w-full sm:flex-wrap sm:px-0" role="tablist" aria-label={t("salon.svc.aria")}>
            {tabs.map((t) => {
              const selected = t.key === active;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActive(t.key)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? "border-[#1F1B17] bg-[#1F1B17] text-white"
                      : "border-[#E2D9C8] bg-white text-[#4A4640] hover:border-[#B9A987] hover:text-[#1F1B17]"
                  }`}
                >
                  {t.label}
                  <span className={selected ? "text-white/60" : "text-[#9A9184]"}>{t.count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {services.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#D9CFBE] bg-white p-8 text-center">
          <p className="text-sm font-medium text-[#1F1E1D]">{t("salon.svc.empty")}</p>
          <p className="mt-1 text-sm text-[#8A8377]">
            {t("salon.svc.emptySub")}
          </p>
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
          {visible.map((s) => {
            const href = `/${businessSlug}/book?serviceId=${s.id}`;
            return (
              <li
                key={s.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_1px_3px_rgba(30,28,26,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(30,28,26,0.10)]"
              >
                <Link href={href} className="relative block aspect-[4/3] overflow-hidden bg-[#F1E9DC]" tabIndex={-1} aria-hidden="true">
                  <ServiceImage
                    name={s.name}
                    category={s.category}
                    imageUrl={s.imageUrl}
                    className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                  />
                    {s.category && (
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#5F4426] shadow-sm">
                      {t(taxonomyLabelKey(s.category))}
                    </span>
                  )}
                </Link>

                <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                  <h3 className="line-clamp-2 text-lg font-medium leading-snug text-[#1F1B17] sm:text-xl" style={SERIF}>
                    {s.name}
                  </h3>
                  {s.description && (
                    <p className="mt-1.5 hidden line-clamp-3 text-xs leading-relaxed text-[#7A7368] sm:block">{s.description}</p>
                  )}

                  <div className="mt-auto flex items-end justify-between gap-2 pt-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 text-[11px] text-[#8A8377]">
                        <Clock className="h-3 w-3" /> {s.duration} {t("salon.svc.min")}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-[#1F1B17] sm:text-base">{formatPrice(s.price)}</p>
                    </div>
                    <Link
                      href={href}
                      className="inline-flex h-8 shrink-0 items-center rounded-full bg-[#F3EEE4] px-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#5F4426] transition-colors hover:bg-[#1F1B17] hover:text-white"
                    >
                      {t("salon.svc.book")}
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
