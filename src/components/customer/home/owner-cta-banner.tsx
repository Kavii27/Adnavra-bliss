import Link from "next/link";
import { Reveal } from "./reveal";

const METRICS = [
  { value: "99.4%", label: "ATTENDANCE RATE" },
  { value: "LKR 0", label: "SETUP COST" },
  { value: "24h", label: "QUICK LAUNCH" },
] as const;

export function OwnerCtaBanner() {
  return (
    <Reveal as="section" className="reveal-up">
      <div className="bg-[#1F1E1D] text-white">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-14 grid gap-10 lg:grid-cols-[1.3fr_1fr] items-center">
          <div>
            <span className="inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
              For salon owners
            </span>
            <h2 className="mt-4 text-3xl lg:text-4xl font-semibold tracking-tight leading-[1.1]">
              Grow your salon business with ADNAVRA.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/70 max-w-md">
              Cut down no-shows with automated WhatsApp reminders, accept online bookings
              effortlessly, and introduce your team to thousands of local clients.
            </p>

            <div className="mt-8 flex flex-wrap gap-8">
              {METRICS.map((m) => (
                <div key={m.label}>
                  <p className="text-xl font-semibold text-[#C9A063]">{m.value}</p>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.15em] text-white/50">
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <Link
              href="/for-business"
              className="card-lift inline-flex w-full lg:w-auto items-center justify-center rounded-lg bg-[#C9A063] px-6 py-3 text-sm font-semibold text-[#1F1E1D] hover:bg-[#D8B27A]"
            >
              Register your salon
            </Link>
            <Link
              href="/contact"
              className="card-lift inline-flex w-full lg:w-auto items-center justify-center rounded-lg border border-white/25 px-6 py-3 text-sm font-semibold text-white hover:border-white/50"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
