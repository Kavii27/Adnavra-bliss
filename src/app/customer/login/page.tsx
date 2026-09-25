"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signOut, getSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";

function CustomerLoginForm() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/customer/account/activity";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wrongAudience, setWrongAudience] = useState<{ role: string | null }>({ role: null });
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setWrongAudience({ role: null });
    startTransition(async () => {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (!res) {
        setError(t("auth.errInvalid"));
        return;
      }
      if (res.error) {
        if (
          res.error === "AccessDenied" ||
          res.error.includes("Too many") ||
          (res as unknown as { code?: string }).code?.includes("Too many")
        ) {
          setError(t("auth.errTooMany"));
        } else {
          setError(t("auth.errInvalid"));
        }
        return;
      }
      if (res.ok) {
        // Wrong-audience guard: OWNER/STAFF/ADMIN must not stay signed in on the customer login.
        try {
          const session = await getSession();
          let role = (session?.user as unknown as { role?: string })?.role;
          if (!role) {
            const r = await fetch("/api/auth/session").then((x) => x.json()).catch(() => null);
            role = r?.user?.role ?? null;
          }
          if (role && role !== "CUSTOMER") {
            await signOut({ redirect: false });
            setWrongAudience({ role });
            setError(t("auth.errBusiness"));
            return;
          }
        } catch {
          // Proceed to redirect if session fetch fails
        }
        router.push(callbackUrl);
        router.refresh();
      }
    });
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-[#FDF9F3]">
      <div className="flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-[#1F1E1D]">
            <Image src="/logo.png" alt="ADNAVRA logo" width={28} height={28} className="h-7 w-7 rounded-md object-contain" />
            ADNAVRA <span className="text-[#8A7F6E] font-normal ml-2 text-sm">{t("auth.forCustomers")}</span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-[#1F1E1D]">{t("auth.welcomeBack")}</h1>
          <p className="mt-1 text-sm text-[#4A4640]">{t("auth.signInSub")}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="flex gap-2 rounded-md border border-[#FDECEC] bg-[#FDECEC] px-3 py-2 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#B91C1C]" />
                <span className="text-[#4A4640]">
                  {error}{" "}
                  {wrongAudience.role && wrongAudience.role !== "CUSTOMER" && (
                    <Link href="/login" className="font-medium text-[#795831] hover:underline">
                      {t("auth.goBusinessLogin")}
                    </Link>
                  )}
                </span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="text-sm font-medium text-[#1F1E1D]">
                {t("auth.email")}
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 bg-white border-[#E5DDD0] text-[#1F1E1D] placeholder:text-[#8A7F6E]"
                disabled={isPending}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-[#1F1E1D]">
                  {t("auth.password")}
                </label>
                <Link href="/reset-password" className="text-xs font-medium text-[#795831] hover:underline">
                  {t("auth.forgot")}
                </Link>
              </div>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isPending}
                  className="pr-10 bg-white border-[#E5DDD0] text-[#1F1E1D] placeholder:text-[#8A7F6E]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#8A7F6E] hover:text-[#1F1E1D]"
                  aria-label={showPw ? t("auth.hidePw") : t("auth.showPw")}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={isPending} variant="gradient" className="w-full">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("auth.signingIn")}
                </>
              ) : (
                t("auth.signIn")
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-[#4A4640]">
            {t("auth.noAccount")}{" "}
            <Link href={`/customer/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-[#795831] hover:underline">
              {t("auth.createOne")}
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-[#4A4640]">
            {t("auth.ownSalon")}{" "}
            <Link href="/login" className="font-medium text-[#1F1E1D] hover:underline">
              {t("auth.goBusiness")}
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel — sticky to the viewport so it never scrolls with the form */}
      <div className="hidden lg:block relative lg:sticky lg:top-0 lg:h-screen overflow-hidden">
        <Image src="/signin-img.jpg" alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />
        <div className="relative h-full flex items-end p-14">
          <div className="text-white max-w-sm">
            <p className="text-2xl font-semibold leading-snug">{t("auth.heroTitle")}</p>
            <p className="mt-3 text-white/85 text-sm">
              {t("auth.heroSub")}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDF9F3]" />}>
      <CustomerLoginForm />
    </Suspense>
  );
}
