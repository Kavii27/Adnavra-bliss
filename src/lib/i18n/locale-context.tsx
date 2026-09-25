"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { dictionaries, DEFAULT_LOCALE, type Locale } from "./dictionary";
import { LOCALE_COOKIE, LOCALE_MAX_AGE } from "./locale-cookie";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Adopt a legacy localStorage preference (from before the cookie existed).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOCALE_COOKIE) as Locale | null;
      if ((saved === "en" || saved === "si") && saved !== initialLocale) {
        setLocaleState(saved);
        document.cookie = `${LOCALE_COOKIE}=${saved}; path=/; max-age=${LOCALE_MAX_AGE}`;
      }
    } catch {
      // storage unavailable — stay with the cookie/server value
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setLocale(l: Locale) {
    if (l === locale) return;
    setLocaleState(l);
    try {
      window.localStorage.setItem(LOCALE_COOKIE, l);
    } catch {
      // ignore — cookie is the source of truth for the server
    }
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=${LOCALE_MAX_AGE}`;
    document.documentElement.lang = l;
    // Re-render server components in the new locale
    router.refresh();
  }

  function t(key: string): string {
    return dictionaries[locale][key] ?? dictionaries[DEFAULT_LOCALE][key] ?? key;
  }

  return <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
