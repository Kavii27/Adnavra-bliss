"use client";
import { Globe } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

export function LanguageSwitcher({ dark = false }: { dark?: boolean }) {
  const { locale, setLocale } = useLocale();
  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex items-center gap-1 rounded-full border p-0.5 text-xs font-semibold ${
        dark ? "border-white/20" : "border-[#E5DDD0]"
      }`}
    >
      <Globe className={`ml-1.5 h-3.5 w-3.5 ${dark ? "text-white/60" : "text-[#8A8377]"}`} />
      {(["en", "si"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            locale === l
              ? dark
                ? "bg-white text-[#2A1D12]"
                : "bg-[#2A1D12] text-white"
              : dark
              ? "text-white/70 hover:text-white"
              : "text-[#4A4640] hover:text-[#1F1E1D]"
          }`}
        >
          {l === "en" ? "EN" : "සිං"}
        </button>
      ))}
    </div>
  );
}
