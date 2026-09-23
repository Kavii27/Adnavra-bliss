"use client";
import { useEffect, useState } from "react";

/**
 * Shared dashboard data hook for Priority-2 pages.
 * Resolves the viewer's business via /api/businesses (session-scoped, no
 * businessId prop-drilling) and exposes a generic list loader with the same
 * loading / error / empty-state contract on every page.
 */
export function useBusinessId() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/businesses")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok || !j.data?.[0]?.id) throw new Error("No business linked. Create your business in Settings first.");
        setBusinessId(j.data[0].id as string);
      })
      .catch((e: unknown) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  return { businessId, loading, error, isNoBusiness: error?.toLowerCase().includes("no business") ?? false };
}

export function lkr(minor: number): string {
  return (minor / 100).toLocaleString("en-LK", { style: "currency", currency: "LKR" });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}
