import { redirect } from "next/navigation";

/**
 * The marketplace moved to `/` (Step 7). This route is kept as a thin
 * redirect so old links and bookmarks keep working — not the reverse.
 * Sub-routes (/customer/search, /customer/login, /customer/account/*)
 * are unaffected and keep serving normally.
 */
export default function CustomerRedirect() {
  redirect("/");
}
