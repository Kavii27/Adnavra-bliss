import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateQrDataUrl, publicBusinessUrl } from "@/lib/qr";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth().catch(() => null);
  const role = (session?.user as unknown as { role: string } | undefined)?.role;
  const sessionBusinessId = (session?.user as unknown as { businessId: string | null } | undefined)?.businessId ?? null;

  const business = await db.business.findUnique({ where: { id }, select: { id: true, slug: true, name: true } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only owner/staff of this business or admin can fetch QR via businessId; public can fetch via slug qr endpoint instead.
  // But for dashboard convenience we allow if authenticated owner of this business.
  if (session && role !== "ADMIN" && sessionBusinessId !== id) {
    // If trying to fetch another business's QR while logged in as owner, forbid
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = publicBusinessUrl(business.slug, request.nextUrl.origin);
  const dataUrl = await generateQrDataUrl(url);

  return NextResponse.json({ data: { url, qrDataUrl: dataUrl, slug: business.slug } });
}
