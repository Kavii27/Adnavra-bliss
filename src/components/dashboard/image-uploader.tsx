"use client";

import { useRef, useState } from "react";
import { AlertCircle, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const MIN_UPLOAD_WIDTH = 512;
export const MAX_UPLOAD_SIZE_MB = 8;

type UploadedImage = { id: string; url: string; kind: string; position: number };

type Props = {
  businessId: string;
  kind: "logo" | "cover" | "gallery";
  buttonLabel: string;
  onUploaded: (url: string, image: UploadedImage | null) => void;
};

function readWidth(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      URL.revokeObjectURL(url);
      resolve(w);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image. Try a different file."));
    };
    img.src = url;
  });
}

export function ImageUploader({ businessId, kind, buttonLabel, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    // Client-side pre-check — warn immediately instead of waiting on a 422.
    if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Maximum is ${MAX_UPLOAD_SIZE_MB}MB.`);
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Unsupported file type. Use JPEG, PNG, or WebP.");
      return;
    }
    try {
      const width = await readWidth(file);
      if (width < MIN_UPLOAD_WIDTH) {
        setError(`Image is too small (${width}px wide). Please choose one at least ${MIN_UPLOAD_WIDTH}px wide.`);
        return;
      }
    } catch (e) {
      setError((e as Error).message);
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.set("kind", kind);
      form.set("file", file);
      const r = await fetch(`/api/businesses/${businessId}/images`, { method: "POST", body: form });
      const j = (await r.json()) as { data?: { url: string; image: UploadedImage | null }; error?: string };
      if (!r.ok) throw new Error(j.error ?? "Upload failed");
      if (!j.data) throw new Error("Upload failed");
      onUploaded(j.data.url, j.data.image);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-label={buttonLabel}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="border-[#e6dcc8] bg-[#faf6ef] text-[#3a2f22] hover:bg-[#f6efe3] disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading...
          </>
        ) : (
          <>
            <ImagePlus className="h-4 w-4 mr-2" /> {buttonLabel}
          </>
        )}
      </Button>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
