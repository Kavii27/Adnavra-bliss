"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Copy, Loader2, Store, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SalonTypePicker } from "@/components/business/category-picker";

type CreatedPayload = {
  business: { id: string; name: string; slug: string };
  owner: { id: string; email: string; name: string | null };
};

/**
 * Admin "Add salon" form (Task 3.2).
 * Submits to POST /api/admin/businesses and reveals the one-time
 * temporary password in a copy-now box. Loading + error states included
 * per AGENTS.md (every feature needs them, not just the happy path).
 */
export function CreateBusinessForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [salonTypes, setSalonTypes] = useState<string[]>([]);
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<(CreatedPayload & { temporaryPassword: string }) | null>(null);
  const [copied, setCopied] = useState(false);

  // Tracked individually so the form can say WHICH field is outstanding instead
  // of leaving a dead, disabled button with no explanation.
  const hasName = name.trim().length > 0;
  const hasSlug = slug.trim().length >= 3;
  const hasOwnerName = ownerName.trim().length > 0;
  const hasOwnerEmail = ownerEmail.trim().length > 0;
  const canSubmit = hasName && hasSlug && hasOwnerName && hasOwnerEmail;

  const missingLabels: string[] = [];
  if (!hasName) missingLabels.push("Salon name");
  if (!hasSlug) missingLabels.push("Public URL slug (3+ characters)");
  if (!hasOwnerName) missingLabels.push("Owner name");
  if (!hasOwnerEmail) missingLabels.push("Owner email");

  function fieldClass(invalid: boolean) {
    return invalid ? "mt-1 border-[#B91C1C] focus:border-[#B91C1C] focus:ring-[#B91C1C]" : "mt-1";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setAttempted(true);
    if (!canSubmit) {
      setError(`Fill in the required fields first: ${missingLabels.join(", ")}.`);
      return;
    }
    setSubmitting(true);
    setError(null);
    setCopied(false);
    try {
      const r = await fetch("/api/admin/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          salonTypes,
          ownerName: ownerName.trim(),
          ownerEmail: ownerEmail.trim().toLowerCase(),
          ownerPhone: ownerPhone.trim() || undefined,
        }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error ?? "Failed to create salon");
      setCreated({
        business: j.data.business,
        owner: j.data.owner,
        temporaryPassword: j.temporaryPassword,
      });
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Copy failed — select the password manually.");
    }
  }

  if (created) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 rounded-lg border border-[#DCF5E7] bg-[#DCF5E7] p-4 text-sm font-medium text-[#15803D]">
          <Check className="h-4 w-4 shrink-0" />
          Salon created — {created.business.name} (/{created.business.slug}) with owner {created.owner.email}.
        </div>
        <section className="rounded-lg border border-[#E3E8F0] bg-white p-6">
          <h2 className="text-sm font-semibold text-[#3a2f22]">Temporary password — copy it now</h2>
          <p className="mt-1 text-xs text-[#a89880]">
            This is shown once and never stored. Send it to the salon owner (e.g. via WhatsApp) and ask them to log
            in and change it immediately.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <code className="flex-1 rounded-md border border-[#E3E8F0] bg-[#faf6ef] px-3 py-2 font-mono text-sm text-[#3a2f22]">
              {created.temporaryPassword}
            </code>
            <Button
              type="button"
              onClick={handleCopy}
              className="bg-[#3a2f22] text-white hover:bg-[#5f4630]"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </>
              )}
            </Button>
          </div>
          <p className="mt-3 text-xs text-[#a89880]">
            Owner login: {created.owner.email} · Business page:{" "}
            <a href={`/${created.business.slug}`} className="font-medium text-[#8a6d4f] hover:underline">
              /{created.business.slug}
            </a>
          </p>
        </section>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => router.push(`/admin/businesses/${created.business.id}`)}
            className="bg-[#8a6d4f] text-white hover:bg-[#5f4630]"
          >
            Open salon detail — add services
          </Button>
          <Button
            type="button"
            onClick={() => {
              setCreated(null);
              setAttempted(false);
              setName("");
              setSlug("");
              setPhone("");
              setEmail("");
              setAddress("");
              setCity("");
              setSalonTypes([]);
              setOwnerName("");
              setOwnerEmail("");
              setOwnerPhone("");
            }}
            className="border border-[#E3E8F0] bg-white text-[#3a2f22] hover:bg-[#faf6ef]"
          >
            Add another salon
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-[#FDECEC] bg-[#FDECEC] p-3 text-sm font-medium text-[#B91C1C]">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <section className="rounded-lg border border-[#E3E8F0] bg-white p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#3a2f22]">
          <Store className="h-4 w-4 text-[#8a6d4f]" /> Salon details
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="biz-name" className="text-sm font-medium text-[#3a2f22]">
              Salon name *
            </label>
            <Input
              id="biz-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Glow Salon"
              required
              className={fieldClass(attempted && !hasName)}
            />
          </div>
          <div>
            <label htmlFor="biz-slug" className="text-sm font-medium text-[#3a2f22]">
              Public URL slug *
            </label>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-[#a89880]">/</span>
              <Input
                id="biz-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="glow-salon"
                required
                minLength={3}
                className={fieldClass(attempted && !hasSlug)}
              />
            </div>
            {slug.trim() && <p className="mt-1 text-xs text-[#a89880]">Public page: /{slug.trim().toLowerCase()}</p>}
          </div>
          <div>
            <label htmlFor="biz-phone" className="text-sm font-medium text-[#3a2f22]">
              Phone
            </label>
            <Input
              id="biz-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+94 ..."
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="biz-email" className="text-sm font-medium text-[#3a2f22]">
              Contact email
            </label>
            <Input
              id="biz-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@..."
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="biz-address" className="text-sm font-medium text-[#3a2f22]">
              Address
            </label>
            <Input
              id="biz-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, area..."
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="biz-city" className="text-sm font-medium text-[#3a2f22]">
              City
            </label>
            <Input
              id="biz-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Colombo"
              className="mt-1"
            />
          </div>
        </div>
        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-[#3a2f22]">Salon type</legend>
          <p className="mt-0.5 text-xs text-[#a89880]">Tags shown on the marketplace card and public page. Pick up to 4.</p>
          <div className="mt-2">
            <SalonTypePicker value={salonTypes} onChange={setSalonTypes} idPrefix="create-salon-type" />
          </div>
        </fieldset>
      </section>

      <section className="rounded-lg border border-[#E3E8F0] bg-white p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#3a2f22]">
          <User className="h-4 w-4 text-[#8a6d4f]" /> Owner login
        </h2>
        <p className="mt-1 text-xs text-[#a89880]">
          The owner signs in with this email plus the temporary password you receive after creating the salon.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="owner-name" className="text-sm font-medium text-[#3a2f22]">
              Owner name *
            </label>
            <Input
              id="owner-name"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Ayesha Perera"
              required
              className={fieldClass(attempted && !hasOwnerName)}
            />
          </div>
          <div>
            <label htmlFor="owner-email" className="text-sm font-medium text-[#3a2f22]">
              Owner email *
            </label>
            <Input
              id="owner-email"
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="owner@..."
              required
              className={fieldClass(attempted && !hasOwnerEmail)}
            />
          </div>
          <div>
            <label htmlFor="owner-phone" className="text-sm font-medium text-[#3a2f22]">
              Owner phone <span className="font-normal text-[#a89880]">(optional)</span>
            </label>
            <Input
              id="owner-phone"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              placeholder="+94 ..."
              className="mt-1"
            />
          </div>
        </div>
      </section>

      {/* Stays clickable while fields are outstanding — a disabled button here
          looked broken. Only the in-flight request disables it. */}
      {!canSubmit ? (
        <p className="text-xs text-[#a89880]">
          Still needed: <span className="font-medium text-[#8a6d4f]">{missingLabels.join(", ")}</span>
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={submitting}
        className="bg-[#8a6d4f] text-white hover:bg-[#5f4630] disabled:opacity-50 disabled:pointer-events-none"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating salon...
          </>
        ) : (
          "Create salon + owner login"
        )}
      </Button>
    </form>
  );
}
