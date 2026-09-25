import Link from "next/link";
import { UserRoundPlus, Store, CalendarCheck } from "lucide-react";
import { getServerT } from "@/lib/i18n/server";
import { Reveal } from "./reveal";

const STEPS = [
  {
    icon: UserRoundPlus,
    n: "01",
    titleKey: "home.how.step1.title",
    descKey: "home.how.step1.desc",
    href: "/customer/search",
    ctaKey: "home.how.step1.cta",
  },
  {
    icon: Store,
    n: "02",
    titleKey: "home.how.step2.title",
    descKey: "home.how.step2.desc",
    href: "/customer/search",
    ctaKey: "home.how.step2.cta",
  },
  {
    icon: CalendarCheck,
    n: "03",
    titleKey: "home.how.step3.title",
    descKey: "home.how.step3.desc",
    href: "/customer/signup",
    ctaKey: "home.how.step3.cta",
  },
] as const;

/** Explainer over flows that already exist — no new booking logic. */
export async function HowItWorks() {
  const t = await getServerT();
  return (
    <section id="how-it-works" className="px-6 lg:px-12 py-14 max-w-[1400px] mx-auto text-center scroll-mt-20">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#795831]">{t("home.how.eyebrow")}</p>
      <h2 className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight text-[#1F1E1D]">
        {t("home.how.title")}
      </h2>
      <p className="mt-2 text-sm text-[#8A8377] max-w-lg mx-auto">
        {t("home.how.sub")}
      </p>

      <Reveal className="mt-8 grid gap-6 md:grid-cols-3 text-left reveal-stagger">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="group card-lift rounded-xl border border-[#E5DDD0] bg-white p-6 hover:border-[#795831]"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F7F3ED] text-[#795831] transition-colors group-hover:bg-[#795831] group-hover:text-white">
                <s.icon className="h-5 w-5" />
              </span>
              <span className="num-ghost text-3xl font-semibold text-[#E5DDD0]">{s.n}</span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-[#1F1E1D]">{t(s.titleKey)}</h3>
            <p className="mt-1 text-sm leading-relaxed text-[#4A4640]">{t(s.descKey)}</p>
            <Link
              href={s.href}
              className="mt-4 inline-block text-sm font-medium text-[#795831] hover:underline"
            >
              {t(s.ctaKey)} →
            </Link>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
