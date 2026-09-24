import { ShieldCheck, BadgePercent, MessageCircle } from "lucide-react";
import { Reveal } from "./reveal";

const STATS = [
  {
    icon: ShieldCheck,
    title: "Verified Salons & Spas",
    desc: "Audited hygiene & master credentials",
  },
  {
    icon: BadgePercent,
    title: "Zero Booking Fee",
    desc: "Direct salon rates with zero card surcharges",
  },
  {
    icon: MessageCircle,
    title: "Instant WhatsApp & SMS Confirm",
    desc: "Calendar-ready reminders with location maps",
  },
] as const;

export function TrustStatsBar({ businessCount }: { businessCount: number }) {
  return (
    <section className="relative bg-transparent">
      <Reveal
        as="div"
        className="max-w-[1400px] mx-auto px-6 lg:px-12 py-6 grid gap-6 sm:grid-cols-3 reveal-stagger"
      >
        {STATS.map((s) => (
          <div key={s.title} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7F3ED] text-[#795831]">
              <s.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#1F1E1D]">
                {s.title.startsWith("Verified") ? `${businessCount > 0 ? `${businessCount}+ ` : ""}${s.title}` : s.title}
              </p>
              <p className="text-xs text-[#8A8377]">{s.desc}</p>
            </div>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
