"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signOut, getSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  // Entered via the footer "Admin" link (/login?callbackUrl=/admin):
  // same credentials flow, but platform-console branding so admins know
  // they are in the right place.
  const isAdminLogin = callbackUrl.startsWith("/admin");

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
        setError("Invalid email or password");
        return;
      }
      if (res.error) {
        // Rate-limit surfaces as AccessDenied (see lib/auth.ts); bad creds as CredentialsSignin
        if (
          res.error === "AccessDenied" ||
          res.error.includes("Too many") ||
          (res as unknown as { code?: string }).code?.includes("Too many")
        ) {
          setError("Too many login attempts. Please try again in 15 minutes.");
        } else {
          setError("Invalid email or password");
        }
        return;
      }
      if (res.ok) {
        // Wrong-audience guard: a CUSTOMER must not stay signed in on the business login.
        try {
          const session = await getSession();
          let role = (session?.user as unknown as { role?: string })?.role;
          if (!role) {
            const r = await fetch("/api/auth/session").then((x) => x.json()).catch(() => null);
            role = r?.user?.role ?? null;
          }
          if (role === "CUSTOMER") {
            await signOut({ redirect: false });
            setWrongAudience({ role });
            setError("This looks like a customer account. Log in at the customer login instead.");
            return;
          }
        } catch {
          // If session fetch fails, proceed to redirect rather than bricking login.
        }
        router.push(callbackUrl);
        router.refresh();
      }
    });
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-[#faf6ef]">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-[#3a2f22]">
            <Image src="/logo.png" alt="ADNAVRA logo" width={28} height={28} className="h-7 w-7 rounded-md object-contain" />
            ADNAVRA{" "}
            <span className="font-medium tracking-[0.22em] text-[#a89880] text-sm">BLISS</span>{" "}
            <span className="text-[#a89880] font-normal ml-2 text-sm">
              {isAdminLogin ? "platform console" : "for professionals"}
            </span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-[#3a2f22]">
            {isAdminLogin ? "Admin sign in" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-[#a89880]">
            {isAdminLogin ? "Sign in with your admin account to manage the platform" : "Sign in to manage your salon"}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="flex gap-2 rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#F87171]" />
                <span className="text-[#a89880]">
                  {error}{" "}
                  {wrongAudience.role === "CUSTOMER" && (
                    <Link href="/customer/login" className="font-medium text-[#C9A66B] hover:underline">
                      Go to customer login
                    </Link>
                  )}
                </span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="text-sm font-medium text-[#3a2f22]">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#8A7F6E]"
                disabled={isPending}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-[#3a2f22]">
                  Password
                </label>
                <Link href="/reset-password" className="text-xs font-medium text-[#C9A66B] hover:underline">
                  Forgot password?
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
                  className="pr-10 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#8A7F6E]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#8A7F6E] hover:text-[#3a2f22]"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={isPending} variant="gradient" className="w-full">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          {!isAdminLogin && (
            <p className="mt-8 text-center text-sm text-[#a89880]">
              No account?{" "}
              <Link href="/signup" className="font-medium text-[#C9A66B] hover:underline">
                Create one
              </Link>
            </p>
          )}
          {isAdminLogin && (
            <p className="mt-8 text-center text-sm text-[#a89880]">
              Admin accounts are created by the platform team — there is no self sign-up.
            </p>
          )}
        </div>
      </div>

      {/* Right panel — sticky to the viewport so it never scrolls with the form */}
      <div className="hidden lg:block relative lg:sticky lg:top-0 lg:h-screen overflow-hidden">
        <Image src="/signin-img.jpg" alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />
        <div className="relative h-full flex items-end p-14">
          <div className="text-white max-w-sm">
            <p className="text-2xl font-semibold leading-snug">
              {isAdminLogin ? "Run the platform." : "Your business, booked."}
            </p>
            <p className="mt-3 text-white/85 text-sm">
              {isAdminLogin
                ? "Onboard salons, manage their services and photos, and assign subscription plans."
                : "Manage appointments, staff, and customers from one dashboard built for Sri Lankan salons."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf6ef]" />}>
      <LoginForm />
    </Suspense>
  );
}
