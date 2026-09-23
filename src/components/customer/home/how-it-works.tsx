import Link from "next/link";
import { UserRoundPlus, Store, CalendarCheck } from "lucide-react";

const STEPS = [
  {
    icon: UserRoundPlus,
    n: "1",
    title: "Create account",
    desc: "Sign up in under a minute — no app download needed.",
    href: "/customer/signup",
    cta: "Create account",
  },
  {
    icon: Store,
    n: "2",
    title: "Select salon & services",
    desc: "Compare verified salons, real menus, and honest LKR prices.",
    href: "/customer/search",
    cta: "Find a salon",
  },
  {
    icon: CalendarCheck,
    n: "3",
    title: "Book date & time",
    desc: "Pick a live slot and get instant confirmation.",
    href: "/customer/search",
    cta: "Book now",
  },
] as const;

/** Explainer over flows that already exist — no new booking logic. */
export function HowItWorks() {
  return (
    <section className="px-6 lg:px-12 py-10 max-w-[1200px] mx-auto">
      <div className="rounded-2xl border border-[#E5DDD0] bg-white p-8 lg:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#795831]">How does it work</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1F1E1D]">
          Booked in three steps
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-xl bg-[#F7F3ED] border border-[#E5DDD0] p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#795831] border border-[#E5DDD0]">
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-bold text-[#C9C1B4]">{s.n}</span>
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
        </div>
      </div>
    </section>
  );
}
