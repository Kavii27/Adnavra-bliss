import Link from "next/link";
import {
  CreditCard,
  MessageSquareText,
  Star,
  CalendarClock,
  BarChart3,
  Wallet,
  ArrowUpRight,
} from "lucide-react";

/**
 * Apps (integrations marketplace) — browsable by every plan, not gated.
 * Minimum viable: honest integration cards marked Available / Coming soon.
 * Real integrations are a separate project outside this task list's scope.
 */
const APPS = [
  {
    icon: CreditCard,
    name: "Online payments",
    description: "Accept cards at booking time via PayHere or Stripe. Configure in Settings → Payments.",
    status: "Coming soon" as const,
    href: "/dashboard/settings/payments",
  },
  {
    icon: MessageSquareText,
    name: "SMS reminders",
    description: "Text clients before their appointment to cut no-shows. Uses your Client settings toggles.",
    status: "Coming soon" as const,
    href: "/dashboard/settings/clients",
  },
  {
    icon: CalendarClock,
    name: "Google Calendar sync",
    description: "Mirror staff shifts and bookings to Google Calendar, two-way.",
    status: "Coming soon" as const,
    href: "/dashboard/team/shifts",
  },
  {
    icon: Star,
    name: "Review booster",
    description: "Auto-ask happy clients for a marketplace review after checkout. Reads your Reputation data.",
    status: "Coming soon" as const,
    href: "/dashboard/clients/reputation",
  },
  {
    icon: BarChart3,
    name: "Advanced analytics export",
    description: "Scheduled revenue and retention reports by email. Built on your Reports data.",
    status: "Coming soon" as const,
    href: "/dashboard/reports",
  },
  {
    icon: Wallet,
    name: "Accounting export",
    description: "One-click sales ledger export for your accountant. Reads the detailed Sales ledger.",
    status: "Coming soon" as const,
    href: "/dashboard/sales/sales",
  },
];

export default function AppsPage() {
  return (
    <div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#9A7B4F" }}>Integrations</p>
        <h1 className="font-[family-name:var(--font-display)] mt-1 text-3xl font-medium tracking-tight text-[#1F1B17]">Apps</h1>
        <p className="text-sm text-[#8A8377] mt-1.5">Integrations that extend ADNAVRA. Browse freely on any plan — availability is marked per app.</p>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {APPS.map((app) => (
          <div key={app.name} className="rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)] p-5 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="h-10 w-10 rounded-lg bg-[#1F1B17] text-white flex items-center justify-center shrink-0">
                <app.icon className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-[#F3EEE4] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-[#8A8377]">
                {app.status}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[#1F1E1D]">{app.name}</h3>
            <p className="mt-1 text-xs text-[#8A8377] flex-1">{app.description}</p>
            <Link href={app.href} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#795831] hover:underline">
              Open related section <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-[#8A8377]">
        No functional third-party connection ships in this release — each card links to the dashboard
        section its future integration will read from.
      </p>
    </div>
  );
}
