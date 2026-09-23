"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
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
      setTimeout(() => router.push("/login"), 1400);
    });
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#faf6ef] px-6">
        <div className="w-full max-w-md rounded-lg border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#DCF5E7]">
            <CheckCircle2 className="h-5 w-5 text-[#15803D]" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-[#3a2f22]">Account created</h1>
          <p className="mt-2 text-sm text-[#a89880]">Redirecting you to sign in…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-[#faf6ef]">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-[#3a2f22]">
            <Image src="/logo.png" alt="ADNAVRA logo" width={28} height={28} className="h-7 w-7 rounded-md object-contain" />
            ADNAVRA <span className="text-[#a89880] font-normal ml-2 text-sm">for professionals</span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-[#3a2f22]">Create your account</h1>
          <p className="mt-1 text-sm text-[#a89880]">Start managing bookings for your salon</p>
          <p className="mt-2 text-sm text-[#a89880]">
            Creating a business account. Looking to book an appointment instead?{" "}
            <Link href="/customer/signup" className="font-medium text-[#C9A66B] hover:underline">
              Go to the customer site
            </Link>
            .
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="flex gap-2 rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-2 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#F87171]" />
                <span className="text-[#a89880]">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="name" className="text-sm font-medium text-[#3a2f22]">
                Full name
              </label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Amaya Perera"
                className="mt-1.5 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#8A7F6E]"
                disabled={isPending}
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-[#3a2f22]">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@salon.lk"
                className="mt-1.5 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#8A7F6E]"
                disabled={isPending}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-[#3a2f22]">
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
                  className="pr-10 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#8A7F6E]"
                  disabled={isPending}
                  autoComplete="new-password"
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
              <p className="mt-1 text-xs text-[#8A7F6E]">Hashed with bcrypt cost 12. Never stored in plaintext.</p>
            </div>

            <div className="grid grid-cols-[110px_1fr] gap-2">
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Country code</label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-2 text-sm text-[#3a2f22]"
                  disabled={isPending}
                >
                  <option value="+94" className="text-[#1F1E1D]">
                    +94
                  </option>
                </select>
              </div>
              <div>
                <label htmlFor="mobile" className="text-sm font-medium text-[#3a2f22]">
                  Mobile number
                </label>
                <Input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="77 123 4567"
                  className="mt-1.5 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#8A7F6E]"
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#3a2f22]">Country</label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled
                className="mt-1.5 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#8A7F6E] disabled:opacity-60"
              />
              <p className="mt-1 text-xs text-[#8A7F6E]">ADNAVRA currently supports salons in Sri Lanka only.</p>
            </div>

            <label className="flex items-start gap-2 text-xs text-[#a89880]">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-[#795831]"
                required
              />
              <span>
                I agree to the{" "}
                <Link href="/privacy" className="text-[#C9A66B] hover:underline">
                  Privacy Policy
                </Link>
                ,{" "}
                <Link href="/terms" className="text-[#C9A66B] hover:underline">
                  Terms of Service
                </Link>{" "}
                and Terms of Business.
              </span>
            </label>

            <Button type="submit" disabled={isPending || !agreed} variant="gradient" className="w-full">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#f3ebdd]" />
            <span className="text-xs text-[#8A7F6E]">OR</span>
            <div className="h-px flex-1 bg-[#f3ebdd]" />
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl })}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-[#e6dcc8] bg-[#f6efe3] h-10 text-sm font-medium text-[#3a2f22] hover:bg-[#f3ebdd]"
            >
              Continue with Google
            </button>
            <button
              type="button"
              disabled
              className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-[#e6dcc8] bg-[#f6efe3] h-10 text-sm font-medium text-[#3a2f22]/50 cursor-not-allowed"
            >
              Continue with WhatsApp <span className="text-xs">(coming soon)</span>
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-[#a89880]">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[#C9A66B] hover:underline">
              Sign in
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-[#a89880]">
            Looking to book instead?{" "}
            <Link href="/customer/signup" className="font-medium text-[#3a2f22] hover:underline">
              Go to ADNAVRA for customers
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
            <p className="text-2xl font-semibold leading-snug">Your business, booked.</p>
            <p className="mt-3 text-white/85 text-sm">
              Manage appointments, staff, and customers from one dashboard built for Sri Lankan salons.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf6ef]" />}>
      <SignupForm />
    </Suspense>
  );
}
