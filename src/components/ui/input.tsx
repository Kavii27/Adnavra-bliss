import * as React from "react";

export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-[#E5DDD0] bg-[#FDF9F3] px-3 py-2 text-sm text-[#1F1E1D] placeholder:text-[#8A8377] focus:outline-none focus:border-[#1F1E1D] focus:ring-1 focus:ring-[#1F1E1D] disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
