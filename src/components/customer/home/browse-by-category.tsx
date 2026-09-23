import Link from "next/link";
import { SERVICE_CATEGORIES } from "@/lib/categories";

/** Photo-card grid over SERVICE_CATEGORIES — visual upgrade only, no new data. */
export function BrowseByCategory() {
  return (
    <section className="px-6 lg:px-12 py-10 max-w-[1200px] mx-auto">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#1F1E1D]">Browse by category</h2>
          <p className="mt-1 text-sm text-[#8A8377]">Jump straight to the treatment you want.</p>
        </div>
        <Link
          href="/customer/search"
          className="shrink-0 text-sm font-medium text-[#795831] hover:underline"
        >
          See all salons
        </Link>
      </div>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {SERVICE_CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/customer/search?category=${encodeURIComponent(c.slug)}`}
            className="group rounded-xl border border-[#E5DDD0] bg-white p-5 transition hover:border-[#795831] hover:shadow-sm"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F3ED] text-[#795831] transition group-hover:bg-[#795831] group-hover:text-white">
              <c.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-[#1F1E1D]">{c.label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
