"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, KeyRound, Loader2 } from "lucide-react";

export default function ForceChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/force-change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error ?? "Failed to update password");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#faf6ef] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-[#E3E8F0] bg-white p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3F2] text-[#8a6d4f]">
          <KeyRound className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-[#3a2f22]">Set your password</h1>
        <p className="mt-1 text-sm text-[#a89880]">
          Your account was created with a temporary password. Choose your own password to continue.
        </p>
        <div className="mt-5 space-y-3">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (at least 8 characters)"
            autoComplete="new-password"
            className="h-11 w-full rounded-lg border border-[#E3E8F0] px-3 text-sm text-[#3a2f22] outline-none focus:border-[#8a6d4f]"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            className="h-11 w-full rounded-lg border border-[#E3E8F0] px-3 text-sm text-[#3a2f22] outline-none focus:border-[#8a6d4f]"
          />
        </div>
        {error && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#B91C1C]">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-[linear-gradient(135deg,#3a2f22_0%,#8a6d4f_100%)] text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {saving ? "Saving..." : "Set password and continue"}
        </button>
      </form>
    </div>
  );
}
