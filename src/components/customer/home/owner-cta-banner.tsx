import Link from "next/link";
import { Reveal } from "./reveal";

const METRICS = [
  { value: "99.4%", label: "CUSTOMERS SHOW UP" },
  { value: "LKR 0", label: "FREE TO SET UP" },
  { value: "24h", label: "GO LIVE FAST" },
] as const;

export function OwnerCtaBanner() {
  return (
    <Reveal as="section" className="reveal-up">
      <div className="bg-[#1F1E1D] text-white">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 py-14">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            {/* Left: message */}
            <div>
              <span className="inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                For salon owners
              </span>
              <h2 className="mt-4 text-3xl lg:text-4xl font-semibold tracking-tight leading-[1.15]">
                Grow your salon business with ADNAVRA.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/70 max-w-md">
                Send automatic booking reminders, take bookings online, and get found by
                thousands of customers near you.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/for-business"
                  className="card-lift inline-flex items-center justify-center rounded-lg bg-[#C9A063] px-6 py-3 text-sm font-semibold text-[#1F1E1D] hover:bg-[#D8B27A]"
                >
                  Register your salon
                </Link>
                <Link
                  href="/contact"
                  className="card-lift inline-flex items-center justify-center rounded-lg border border-white/25 px-6 py-3 text-sm font-semibold text-white hover:border-white/50"
                >
                  Book a demo
                </Link>
              </div>
            </div>

            {/* Right: metrics, evenly spaced to match the left block's height */}
            <div className="grid grid-cols-3 gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 lg:p-8">
              {METRICS.map((m) => (
                <div key={m.label} className="text-center lg:text-left">
                  <p className="text-2xl lg:text-3xl font-semibold text-[#C9A063]">{m.value}</p>
                  <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.15em] text-white/50 leading-tight">
                    {m.label}
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
