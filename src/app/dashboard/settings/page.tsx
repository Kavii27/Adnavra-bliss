"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Store,
  Clock,
  Tag,
  Smile,
  CreditCard,
  Users,
  FileText,
  Wallet,
  QrCode,
  ChevronRight,
  Settings,
  Globe,
  Megaphone,
  Grid3x3,
} from "lucide-react";

type Tab = "settings" | "online" | "marketing" | "other";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "settings", label: "Settings", icon: Settings },
  { id: "online", label: "Online presence", icon: Globe },
  { id: "marketing", label: "Marketing", icon: Megaphone },
  { id: "other", label: "Other", icon: Grid3x3 },
];

const SETTINGS_CARDS = [
  {
    href: "/dashboard/settings/business",
    title: "Business setup",
    description: "Name, contact details, address, logo and public page link.",
    icon: Store,
  },
  {
    href: "/dashboard/settings/scheduling",
    title: "Scheduling",
    description: "Opening hours for each day of the week.",
    icon: Clock,
  },
  {
    href: "/dashboard/settings/sales",
    title: "Sales settings",
    description: "Receipt template, tax rate, and sales totals.",
    icon: Tag,
  },
  {
    href: "/dashboard/settings/clients",
    title: "Client settings",
    description: "Custom client fields and booking notifications.",
    icon: Smile,
  },
  {
    href: "/dashboard/settings/billing",
    title: "Billing",
    description: "Plan, status and billing period from your subscription.",
    icon: CreditCard,
  },
  {
    href: "/dashboard/team/members",
    title: "Team",
    description: "Manage team members and permissions. Opens Team.",
    icon: Users,
  },
  {
    href: "/dashboard/settings/forms",
    title: "Forms",
    description: "Client intake questions asked at booking time.",
    icon: FileText,
  },
  {
    href: "/dashboard/settings/payments",
    title: "Payments",
    description: "How you collect money: in-person setup and gateway status.",
    icon: Wallet,
  },
];

export default function SettingsHubPage() {
  const [active, setActive] = useState<Tab>("settings");

  return (
    <div className="bg-[#0F1729] min-h-full px-6 py-8">
      <div>
        <h1 className="text-xl font-semibold text-[#3a2f22]">Settings</h1>
        <p className="mt-1 text-sm text-[#a89880]">Manage your business profile, hours, billing and more.</p>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap items-center gap-1.5 rounded-full bg-[#f6efe3] border border-[#e6dcc8] p-1 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              active === id ? "bg-[#8a6d4f] text-[#ffffff]" : "text-[#a89880] hover:text-[#3a2f22] hover:bg-[#f3ebdd]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Settings tab — 8 cards */}
      {active === "settings" && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {SETTINGS_CARDS.map(({ href, title, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-5 hover:bg-[#f3ebdd] hover:border-white/15 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#8a6d4f] text-[#ffffff] flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-[#a89880] group-hover:text-[#3a2f22] transition-colors shrink-0 mt-1" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#3a2f22]">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#a89880] flex-1">{description}</p>
              <span className="mt-3 inline-flex text-xs font-medium text-[#3a2f22] group-hover:underline">Open →</span>
            </Link>
          ))}
        </div>
      )}

      {/* Online presence */}
      {active === "online" && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <Link
              href="/dashboard/qr-code"
              className="group flex flex-col rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-5 hover:bg-[#f3ebdd] transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-[#8a6d4f] text-[#ffffff] flex items-center justify-center">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#3a2f22]">QR code and booking link</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#a89880]">Share your public booking page. Customers can scan the QR to book at /{`{slug}`}. This is your online presence today.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#3a2f22] group-hover:underline">
                View QR code <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </Link>
            <div className="rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-5">
              <div className="h-10 w-10 rounded-lg bg-[#8a6d4f] text-[#ffffff] flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#3a2f22]">Marketplace listing</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#a89880]">Your salon already appears in ADNAVRA customer search. Premium plans can boost it with priority placement.</p>
              <Link href="/dashboard/marketing" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#3a2f22] hover:underline">
                Manage in Marketing <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          <p className="text-xs text-[#a89880]">Online presence will grow as marketplace features roll out. Your QR code is the real, working item here today.</p>
        </div>
      )}

      {/* Marketing */}
      {active === "marketing" && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Link
            href="/dashboard/marketing"
            className="group flex flex-col rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-5 hover:bg-[#f3ebdd] transition-colors"
          >
            <div className="h-10 w-10 rounded-lg bg-[#8a6d4f] text-[#ffffff] flex items-center justify-center">
              <Megaphone className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-[#3a2f22]">Promotions & campaigns</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#a89880]">Discount codes, recurring campaigns, and marketplace priority placement.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#3a2f22] group-hover:underline">
              Open Marketing <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </Link>
          <Link
            href="/dashboard/clients/reputation"
            className="group flex flex-col rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-5 hover:bg-[#f3ebdd] transition-colors"
          >
            <div className="h-10 w-10 rounded-lg bg-[#8a6d4f] text-[#ffffff] flex items-center justify-center">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-[#3a2f22]">Online reputation</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#a89880]">Reviews and ratings that feed your marketplace listing.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#3a2f22] group-hover:underline">
              View reputation <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      )}

      {/* Other */}
      {active === "other" && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Link
            href="/dashboard/apps"
            className="group flex flex-col rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-5 hover:bg-[#f3ebdd] transition-colors"
          >
            <div className="h-10 w-10 rounded-lg bg-[#8a6d4f] text-[#ffffff] flex items-center justify-center">
              <Grid3x3 className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-[#3a2f22]">Apps & integrations</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#a89880]">Browse integrations that extend ADNAVRA.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#3a2f22] group-hover:underline">
              Browse Apps <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </Link>
          <Link
            href="/dashboard/settings/billing"
            className="group flex flex-col rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-5 hover:bg-[#f3ebdd] transition-colors"
          >
            <div className="h-10 w-10 rounded-lg bg-[#8a6d4f] text-[#ffffff] flex items-center justify-center">
              <Settings className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-[#3a2f22]">Billing & plan</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#a89880]">Your subscription tier unlocks more of these sections.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#3a2f22] group-hover:underline">
              View plans <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
