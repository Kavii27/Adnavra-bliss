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
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f3ebdd] text-xs font-semibold text-[#3a2f22] hover:bg-white/15"
      >
        {userInitials}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] py-2 shadow-xl">
          <div className="px-4 pb-2">
            <p className="text-sm font-medium text-[#3a2f22] truncate">{userName}</p>
          </div>
          <div className="border-t border-[#e6dcc8] my-1" />
          <Link
            href="/dashboard/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]"
          >
            <Settings className="h-4 w-4" /> Settings
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22] text-left"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
