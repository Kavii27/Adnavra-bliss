"use client";
import { useEffect, useState } from "react";
import { Loader2, QrCode, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";

export function QrCard({ slug, businessId }: { slug?: string; businessId?: string }) {
  const { t } = useLocale();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const endpoint = businessId ? `/api/businesses/${businessId}/qr` : slug ? `/api/qr/by-slug/${encodeURIComponent(slug)}` : null;
        if (!endpoint) throw new Error("No identifier");
        const r = await fetch(endpoint);
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? t("booking.qr.failed"));
        setDataUrl(j.data.qrDataUrl);
        setUrl(j.data.url);
      } catch (e: unknown) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    if (slug || businessId) load();
    // t() omitted: error fallback text does not need a refetch on locale switch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, businessId]);

  if (loading) return <div className="flex items-center gap-2 text-sm text-[#8A8377]"><Loader2 className="h-4 w-4 animate-spin" /> {t("booking.qr.generating")}</div>;
  if (error) return <p className="text-sm text-[#B91C1C]">{error}</p>;
  if (!dataUrl) return null;

  return (
    <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-6 flex flex-col items-center text-center">
      <div className="flex items-center gap-2 text-sm font-medium text-white"><QrCode className="h-4 w-4 text-[#C9C1B4]" /> {t("booking.qr.title")}</div>
      <p className="text-xs text-[#C9C1B4] mt-1">{t("booking.qr.sub")}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt={t("booking.qr.alt")} className="mt-4 h-52 w-52 shrink-0 rounded-xl border border-[#e6dcc8] bg-white p-2 object-contain" />
      {url && <p className="mt-3 max-w-full break-all px-2 text-xs leading-relaxed text-[#C9C1B4]">{url}</p>}
      <a href={dataUrl} download={`adnavra-${slug ?? businessId}-qr.png`} className="mt-4">
        <Button variant="secondary" className="h-9 bg-white text-[#1F1E1D] hover:bg-white/90 border-white text-xs"><Download className="h-3.5 w-3.5 mr-1" /> {t("booking.qr.download")}</Button>
      </a>
    </div>
  );
}
