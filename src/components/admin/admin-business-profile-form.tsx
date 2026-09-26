"use client";

import { useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SalonTypePicker } from "@/components/business/category-picker";
import { getCategoryLabel } from "@/lib/categories";

type Props = {
  businessId: string;
  initial: {
    name: string;
    slug: string;
    description: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    district: string;
    categories: string[];
    salonTypes: string[];
  };
};

/**
 * Admin-side profile editor (Task 3.4).
 * Edits identity fields + salon-type tags via the shared SalonTypePicker,
 * calling the same PATCH /api/businesses/[id] endpoint the owner's
 * Settings page uses (ADMIN bypass is enforced server-side).
 */
export function AdminBusinessProfileForm({ businessId, initial }: Props) {
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [description, setDescription] = useState(initial.description);
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [address, setAddress] = useState(initial.address);
  const [city, setCity] = useState(initial.city);
  const [district, setDistrict] = useState(initial.district);
  const [salonTypes, setSalonTypes] = useState<string[]>(initial.salonTypes);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      if (!name.trim() || !slug.trim()) throw new Error("Salon name and slug are required.");
      const r = await fetch(`/api/businesses/${businessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          description: description.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          district: district.trim() || null,
          salonTypes,
        }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error ?? "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-[#E3E8F0] bg-white p-6">
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#FDECEC] bg-[#FDECEC] p-3 text-sm font-medium text-[#B91C1C]">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {saved && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[#DCF5E7] bg-[#DCF5E7] p-3 text-sm font-medium text-[#15803D]">
          <Check className="h-4 w-4 shrink-0" /> Saved successfully
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="admin-biz-name" className="text-sm font-medium text-[#3a2f22]">
            Salon name *
          </label>
          <Input id="admin-biz-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 bg-white" />
        </div>
        <div>
          <label htmlFor="admin-biz-slug" className="text-sm font-medium text-[#3a2f22]">
            Public URL slug *
          </label>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-[#a89880]">/</span>
            <Input
              id="admin-biz-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              className="bg-white"
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="admin-biz-desc" className="text-sm font-medium text-[#3a2f22]">
            Description
          </label>
          <textarea
            id="admin-biz-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What makes this salon special?"
            className="mt-1 w-full rounded-md border border-[#E5DDD0] bg-white px-3 py-2 text-sm text-[#1F1E1D] placeholder:text-[#8A8377] focus:border-[#1F1E1D] focus:outline-none focus:ring-1 focus:ring-[#1F1E1D]"
          />
        </div>
        <div>
          <label htmlFor="admin-biz-phone" className="text-sm font-medium text-[#3a2f22]">
            Phone
          </label>
          <Input id="admin-biz-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 bg-white" />
        </div>
        <div>
          <label htmlFor="admin-biz-email" className="text-sm font-medium text-[#3a2f22]">
            Contact email
          </label>
          <Input
            id="admin-biz-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 bg-white"
          />
        </div>
        <div>
          <label htmlFor="admin-biz-address" className="text-sm font-medium text-[#3a2f22]">
            Address
          </label>
          <Input id="admin-biz-address" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 bg-white" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="admin-biz-city" className="text-sm font-medium text-[#3a2f22]">
              City
            </label>
            <Input id="admin-biz-city" value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 bg-white" />
          </div>
          <div>
            <label htmlFor="admin-biz-district" className="text-sm font-medium text-[#3a2f22]">
              District
            </label>
            <Input
              id="admin-biz-district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="mt-1 bg-white"
            />
          </div>
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-[#3a2f22]">Salon type</legend>
        <p className="mt-0.5 text-xs text-[#a89880]">
          Same picker as the owner&apos;s Settings page, tags the marketplace card and public page. Pick up to 4.
        </p>
        <div className="mt-2">
          <SalonTypePicker value={salonTypes} onChange={setSalonTypes} idPrefix={`admin-${businessId}-salon-type`} />
        </div>
      </fieldset>

      {initial.categories.length > 0 && (
        <div className="mt-5 rounded-md bg-[#faf6ef] p-3">
          <p className="text-xs font-medium text-[#3a2f22]">Onboarding categories (set during signup, read-only here)</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {initial.categories.map((c) => (
              <span
                key={c}
                className="inline-flex items-center rounded-full bg-[#E7ECF2] px-2 py-0.5 text-[11px] font-medium text-[#3a2f22]"
              >
                {getCategoryLabel(c)}
              </span>
            ))}
          </div>
        </div>
      )}

      <Button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-5 bg-[#8a6d4f] text-white hover:bg-[#5f4630] disabled:opacity-50"
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
          </>
        ) : (
          "Save profile"
        )}
      </Button>
    </div>
  );
}
