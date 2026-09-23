"use client";

import { Suspense, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2, Mail, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [mode] = useState<"request" | "reset">(tokenFromUrl ? "reset" : "request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 429) {
          setError("Too many requests. Please try again later.");
        } else {
          setError(data?.error ?? "Unable to process request.");
        }
        return;
      }
      setSuccess(data?.message ?? "If that email exists, we sent a reset link. Check your inbox.");
    });
  }

  function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 429) {
          setError("Too many attempts. Please try again later.");
        } else {
          setError(data?.error ?? "Unable to reset password.");
        }
        return;
      }
      setSuccess(data?.message ?? "Password reset. You can now sign in.");
      setTimeout(() => router.push("/login"), 1400);
    });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FDF9F3] px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex text-lg font-semibold tracking-tight text-[#1F1E1D]">
            ADNAVRA
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-[-0.5px] text-[#1F1E1D]">
            {mode === "reset" ? "Set a new password" : "Reset your password"}
          </h1>
          <p className="mt-1 text-sm text-[#8A7F6E]">
            {mode === "reset"
              ? "Enter the token from your email and choose a new password."
              : "We will send a single-use, time-limited link to your email."}
          </p>
        </div>

        <div className="rounded-lg border border-[#E5DDD0] bg-white p-8 shadow-[0_1px_2px_rgba(30,28,26,0.05)]">
          {error && (
            <div className="mb-4 flex gap-2 rounded-md border border-[#F0E6D6] bg-[#F5EFE4] px-3 py-2 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#B91C1C]" />
              <span className="text-[#4A4640]">{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 flex gap-2 rounded-md border border-[#DCF5E7] bg-[#F5EFE4] px-3 py-2 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#15803D]" />
              <span className="text-[#4A4640]">{success}</span>
            </div>
          )}

          {mode === "request" ? (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label htmlFor="email" className="text-sm font-medium text-[#1F1E1D]">
                  Email
                </label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7F6E]" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-9"
                    disabled={isPending}
                  />
                </div>
              </div>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending link…
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
              <p className="text-center text-sm text-[#8A7F6E]">
                Remembered?{" "}
                <Link href="/login" className="font-medium text-[#795831] hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label htmlFor="token" className="text-sm font-medium text-[#1F1E1D]">
                  Reset token
                </label>
                <div className="relative mt-1.5">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7F6E]" />
                  <Input
                    id="token"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste token from email"
                    className="pl-9"
                    disabled={isPending}
                  />
                </div>
                <p className="mt-1 text-xs text-[#8A7F6E]">Single-use, expires in 1 hour.</p>
              </div>
              <div>
                <label htmlFor="password" className="text-sm font-medium text-[#1F1E1D]">
                  New password
                </label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="mt-1.5"
                  disabled={isPending}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label htmlFor="confirm" className="text-sm font-medium text-[#1F1E1D]">
                  Confirm password
                </label>
                <Input
                  id="confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className="mt-1.5"
                  disabled={isPending}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting…
                  </>
                ) : (
                  "Reset password"
                )}
              </Button>
              <div className="flex justify-between text-sm">
                <Link href="/reset-password" onClick={() => setToken("")} className="text-[#8A7F6E] hover:text-[#1F1E1D]">
                  Request a new link
                </Link>
                <Link href="/login" className="font-medium text-[#795831] hover:underline">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDF9F3]" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
