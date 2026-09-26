"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

export function DeleteBusinessButton({ businessId, businessName }: { businessId: string; businessName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}`, { method: "DELETE" });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Failed to delete salon");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete salon");
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <span className="text-[11px] text-[#B91C1C]">Delete {businessName}?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex h-7 items-center gap-1 rounded-md bg-[#B91C1C] px-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40"
        >
          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="inline-flex h-7 items-center rounded-md border border-[#E3E8F0] px-2 text-xs font-medium text-[#3a2f22] hover:bg-[#faf6ef]"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${businessName}`}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#B91C1C] transition hover:bg-[#FDECEC]"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      {error && <p className="text-[10px] font-medium text-[#B91C1C]">{error}</p>}
    </div>
  );
}
