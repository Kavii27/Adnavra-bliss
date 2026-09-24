"use client";

import dynamic from "next/dynamic";

const ContactMap = dynamic(() => import("./contact-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#F7F3ED] text-xs text-[#8A7F6E]">
      Loading map...
    </div>
  ),
});

export function ContactMapWrapper({
  center,
  label,
}: {
  center: [number, number];
  label: string;
}) {
  return <ContactMap center={center} label={label} />;
}
