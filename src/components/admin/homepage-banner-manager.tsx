"use client";

import Image from "next/image";
import { FormEvent, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, Save, Upload } from "lucide-react";
import { safeDestinationUrlSchema, type HomepageBannerSetting } from "@/schemas/platformSettings";

type Props = {
  initialSetting: HomepageBannerSetting;
};

type ApiResponse = {
  data?: {
    setting: HomepageBannerSetting;
  };
  error?: string;
};

const inputClass =
  "h-10 w-full rounded-lg border border-[#E3E8F0] bg-[#faf6ef] px-3 text-sm text-[#3a2f22] outline-none focus:border-[#8a6d4f] disabled:cursor-not-allowed disabled:opacity-60";

export function HomepageBannerManager({ initialSetting }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [setting, setSetting] = useState(initialSetting);
  const [destinationUrl, setDestinationUrl] = useState(initialSetting.destinationUrl);
  const [fileName, setFileName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = safeDestinationUrlSchema.safeParse(destinationUrl);
    if (!parsed.success) {
      setError("Use an internal path starting with / or an HTTPS URL");
      setSuccess(null);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const form = new FormData();
      form.set("destinationUrl", parsed.data);
      const selectedFile = fileRef.current?.files?.[0];
      if (selectedFile && selectedFile.size > 0) form.set("file", selectedFile);

      const response = await fetch("/api/admin/platform-settings", {
        method: "POST",
        body: form,
      });
      const json = (await response.json().catch(() => null)) as ApiResponse | null;
      if (!response.ok || !json?.data?.setting) {
        throw new Error(json?.error ?? "Could not save the homepage banner");
      }

      setSetting(json.data.setting);
      setDestinationUrl(json.data.setting.destinationUrl);
      setFileName(null);
      if (fileRef.current) fileRef.current.value = "";
      formRef.current?.reset();
      setSuccess("Homepage banner saved and is live.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the homepage banner");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
      <form ref={formRef} onSubmit={handleSubmit} className="rounded-2xl border border-[#E3E8F0] bg-white p-6 shadow-[0_1px_2px_rgba(58,47,34,0.04)]">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3F2] text-[#8a6d4f]">
            <Upload className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-[#3a2f22]">Banner settings</h2>
            <p className="text-sm text-[#a89880]">JPEG, PNG, or WebP up to 8MB. Images are resized to 2000px and stored as WebP.</p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#3a2f22]">Destination link</span>
            <input
              type="text"
              value={destinationUrl}
              onChange={(event) => {
                setDestinationUrl(event.target.value);
                setError(null);
                setSuccess(null);
              }}
              placeholder="/for-business or https://example.com"
              disabled={saving}
              className={inputClass}
              autoComplete="url"
            />
            <span className="block text-xs text-[#a89880]">Internal links must start with /. External links must use HTTPS.</span>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#3a2f22]">Replacement image</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={saving}
              onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
              className="block w-full text-sm text-[#3a2f22] file:mr-3 file:rounded-lg file:border-0 file:bg-[#EAF3F2] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-[#3a2f22] disabled:opacity-60"
            />
            <span className="block text-xs text-[#a89880]">Leave empty to keep the current image.</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-[#8a6d4f] px-5 text-sm font-semibold text-white transition active:bg-[#5f4630] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : fileName ? "Save image and settings" : "Save settings"}
        </button>

        <div className="mt-4 min-h-5 space-y-2" aria-live="polite">
          {error && (
            <p className="flex items-center gap-2 text-sm font-medium text-[#B91C1C]">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </p>
          )}
          {success && (
            <p className="flex items-center gap-2 text-sm font-medium text-[#15803D]">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> {success}
            </p>
          )}
        </div>
      </form>

      <aside className="rounded-2xl border border-[#E3E8F0] bg-[#faf6ef] p-6">
        <p className="text-sm font-semibold text-[#3a2f22]">Current preview</p>
        <div className="mt-4 overflow-hidden rounded-xl border border-[#E3E8F0] bg-white">
          <Image
            src={setting.imageUrl}
            alt="Current homepage banner"
            width={1200}
            height={500}
            className="aspect-[17/7] w-full object-cover"
            unoptimized
          />
        </div>
        <p className="mt-3 truncate text-xs text-[#a89880]">Image: {setting.imageUrl}</p>
        <a
          href={setting.destinationUrl}
          target={setting.destinationUrl.startsWith("/") ? undefined : "_blank"}
          rel={setting.destinationUrl.startsWith("/") ? undefined : "noreferrer"}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#8a6d4f] hover:underline"
        >
          Open current destination <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </aside>
    </div>
  );
}
