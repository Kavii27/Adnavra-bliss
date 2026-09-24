"use client";
import { useState, useTransition } from "react";
import { Loader2, AlertCircle, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ProfileForm({
  initial,
}: {
  initial: { name: string; email: string; phone: string; image: string };
}) {
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [image, setImage] = useState(initial.image);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const payload: Record<string, string | null> = {};
      if (name.trim() !== initial.name) payload.name = name.trim();
      if ((phone.trim() || "") !== (initial.phone || "")) payload.phone = phone.trim() || null;
      if ((image.trim() || "") !== (initial.image || "")) payload.image = image.trim() || null;

      if (Object.keys(payload).length === 0) {
        setError("No changes to save.");
        return;
      }

      try {
        const res = await fetch("/api/customers/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError((data as { error?: string }).error ?? "Unable to update profile");
          return;
        }
        setSuccess("Profile updated");
        // update initial reference by reloading page state via refresh
      } catch {
        setError("Network error. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
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
        <label htmlFor="name" className="text-sm font-medium text-[#1F1E1D]">
          Name
        </label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} className="mt-1.5 bg-white" disabled={pending} />
      </div>

      <div>
        <label htmlFor="email" className="text-sm font-medium text-[#1F1E1D]">
          Email
        </label>
        <Input id="email" value={initial.email} disabled className="mt-1.5 bg-[#FBF7EF] text-[#8A8377]" />
        <p className="mt-1 text-xs text-[#8A8377]">Email cannot be changed. Contact support if needed.</p>
      </div>

      <div>
        <label htmlFor="phone" className="text-sm font-medium text-[#1F1E1D]">
          Phone
        </label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+94 7X XXX XXXX"
          maxLength={20}
          className="mt-1.5 bg-white"
          disabled={pending}
        />
      </div>

      <div>
        <label htmlFor="image" className="text-sm font-medium text-[#1F1E1D]">
          Profile photo URL
        </label>
        <Input
          id="image"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://..."
          className="mt-1.5 bg-white"
          disabled={pending}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1F1B17] px-7 text-[12px] font-bold uppercase tracking-[0.14em] text-white transition-all hover:scale-[1.02] hover:bg-[#795831] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
          </>
        ) : (
          "Save changes"
        )}
      </button>
    </form>
  );
}
