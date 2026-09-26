"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { UiSelect } from "@/components/ui/select";

const OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name_asc", label: "Name (A to Z)" },
  { value: "name_desc", label: "Name (Z to A)" },
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
    <UiSelect
      ariaLabel="Sort businesses"
      value={OPTIONS.some((o) => o.value === initialSort) ? initialSort : "newest"}
      onValueChange={apply}
      options={OPTIONS}
    />
  );
}
