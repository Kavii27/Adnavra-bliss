"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Root layout error boundary. Minimal, and it never leaks the stack in production.
  return (
    <html lang="en">
      <body className="bg-[#faf6ef] text-[#3a2f22] antialiased">
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-md w-full rounded-lg border border-[#E3E8F0] bg-white p-8 text-center">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-[#a89880]">Please try again later.</p>
            <button onClick={() => reset()} className="mt-6 inline-flex h-9 items-center rounded-md bg-[#8a6d4f] px-4 text-sm font-medium text-white">
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
