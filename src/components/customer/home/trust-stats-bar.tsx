import { ShieldCheck, BadgePercent, Mail } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";
import { Reveal } from "./reveal";

const STATS = [
  {
    icon: ShieldCheck,
    titleKey: "home.trust.verified",
    descKey: "home.trust.verifiedDesc",
    withCount: true,
  },
  {
    icon: BadgePercent,
    titleKey: "home.trust.zeroFee",
    descKey: "home.trust.zeroFeeDesc",
    withCount: false,
  },
  {
    icon: Mail,
    titleKey: "home.trust.instantConfirm",
    descKey: "home.trust.instantConfirmDesc",
    withCount: false,
  },
] as const;

export async function TrustStatsBar({ businessCount }: { businessCount: number }) {
  const t = await getServerT();
  return (
    <section className="relative bg-transparent">
      <Reveal
        as="div"
        className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-5 sm:py-6 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3 reveal-stagger"
      >
        {STATS.map((s) => (
          <div
            key={s.titleKey}
            className="flex items-center gap-3 rounded-xl border border-[#E5DDD0]/60 bg-white/60 px-4 py-3 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7F3ED] text-[#795831]">
              <s.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#1F1E1D]">
                {s.withCount && businessCount > 0 ? `${businessCount}+ ` : ""}{t(s.titleKey)}
              </p>
              <p className="truncate text-xs text-[#8A8377]">{t(s.descKey)}</p>
            </div>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
