import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf6ef] px-6">
      <div className="max-w-md w-full rounded-lg border border-[#E3E8F0] bg-white p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF3F2]">
          <SearchX className="h-5 w-5 text-[#8a6d4f]" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-[#3a2f22]">Page not found</h1>
        <p className="mt-2 text-sm text-[#a89880]">The page you are looking for does not exist.</p>
        <Link href="/" className="mt-6 inline-flex text-sm font-medium text-[#8a6d4f] hover:underline">
          Go home
        </Link>
      </div>
    </div>
  );
}
