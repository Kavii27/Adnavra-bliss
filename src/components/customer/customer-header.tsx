"use client";
import Image from "next/image";
import Link from "next/link";
import { MenuDropdown } from "@/components/marketing/menu-dropdown";
import { LanguageSwitcher } from "@/components/customer/language-switcher";
import { useLocale } from "@/lib/i18n/locale-context";

export function CustomerHeader({ hideBusinessLink = false, hideMenu = false }: { hideBusinessLink?: boolean; hideMenu?: boolean } = {}) {
  const { t } = useLocale();
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-[#E5DDD0] bg-white flex items-center justify-between px-6 lg:px-12">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.png" alt="ADNAVRA BLISS logo" width={28} height={28} className="h-7 w-7 rounded-md object-contain" />
        <span className="text-lg font-semibold tracking-tight text-[#1F1E1D]">
          ADNAVRA <span className="font-normal text-[#795831]">BLISS</span>
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <Link href="/customer/login" className="hidden sm:inline text-sm font-medium text-[#1F1E1D] hover:underline">
          {t("nav.login")}
        </Link>
        {!hideBusinessLink && (
          <Link href="/for-business" className="hidden sm:inline text-sm font-medium text-[#1F1E1D] hover:underline">
            {t("nav.forBusiness")}
          </Link>
        )}
        {!hideMenu && <MenuDropdown audience="customer" />}
      </div>
    </header>
  );
}
