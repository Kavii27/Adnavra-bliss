"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";

export function CancelBoostButton({ boostId }: { boostId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/boosts/${boostId}`, { method: "DELETE" });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Failed to cancel boost");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to cancel boost");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleCancel}
        disabled={saving}
        className="inline-flex h-8 items-center gap-1 rounded-md border border-[#FDECEC] px-2.5 text-xs font-semibold text-[#B91C1C] transition hover:bg-[#FDECEC] disabled:opacity-40"
      >
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
        Cancel
      </button>
      {error && <p className="text-[10px] font-medium text-[#B91C1C]">{error}</p>}
    </div>
  );
}
