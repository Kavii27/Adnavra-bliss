// Cookie name shared by the client switcher, the locale provider, and the
// server helper. Kept in its own module so client components never import
// `next/headers` (via server.ts).
export const LOCALE_COOKIE = "adnavra-locale";

export const LOCALE_MAX_AGE = 31536000; // 1 year
