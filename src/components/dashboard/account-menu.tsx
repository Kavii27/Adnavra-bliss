"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { signOut } from "next-auth/react";

export function AccountMenu({
  userName,
  userInitials,
}: {
  userName: string;
  userInitials: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF3F2] text-xs font-semibold text-[#3a2f22] transition outline-none hover:bg-[#E2E8F9] focus-visible:ring-2 focus-visible:ring-[#8a6d4f]"
      >
        {userInitials}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-lg border border-[#E3E8F0] bg-white py-1.5 shadow-[0_1px_2px_rgba(58,47,34,0.06),0_12px_28px_rgba(58,47,34,0.12)]">
          <div className="px-3.5 pb-1.5 pt-1">
            <p className="truncate text-sm font-semibold text-[#3a2f22]">{userName}</p>
            <p className="mt-0.5 text-xs text-[#a89880]">Salon account</p>
          </div>
          <div className="my-1 border-t border-[#EEF2F7]" />
          <Link
            href="/dashboard/settings"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="mx-1.5 flex items-center gap-2 rounded-sm px-2.5 py-2 text-sm font-medium text-[#475467] hover:bg-[#faf6ef] hover:text-[#3a2f22]"
          >
            <Settings className="h-4 w-4 text-[#a89880]" /> Settings
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            role="menuitem"
            className="mx-1.5 flex w-[calc(100%-12px)] items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm font-medium text-[#475467] hover:bg-[#faf6ef] hover:text-[#3a2f22]"
          >
            <LogOut className="h-4 w-4 text-[#a89880]" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
