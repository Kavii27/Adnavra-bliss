import { NextResponse } from "next/server";

// Placeholder for future payment gateway callbacks (out of MVP scope)
export async function POST() {
  return NextResponse.json({ message: "Webhooks not yet implemented (Phase 2)" }, { status: 501 });
}
