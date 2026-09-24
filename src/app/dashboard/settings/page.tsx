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
    <div className="bg-[#FAF7F2] min-h-full px-6 py-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#9A7B4F" }}>
          Settings
        </p>
        <h1 className="font-[family-name:var(--font-display)] mt-1 text-3xl font-medium tracking-tight text-[#1F1B17]">Settings</h1>
        <p className="mt-1.5 text-sm text-[#8A8377]">Manage your business profile, hours, billing and more.</p>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap items-center gap-1.5 rounded-full bg-[#FBF7EF] border border-[#E9E1D3] p-1 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              active === id ? "bg-[#1F1B17] text-white" : "text-[#8A8377] hover:text-[#1F1E1D] hover:bg-white"
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
              className="group flex flex-col rounded-2xl border border-[#E9E1D3] bg-white p-5 shadow-[0_4px_20px_rgba(30,28,26,0.05)] hover:shadow-[0_8px_24px_rgba(30,28,26,0.08)] transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#1F1B17] text-white flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-[#8A8377] group-hover:text-[#1F1E1D] transition-colors shrink-0 mt-1" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#1F1E1D]">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#8A8377] flex-1">{description}</p>
              <span className="mt-3 inline-flex text-xs font-medium text-[#1F1E1D] group-hover:underline">Open →</span>
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
              className="group flex flex-col rounded-2xl border border-[#E9E1D3] bg-white p-5 shadow-[0_4px_20px_rgba(30,28,26,0.05)] hover:shadow-[0_8px_24px_rgba(30,28,26,0.08)] transition-shadow"
            >
              <div className="h-10 w-10 rounded-lg bg-[#1F1B17] text-white flex items-center justify-center">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#1F1E1D]">QR code and booking link</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#8A8377]">Share your public booking page. Customers can scan the QR to book at /{`{slug}`}. This is your online presence today.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#1F1E1D] group-hover:underline">
                View QR code <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </Link>
            <div className="rounded-2xl border border-[#E9E1D3] bg-white p-5 shadow-[0_4px_20px_rgba(30,28,26,0.05)]">
              <div className="h-10 w-10 rounded-lg bg-[#1F1B17] text-white flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-[#1F1E1D]">Marketplace listing</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#8A8377]">Your salon already appears in ADNAVRA customer search. Premium plans can boost it with priority placement.</p>
              <Link href="/dashboard/marketing" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#1F1E1D] hover:underline">
                Manage in Marketing <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          <p className="text-xs text-[#8A8377]">Online presence will grow as marketplace features roll out. Your QR code is the real, working item here today.</p>
        </div>
      )}

      {/* Marketing */}
      {active === "marketing" && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Link
            href="/dashboard/marketing"
            className="group flex flex-col rounded-2xl border border-[#E9E1D3] bg-white p-5 shadow-[0_4px_20px_rgba(30,28,26,0.05)] hover:shadow-[0_8px_24px_rgba(30,28,26,0.08)] transition-shadow"
          >
            <div className="h-10 w-10 rounded-lg bg-[#1F1B17] text-white flex items-center justify-center">
              <Megaphone className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-[#1F1E1D]">Promotions & campaigns</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#8A8377]">Discount codes, recurring campaigns, and marketplace priority placement.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#1F1E1D] group-hover:underline">
              Open Marketing <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </Link>
          <Link
            href="/dashboard/clients/reputation"
            className="group flex flex-col rounded-2xl border border-[#E9E1D3] bg-white p-5 shadow-[0_4px_20px_rgba(30,28,26,0.05)] hover:shadow-[0_8px_24px_rgba(30,28,26,0.08)] transition-shadow"
          >
            <div className="h-10 w-10 rounded-lg bg-[#1F1B17] text-white flex items-center justify-center">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-[#1F1E1D]">Online reputation</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#8A8377]">Reviews and ratings that feed your marketplace listing.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#1F1E1D] group-hover:underline">
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
            className="group flex flex-col rounded-2xl border border-[#E9E1D3] bg-white p-5 shadow-[0_4px_20px_rgba(30,28,26,0.05)] hover:shadow-[0_8px_24px_rgba(30,28,26,0.08)] transition-shadow"
          >
            <div className="h-10 w-10 rounded-lg bg-[#1F1B17] text-white flex items-center justify-center">
              <Grid3x3 className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-[#1F1E1D]">Apps & integrations</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#8A8377]">Browse integrations that extend ADNAVRA.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#1F1E1D] group-hover:underline">
              Browse Apps <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </Link>
          <Link
            href="/dashboard/settings/billing"
            className="group flex flex-col rounded-2xl border border-[#E9E1D3] bg-white p-5 shadow-[0_4px_20px_rgba(30,28,26,0.05)] hover:shadow-[0_8px_24px_rgba(30,28,26,0.08)] transition-shadow"
          >
            <div className="h-10 w-10 rounded-lg bg-[#1F1B17] text-white flex items-center justify-center">
              <Settings className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-[#1F1E1D]">Billing & plan</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#8A8377]">Your subscription tier unlocks more of these sections.</p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#1F1E1D] group-hover:underline">
              View plans <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
