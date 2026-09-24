"use client";
import { useState, useTransition } from "react";
import { Loader2, AlertCircle, Check, Eye, EyeOff } from "lucide-react";
import { signOut } from "next-auth/react";
import { Input } from "@/components/ui/input";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/customers/me/password", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((data as { error?: string }).error ?? "Unable to change password");
          return;
        }
        setSuccess("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex gap-2 rounded-xl border border-[#FDECEC] bg-[#FDECEC] px-3 py-2.5 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#B91C1C]" />
          <span className="text-[#4A4640]">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex gap-2 rounded-xl border border-[#DCF5E7] bg-[#DCF5E7] px-3 py-2.5 text-sm">
          <Check className="h-4 w-4 shrink-0 mt-0.5 text-[#15803D]" />
          <span className="text-[#4A4640]">{success}</span>
        </div>
      )}

      <div>
        <label htmlFor="currentPassword" className="text-sm font-medium text-[#1F1E1D]">
          Current password
        </label>
        <div className="relative mt-1.5">
          <Input
            id="currentPassword"
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            disabled={pending}
            className="pr-10 bg-white"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#8A8377] hover:text-[#1F1E1D]"
            aria-label={showCurrent ? "Hide" : "Show"}
          >
            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="newPassword" className="text-sm font-medium text-[#1F1E1D]">
          New password
        </label>
        <div className="relative mt-1.5">
          <Input
            id="newPassword"
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            maxLength={100}
            disabled={pending}
            className="pr-10 bg-white"
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#8A8377] hover:text-[#1F1E1D]"
            aria-label={showNew ? "Hide" : "Show"}
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="text-sm font-medium text-[#1F1E1D]">
          Confirm new password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={pending}
          className="mt-1.5 bg-white"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1F1B17] px-7 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-all hover:scale-[1.02] hover:bg-[#795831] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Updating...
          </>
        ) : (
          "Change password"
        )}
      </button>
    </form>
  );
}

export function DeactivateAccount() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDeactivate() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/customers/me", { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((data as { error?: string }).error ?? "Unable to deactivate account");
          return;
        }
        await signOut({ callbackUrl: "/" });
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#4A4640]">
        Deactivating your account will sign you out immediately. You will not be able to log in again. Your past bookings will
        remain linked for salon records.
      </p>
      {error && (
        <div className="flex gap-2 rounded-xl border border-[#FDECEC] bg-[#FDECEC] px-3 py-2.5 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#B91C1C]" />
          <span className="text-[#4A4640]">{error}</span>
        </div>
      )}
      {!confirmOpen ? (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="inline-flex h-11 items-center justify-center rounded-full border border-[#FDECEC] bg-white px-6 text-[12px] font-bold uppercase tracking-[0.14em] text-[#B91C1C] transition-colors hover:bg-[#FDECEC]"
        >
          Deactivate account
        </button>
      ) : (
        <div className="rounded-xl border border-[#FDECEC] bg-[#FDECEC]/40 p-4 space-y-3">
          <p className="text-sm font-medium text-[#1F1E1D]">Are you sure? This cannot be undone without contacting support.</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={pending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#B91C1C] px-6 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#991B1B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Deactivating...
                </>
              ) : (
                "Yes, deactivate"
              )}
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#E5DDD0] bg-white px-6 text-[12px] font-bold uppercase tracking-[0.14em] text-[#1F1E1D] transition-colors hover:bg-[#FBF7EF] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
