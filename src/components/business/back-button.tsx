"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

export function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();
  const { t } = useLocale();
  return (
    <button
      type="button"
      onClick={() => {
        const sameOriginReferrer = document.referrer
          ? new URL(document.referrer).origin === window.location.origin
          : false;
        if (window.history.length > 1 && sameOriginReferrer) router.back();
        else router.push(fallbackHref);
      }}
      aria-label={t("feedback.back")}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E9E1D3] bg-white text-[#4A4640] transition-colors hover:bg-[#F1E9DC]"
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
}
