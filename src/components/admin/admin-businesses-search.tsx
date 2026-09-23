"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Search box for the admin businesses list.
 * Updates ?q= in the URL (server filters); loading + empty states
 * are rendered by the server page per AGENTS.md.
 */
export function AdminBusinessesSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const [pending, startTransition] = useTransition();

  function apply(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.trim()) params.set("q", next.trim());
    else params.delete("q");
    startTransition(() => {
      router.replace(`/admin/businesses?${params.toString()}`);
    });
  }

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a89880]" />
      <Input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          apply(e.target.value);
        }}
        placeholder="Search name, slug, city..."
        aria-label="Search businesses"
        className="bg-white pl-9"
      />
      {pending && <span className="sr-only">Searching...</span>}
    </div>
  );
}
