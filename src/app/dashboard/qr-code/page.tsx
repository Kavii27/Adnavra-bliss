"use client";
import { useEffect, useState } from "react";
import { Loader2, QrCode, Printer } from "lucide-react";
import { QrCard } from "@/components/booking/QrCard";
import { PlanGate } from "@/components/dashboard/plan-gate";

type Template = {
  id: string;
  name: string;
  description: string;
  sizeClass: string;
  qrClass: string;
};

const TEMPLATES: Template[] = [
  {
    id: "table-tent",
    name: "Table tent",
    description: "Folded counter display, roughly 4×6 in. Best near the till.",
    sizeClass: "w-80",
    qrClass: "h-44 w-44",
  },
  {
    id: "window-sticker",
    name: "Window sticker",
    description: "Large square for glass doors and mirrors. Scannable from outside.",
    sizeClass: "w-96",
    qrClass: "h-56 w-56",
  },
  {
    id: "business-card",
    name: "Loyalty card insert",
    description: "Small slip for receipts and shopping bags.",
    sizeClass: "w-64",
    qrClass: "h-32 w-32",
  },
];

export default function QrCodePage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>("Your salon");
  const [slug, setSlug] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/businesses")
      .then((r) => r.json())
      .then((j) => {
        const b = j.data?.[0];
        if (b) {
          setBusinessId(b.id);
          setBusinessName(b.name ?? "Your salon");
          setSlug(b.slug);
          return fetch(`/api/businesses/${b.id}/qr`)
            .then((r) => r.json())
            .then((q) => {
              if (q.data?.qrDataUrl) setQrDataUrl(q.data.qrDataUrl);
              if (q.data?.url) setQrUrl(q.data.url);
            })
            .catch(() => null);
        }
        return null;
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-full bg-[#FAF7F2] px-6 py-8">
      <div className="max-w-xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#9A7B4F" }}>QR code</p>
        <div className="mt-1 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#1F1B17] text-white flex items-center justify-center shrink-0">
            <QrCode className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight text-[#1F1B17]">Your booking QR code</h1>
            <p className="text-sm text-[#8A8377] mt-1">Print this and display it at reception, on mirrors, or on business cards.</p>
          </div>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-[#8A8377]"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
          ) : businessId ? (
            <QrCard businessId={businessId} slug={slug ?? undefined} />
          ) : (
            <div className="rounded-2xl border border-dashed border-[#E5DDD0] bg-white p-6 text-center">
              <p className="text-sm text-[#8A8377]">Create your salon profile first to generate a QR code.</p>
            </div>
          )}
        </div>
      </div>

      {/* Premium print materials — downloadable templates per placement */}
      <div className="mt-10 max-w-4xl">
        <div className="flex items-center gap-2">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#1F1B17]">Premium print materials</h2>
          <span className="rounded-full bg-[#1F1B17] px-2 py-0.5 text-[10px] font-bold text-white">PREMIUM</span>
        </div>
        <p className="text-sm text-[#8A8377] mt-1">Sized templates for each spot in your salon. Print straight from the browser.</p>
        <PlanGate feature="premiumQrMaterials">
          {!businessId ? (
            <div className="mt-4 rounded-2xl border border-dashed border-[#E5DDD0] bg-white p-6 text-center">
              <p className="text-sm text-[#8A8377]">Create your salon profile first to preview print templates.</p>
            </div>
          ) : !qrDataUrl ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-[#8A8377]"><Loader2 className="h-4 w-4 animate-spin" /> Preparing templates...</div>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATES.map((t) => (
                <div key={t.id} className="rounded-2xl border border-[#E9E1D3] bg-white shadow-[0_4px_20px_rgba(30,28,26,0.05)] p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-[#1F1E1D]">{t.name}</h3>
                      <p className="text-xs text-[#8A8377] mt-0.5">{t.description}</p>
                    </div>
                    <button onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-full border border-[#E9E1D3] bg-[#FBF7EF] px-3 py-1.5 text-xs font-medium text-[#1F1E1D] hover:bg-[#F3EEE4] shrink-0">
                      <Printer className="h-3.5 w-3.5" /> Print
                    </button>
                  </div>
                  <div className={`mt-4 rounded-xl bg-white p-5 flex flex-col items-center text-center ${t.sizeClass}`}>
                    <p className="text-sm font-semibold text-[#1F1E1D]">{businessName}</p>
                    <p className="text-[11px] text-[#6B7280]">Scan to book your appointment</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt={`${t.name} QR code`} className={`mt-3 rounded-lg border border-[#E9E1D3] bg-white p-2 object-contain ${t.qrClass}`} />
                    {qrUrl && <p className="mt-2 break-all text-[10px] leading-relaxed text-[#6B7280]">{qrUrl}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </PlanGate>
      </div>
    </div>
  );
}
