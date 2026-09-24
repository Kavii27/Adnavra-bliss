"use client";
import { useState } from "react";
import { Store } from "lucide-react";

/** Salon logo avatar that quietly falls back to a placeholder icon if the image URL 404s. */
export function SalonAvatar({
  name,
  logoUrl,
  className = "h-12 w-12",
  iconClassName = "h-5 w-5",
}: {
  name: string;
  logoUrl: string | null;
  className?: string;
  iconClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const wrapperClass = `flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 ${className}`;

  if (!logoUrl || failed) {
    return (
      <div className={wrapperClass} style={{ borderColor: "#D9BE8C", background: "#F7F3ED" }}>
        <Store className={`${iconClassName} text-[#795831]`} />
      </div>
    );
  }

  return (
    <div className={wrapperClass} style={{ borderColor: "#D9BE8C", background: "#F7F3ED" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl} alt={name} className="h-full w-full object-cover" onError={() => setFailed(true)} />
    </div>
  );
}
