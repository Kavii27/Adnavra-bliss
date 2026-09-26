"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "name_desc", label: "Name (Z–A)" },
];

export function AdminBusinessesSort({ initialSort }: { initialSort: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function apply(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", next);
    params.delete("page");
    router.replace(`/admin/businesses?${params.toString()}`);
  }

  return (
    <select
      defaultValue={initialSort}
      onChange={(e) => apply(e.target.value)}
      aria-label="Sort businesses"
      className="h-10 rounded-md border border-[#E3E8F0] bg-white px-3 text-sm font-medium text-[#3a2f22] outline-none focus:border-[#8a6d4f]"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
