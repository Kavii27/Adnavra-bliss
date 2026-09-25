"use client";

import dynamic from "next/dynamic";
import { useLocale } from "@/lib/i18n/locale-context";

function MapLoading() {
  const { t } = useLocale();
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#F7F3ED] text-xs text-[#8A7F6E]">
      {t("mkt.map.loading")}
    </div>
  );
}

const ContactMap = dynamic(() => import("./contact-map"), {
  ssr: false,
  loading: () => <MapLoading />,
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
