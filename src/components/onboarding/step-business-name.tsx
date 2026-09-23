"use client";
import { Input } from "@/components/ui/input";

export function StepBusinessName({
  name,
  website,
  onChangeName,
  onChangeWebsite,
}: {
  name: string;
  website: string;
  onChangeName: (v: string) => void;
  onChangeWebsite: (v: string) => void;
}) {
  return (
    <div className="space-y-6 max-w-md">
      <div>
        <label className="text-sm font-medium">Business name</label>
        <Input
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="Glow Salon"
          className="mt-1.5 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Website (optional)</label>
        <Input
          value={website}
          onChange={(e) => onChangeWebsite(e.target.value)}
          placeholder="www.yoursite.com"
          className="mt-1.5 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]"
        />
      </div>
    </div>
  );
}
