"use client";

import Link from "next/link";
import { BUSINESS_TYPES, taxonomyLabelKey } from "@/lib/categories";
import { useLocale } from "@/lib/i18n/locale-context";
import { Reveal } from "./reveal";

export function BrowseBySalonType({
  limit,
  viewAllHref = "/salon-types",
}: {
  limit?: number;
  viewAllHref?: string;
}) {
  const types = typeof limit === "number" ? BUSINESS_TYPES.slice(0, limit) : BUSINESS_TYPES;
  const showViewAll = typeof limit === "number" && limit < BUSINESS_TYPES.length;
  const { t } = useLocale();

  return (
    <section id="salon-types" className="scroll-mt-28 px-6 lg:px-12 pt-10 pb-10 max-w-[1400px] mx-auto">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#795831]">Find your fit</p>
      <div className="mt-1 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#1F1E1D]">{t("home.browseSalonType")}</h2>
        <Link
          href={showViewAll ? viewAllHref : "/customer/search"}
          className="shrink-0 text-sm font-medium text-[#795831] hover:underline"
        >
          {showViewAll ? t("home.seeAll") : `${BUSINESS_TYPES.length} types`}
        </Link>
      </div>

      <Reveal className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 reveal-stagger">
        {types.map((bt, i) => (
          <Link
            key={bt.slug}
            href={`/salon-types/${encodeURIComponent(bt.slug)}`}
            className="group card-lift relative flex min-h-[192px] flex-col justify-start gap-8 rounded-xl border border-[#E5DDD0] bg-white p-5 hover:border-[#795831]"
          >
            <div className="flex items-start justify-between">
              <span className="num-ghost text-3xl font-semibold text-[#EDE6D8] tabular-nums leading-none">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="icon-pop flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F3ED] text-[#795831] group-hover:bg-[#795831] group-hover:text-white">
                <bt.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="text-[15px] font-semibold text-[#1F1E1D]">{t(taxonomyLabelKey(bt.slug))}</p>
          </Link>
        ))}
      </Reveal>
    </section>
  );
}
