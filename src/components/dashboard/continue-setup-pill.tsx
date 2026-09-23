"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Rocket, ChevronRight } from "lucide-react";

export function ContinueSetupPill() {
  const [incomplete, setIncomplete] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const bRes = await fetch("/api/businesses");
        const bJson = await bRes.json();
        const business = bJson.data?.[0] ?? bJson.data;
        if (!business) return;
        const [sRes, stRes] = await Promise.all([
          fetch(`/api/services?businessId=${business.id}&limit=1`),
          fetch(`/api/staff?businessId=${business.id}&limit=1`),
        ]);
        const [sJson, stJson] = await Promise.all([sRes.json(), stRes.json()]);
        const hasServices = (sJson.data ?? []).length > 0;
        const hasHours = Boolean(business.openingHours);
        setIncomplete(!hasServices || !hasHours || (stJson.data ?? []).length === 0);
      } catch {
        // fail silent, do not show a broken pill
      }
    }
    check();
  }, []);

  if (!incomplete) return null;
  return (
    <Link
      href="/dashboard/settings"
      className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[var(--color-sidebar-active)] px-3 py-1.5 text-xs font-semibold text-[#3a2f22] hover:opacity-90"
    >
      <Rocket className="h-3.5 w-3.5" /> Continue setup <ChevronRight className="h-3.5 w-3.5" />
    </Link>
  );
}
