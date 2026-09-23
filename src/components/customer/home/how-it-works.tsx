import Link from "next/link";
import { UserRoundPlus, Store, CalendarCheck } from "lucide-react";
import { Reveal } from "./reveal";

const STEPS = [
  {
    icon: UserRoundPlus,
    n: "01",
    title: "Browse & Compare",
    desc: "Explore verified salons, transparent pricing, stylist portfolios, and genuine client reviews.",
    href: "/customer/search",
    cta: "Search directory",
  },
  {
    icon: Store,
    n: "02",
    title: "Choose Service & Time",
    desc: "Pick your preferred stylist or therapist, select your service, and choose a time that fits your schedule.",
    href: "/customer/search",
    cta: "Explore calendars",
  },
  {
    icon: CalendarCheck,
    n: "03",
    title: "Instant Confirmation",
    desc: "Receive instant booking confirmation on WhatsApp and SMS. Pay in person when your appointment is done.",
    href: "/customer/signup",
    cta: "Instant booking",
  },
] as const;

/** Explainer over flows that already exist — no new booking logic. */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 lg:px-12 py-14 max-w-[1200px] mx-auto text-center scroll-mt-20">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#795831]">How to book</p>
      <h2 className="mt-2 text-2xl lg:text-3xl font-semibold tracking-tight text-[#1F1E1D]">
        Book in three easy steps
      </h2>
      <p className="mt-2 text-sm text-[#8A8377] max-w-lg mx-auto">
        No advance payment required. Instant confirmation straight to your phone.
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
            <h3 className="mt-4 text-base font-semibold text-[#1F1E1D]">{s.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-[#4A4640]">{s.desc}</p>
            <Link
              href={s.href}
              className="mt-4 inline-block text-sm font-medium text-[#795831] hover:underline"
            >
              {s.cta} →
            </Link>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
