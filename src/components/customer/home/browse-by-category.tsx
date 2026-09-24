import Link from "next/link";
import { SERVICE_CATEGORIES } from "@/lib/categories";
import { Reveal } from "./reveal";

/** Numbered category grid, styled after the reference "Browse categories & services" section. */
export function BrowseByCategory({
  counts = {},
  limit,
  viewAllHref = "/categories",
}: {
  counts?: Record<string, number>;
  /** Show only the first N categories (used for the homepage teaser). Omit to show all. */
  limit?: number;
  /** Where the "View all" link goes. Defaults to the dedicated /categories page. */
  viewAllHref?: string;
}) {
  const categories = typeof limit === "number" ? SERVICE_CATEGORIES.slice(0, limit) : SERVICE_CATEGORIES;
  const showViewAll = typeof limit === "number" && limit < SERVICE_CATEGORIES.length;

  return (
    <section id="categories" className="scroll-mt-28 px-6 lg:px-12 pt-20 pb-10 max-w-[1400px] mx-auto">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#795831]">
        Services &amp; specialties
      </p>
      <div className="mt-1 flex items-end justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[#1F1E1D]">
          Browse categories &amp; services
        </h2>
        <Link
          href={showViewAll ? viewAllHref : "/customer/search"}
          className="shrink-0 text-sm font-medium text-[#795831] hover:underline"
        >
          {showViewAll ? "View all" : `${SERVICE_CATEGORIES.length} Main`} categories
        </Link>
      </div>

      <Reveal className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 reveal-stagger">
        {categories.map((c, i) => {
          const count = counts[c.slug] ?? 0;
          return (
            <Link
              key={c.slug}
              href={`/categories/${encodeURIComponent(c.slug)}`}
              className="group card-lift relative flex min-h-[192px] flex-col justify-start gap-8 rounded-xl border border-[#E5DDD0] bg-white p-5 hover:border-[#795831]"
            >
              <div className="flex items-start justify-between">
                <span className="num-ghost text-3xl font-semibold text-[#EDE6D8] tabular-nums leading-none">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="icon-pop flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F3ED] text-[#795831] group-hover:bg-[#795831] group-hover:text-white">
                  <c.icon className="h-4 w-4" />
                </span>
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[#1F1E1D]">{c.label}</p>
                {count > 0 && (
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#795831]">
                    {count} {count === 1 ? "Service" : "Services"}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </Reveal>
    </section>
  );
}
