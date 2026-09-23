"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { ImageUploader } from "@/components/dashboard/image-uploader";

type ImageRow = { id: string; url: string; kind: string; position: number };

type Props = {
  businessId: string;
  businessSlug: string;
  initialLogoUrl: string | null;
  initialImages: ImageRow[];
};

function Thumb({ src, alt, className }: { src: string; alt: string; className: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} />;
}

export function AdminBusinessImagesManager({ businessId, businessSlug, initialLogoUrl, initialImages }: Props) {
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [images, setImages] = useState<ImageRow[]>(initialImages);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(imageId: string) {
    setDeletingId(imageId);
    setError(null);
    try {
      const r = await fetch(`/api/businesses/${businessId}/images?imageId=${encodeURIComponent(imageId)}`, {
        method: "DELETE",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Delete failed");
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  const cover = images.find((img) => img.kind === "cover") ?? null;
  const gallery = images.filter((img) => img.kind === "gallery");

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* ── Logo ── */}
      <section className="rounded-lg border border-[#E3E8F0] bg-white p-6">
        <h2 className="text-sm font-semibold text-[#3a2f22]">Logo</h2>
        <p className="mt-0.5 text-xs text-[#a89880]">Shown on the public page header. Uploading replaces it immediately.</p>
        <div className="mt-4 flex items-center gap-4">
          {logoUrl ? (
            <Thumb src={logoUrl} alt="Current logo" className="h-16 w-16 rounded-full object-cover border border-[#E3E8F0]" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-[#faf6ef] border border-[#E3E8F0] flex items-center justify-center text-xs text-[#a89880]">
              None
            </div>
          )}
          <ImageUploader businessId={businessId} kind="logo" buttonLabel="Replace logo" onUploaded={(url) => setLogoUrl(url)} />
        </div>
      </section>

      {/* ── Cover ── */}
      <section className="rounded-lg border border-[#E3E8F0] bg-white p-6">
        <h2 className="text-sm font-semibold text-[#3a2f22]">Cover photo</h2>
        <p className="mt-0.5 text-xs text-[#a89880]">Banner at the top of the public page. Uploading replaces the current one.</p>
        <div className="mt-4 space-y-3">
          {cover ? (
            <div className="relative overflow-hidden rounded-lg border border-[#E3E8F0]">
              <Thumb src={cover.url} alt="Current cover photo" className="h-48 w-full object-cover" />
              <button
                type="button"
                aria-label="Remove cover photo"
                disabled={deletingId === cover.id}
                onClick={() => handleDelete(cover.id)}
                className="absolute right-2 top-2 rounded-lg bg-black/50 p-2 text-white hover:bg-black/70 disabled:opacity-50"
              >
                {deletingId === cover.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          ) : (
            <p className="text-sm text-[#a89880]">No cover photo.</p>
          )}
          <ImageUploader
            businessId={businessId}
            kind="cover"
            buttonLabel={cover ? "Replace cover photo" : "Upload cover photo"}
            onUploaded={(_url, image) =>
              setImages((prev) => [...prev.filter((img) => img.kind !== "cover"), ...(image ? [image] : [])])
            }
          />
        </div>
      </section>

      {/* ── Gallery ── */}
      <section className="rounded-lg border border-[#E3E8F0] bg-white p-6">
        <h2 className="text-sm font-semibold text-[#3a2f22]">
          Gallery{" "}
          {gallery.length > 0 && <span className="font-normal text-[#a89880]">({gallery.length}/12)</span>}
        </h2>
        <p className="mt-0.5 text-xs text-[#a89880]">Photo strip on the public page. Delete per photo, add with the button below.</p>
        <div className="mt-4 space-y-3">
          {gallery.length === 0 ? (
            <p className="text-sm text-[#a89880]">No gallery photos.</p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {gallery.map((img) => (
                <li key={img.id} className="relative overflow-hidden rounded-lg border border-[#E3E8F0]">
                  <Thumb src={img.url} alt="Gallery photo" className="h-28 w-full object-cover" />
                  <button
                    type="button"
                    aria-label="Delete gallery photo"
                    disabled={deletingId === img.id}
                    onClick={() => handleDelete(img.id)}
                    className="absolute right-1.5 top-1.5 rounded-md bg-black/50 p-1.5 text-white hover:bg-black/70 disabled:opacity-50"
                  >
                    {deletingId === img.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <ImageUploader
            businessId={businessId}
            kind="gallery"
            buttonLabel="Add gallery photo"
            onUploaded={(_url, image) => image && setImages((prev) => [...prev, image])}
          />
        </div>
      </section>

      <p className="text-xs text-[#a89880]">
        Public page:{" "}
        <a href={`/${businessSlug}`} className="font-medium text-[#8a6d4f] hover:underline">
          /{businessSlug}
        </a>
      </p>
    </div>
  );
}
