"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Never render stack traces in production. Show a generic message only.
  const isDev = process.env.NODE_ENV === "development";
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf6ef] px-6">
      <div className="max-w-md w-full rounded-lg border border-[#E3E8F0] bg-white p-8 text-center shadow-[0_2px_8px_rgba(30,28,26,0.06)]">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF3F2]">
          <AlertTriangle className="h-5 w-5 text-[#B91C1C]" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-[#3a2f22]">Something went wrong</h1>
        <p className="mt-2 text-sm text-[#a89880]">
          An unexpected error occurred. Please try again. If the problem continues, contact support.
        </p>
        {isDev && error.message && (
          <pre className="mt-4 max-h-32 overflow-auto rounded bg-[#3a2f22] p-3 text-left text-xs text-[#C4B8B0]">{error.message.slice(0, 500)}</pre>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex h-9 items-center rounded-md bg-[#8a6d4f] px-4 text-sm font-medium text-white hover:bg-[#5f4630]"
          >
            Try again
          </button>
          <Link href="/" className="inline-flex h-9 items-center rounded-md border border-[#E3E8F0] px-4 text-sm font-medium text-[#3a2f22] hover:bg-[#EAF3F2]">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
