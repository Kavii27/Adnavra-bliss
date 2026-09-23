import QRCode from "qrcode";

/**
 * Generate a QR code data URL for a given text (server-side).
 * Uses `qrcode` npm package, consistent with Task 5.5.
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  // Error correction M, margin 2, width 320, colors warm neutrals friendly
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
    color: { dark: "#3a2f22", light: "#faf6ef" },
  });
}

export function publicBusinessUrl(slug: string, base?: string): string {
  const origin = base ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${origin.replace(/\/$/, "")}/${slug}`;
}
