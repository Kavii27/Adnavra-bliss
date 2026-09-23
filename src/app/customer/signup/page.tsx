"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function CustomerSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/customer/account/activity";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [countryCode, setCountryCode] = useState("+94");
  const [mobile, setMobile] = useState("");
  const [country, setCountry] = useState("Sri Lanka");
  const [agreed, setAgreed] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload: Record<string, string> = {
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        role: "CUSTOMER",
      };
      if (mobile.trim()) payload.phone = `${countryCode}${mobile.trim()}`;

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = data?.error ?? "Unable to create account.";
        if (res.status === 429) {
          setError("Too many signup attempts. Please try again later.");
        } else if (data?.details) {
          const flat = data.details?.fieldErrors ?? data.details;
          const first = Object.values(flat as Record<string, string[]>).flat()[0];
          setError(first ?? msg);
        } else {
          setError(msg);
        }
        return;
      }
      setSuccess(true);
      // Auto sign in as customer and go to /customer
      const signInRes = await signIn("credentials", {
        email: payload.email,
        password,
        redirect: false,
      });
      if (signInRes?.ok) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        setTimeout(() => router.push(`/customer/login?callbackUrl=${encodeURIComponent(callbackUrl)}`), 1200);
      }
    });
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FDF9F3] px-6">
        <div className="w-full max-w-md rounded-lg border border-[#E5DDD0] bg-white p-8 text-center shadow-[0_2px_8px_rgba(16,24,40,0.06)]">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#DCF5E7]">
            <CheckCircle2 className="h-5 w-5 text-[#15803D]" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-[#1F1E1D]">Account created</h1>
          <p className="mt-2 text-sm text-[#4A4640]">Redirecting you to ADNAVRA for customers...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-[#FDF9F3]">
      <div className="flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-[#1F1E1D]">
            <Image src="/logo.png" alt="ADNAVRA logo" width={28} height={28} className="h-7 w-7 rounded-md object-contain" />
            ADNAVRA <span className="text-[#8A7F6E] font-normal ml-2 text-sm">for customers</span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-[#1F1E1D]">Create your account</h1>
          <p className="mt-1 text-sm text-[#4A4640]">Book appointments at top-rated salons near you</p>
          <p className="mt-2 text-sm text-[#4A4640]">
            Signing up to book appointments. Own a salon?{" "}
            <Link href="/signup" className="font-medium text-[#795831] hover:underline">
              Create a business account
            </Link>
            .
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="flex gap-2 rounded-md border border-[#FDECEC] bg-[#FDECEC] px-3 py-2 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#B91C1C]" />
                <span className="text-[#4A4640]">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="name" className="text-sm font-medium text-[#1F1E1D]">
                Full name
              </label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Amaya Perera"
                className="mt-1.5 bg-white border-[#E5DDD0] text-[#1F1E1D] placeholder:text-[#8A7F6E]"
                disabled={isPending}
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-[#1F1E1D]">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5 bg-white border-[#E5DDD0] text-[#1F1E1D] placeholder:text-[#8A7F6E]"
                disabled={isPending}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-[#1F1E1D]">
                Password
              </label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="pr-10 bg-white border-[#E5DDD0] text-[#1F1E1D] placeholder:text-[#8A7F6E]"
                  disabled={isPending}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#8A7F6E] hover:text-[#1F1E1D]"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-[110px_1fr] gap-2">
              <div>
                <label className="text-sm font-medium text-[#1F1E1D]">Country code</label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-[#E5DDD0] bg-white px-2 text-sm text-[#1F1E1D]"
                  disabled={isPending}
                >
                  <option value="+94">+94</option>
                </select>
              </div>
              <div>
                <label htmlFor="mobile" className="text-sm font-medium text-[#1F1E1D]">
                  Mobile number
                </label>
                <Input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="77 123 4567"
                  className="mt-1.5 bg-white border-[#E5DDD0] text-[#1F1E1D] placeholder:text-[#8A7F6E]"
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#1F1E1D]">Country</label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled
                className="mt-1.5 bg-[#F7F3ED] border-[#E5DDD0] text-[#1F1E1D] disabled:opacity-60"
              />
              <p className="mt-1 text-xs text-[#8A7F6E]">ADNAVRA currently supports customers in Sri Lanka only.</p>
            </div>

            <label className="flex items-start gap-2 text-xs text-[#4A4640]">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-[#795831]"
                required
              />
              <span>
                I agree to the{" "}
                <Link href="/privacy" className="text-[#795831] hover:underline">
                  Privacy Policy
                </Link>
                ,{" "}
                <Link href="/terms" className="text-[#795831] hover:underline">
                  Terms of Service
                </Link>{" "}
                and Terms of Business.
              </span>
            </label>

            <Button type="submit" disabled={isPending || !agreed} variant="gradient" className="w-full">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E5DDD0]" />
            <span className="text-xs text-[#8A7F6E]">OR</span>
            <div className="h-px flex-1 bg-[#E5DDD0]" />
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl })}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-[#E5DDD0] bg-white h-10 text-sm font-medium text-[#1F1E1D] hover:bg-[#FDF9F3]"
            >
              Continue with Google
            </button>
            <button
              type="button"
              disabled
              className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-[#E5DDD0] bg-[#FDF9F3] h-10 text-sm font-medium text-[#8A7F6E] cursor-not-allowed"
            >
              Continue with WhatsApp <span className="text-xs">(coming soon)</span>
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-[#4A4640]">
            Already have an account?{" "}
            <Link href={`/customer/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-[#795831] hover:underline">
              Sign in
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-[#4A4640]">
            Own a salon?{" "}
            <Link href="/signup" className="font-medium text-[#1F1E1D] hover:underline">
              Go to ADNAVRA for business
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel — sticky to the viewport, stays put while the long form scrolls */}
      <div className="hidden lg:block relative lg:sticky lg:top-0 lg:h-screen overflow-hidden">
        <Image src="/signup-img.jpg" alt="" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />
        <div className="relative h-full flex items-end p-14">
          <div className="text-white max-w-sm">
            <p className="text-2xl font-semibold leading-snug">Discover and book, anytime.</p>
            <p className="mt-3 text-white/85 text-sm">
              Find top-rated salons near you and book appointments in seconds. Your next look is one tap away.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CustomerSignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDF9F3]" />}>
      <CustomerSignupForm />
    </Suspense>
  );
}
