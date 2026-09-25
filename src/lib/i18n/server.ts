import { cookies } from "next/headers";
import { dictionaries, DEFAULT_LOCALE, type Locale } from "./dictionary";
import { LOCALE_COOKIE } from "./locale-cookie";

/** Server-side locale, read from the cookie the LanguageSwitcher writes. */
export async function getServerLocale(): Promise<Locale> {
  try {
    const store = await cookies();
    return store.get(LOCALE_COOKIE)?.value === "si" ? "si" : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

/** Server-side translator — use inside async server components and generateMetadata. */
export async function getServerT(): Promise<(key: string) => string> {
  const locale = await getServerLocale();
  const dict = dictionaries[locale];
  const fallback = dictionaries[DEFAULT_LOCALE];
  return (key: string) => dict[key] ?? fallback[key] ?? key;
}
