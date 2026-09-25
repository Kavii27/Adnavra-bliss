import Link from "next/link";
import { getServerT } from "@/lib/i18n/server";
import { Reveal } from "./reveal";

const METRICS = [
  { value: "99.4%", labelKey: "home.owner.m1" },
  { value: "0%", labelKey: "home.owner.m2" },
  { value: "24h", labelKey: "home.owner.m3" },
] as const;

export async function OwnerCtaBanner() {
  const t = await getServerT();
  return (
    <Reveal as="section" className="reveal-up">
      <div className="bg-[#2A1D12] text-white">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-14">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            {/* Left: message */}
            <div>
              <span className="inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                {t("home.owner.badge")}
              </span>
              <h2 className="mt-4 text-3xl lg:text-4xl font-semibold tracking-tight leading-[1.15]">
                {t("home.owner.title")}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/70 max-w-md">
                {t("home.owner.sub")}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/for-business"
                  className="card-lift inline-flex items-center justify-center rounded-lg bg-[#C9A063] px-6 py-3 text-sm font-semibold text-[#2A1D12] hover:bg-[#D8B27A]"
                >
                  {t("home.owner.register")}
                </Link>
                <Link
                  href="/contact"
                  className="card-lift inline-flex items-center justify-center rounded-lg border border-white/25 px-6 py-3 text-sm font-semibold text-white hover:border-white/50"
                >
                  {t("home.owner.demo")}
                </Link>
              </div>
            </div>

            {/* Right: metrics, evenly spaced to match the left block's height */}
            <div className="grid grid-cols-3 gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 lg:p-8">
              {METRICS.map((m) => (
                <div key={m.labelKey} className="text-center lg:text-left">
                  <p className="text-2xl lg:text-3xl font-semibold text-[#C9A063]">{m.value}</p>
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.15em] text-white/50 leading-tight">
                    {t(m.labelKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

