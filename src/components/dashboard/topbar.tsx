"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, BarChart3, Bell, MessageCircle, X, Loader2, User, QrCode, Download, ExternalLink } from "lucide-react";
import { ContinueSetupPill } from "./continue-setup-pill";
import { AccountMenu } from "./account-menu";

export function DashboardTopbar({
  businessName,
  businessId,
  businessSlug,
  userName,
  userInitials,
}: {
  businessName: string;
  businessId?: string | null;
  businessSlug?: string | null;
  userName: string;
  userInitials: string;
}) {
  return (
    <header className="flex h-16 items-center gap-4 border-b border-[#E9E1D3] bg-[#FAF7F2] px-4 md:px-6">
      {/* ADNAVRA logo lives only in the sidebar — topbar shows the salon name to avoid duplication */}
      <span className="truncate text-sm font-semibold text-[#1F1E1D] lg:text-base">{businessName}</span>
      <div className="ml-auto flex items-center gap-1.5">
        <ContinueSetupPill />
        <QrTopbarButton businessId={businessId ?? null} businessSlug={businessSlug ?? null} />
        <SearchPopover />
        <Link
          href="/dashboard/reports"
          aria-label="Reports"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#8A8377] hover:bg-[#FBF7EF] hover:text-[#1F1E1D]"
        >
          <BarChart3 className="h-4 w-4" />
        </Link>
        <NotificationBell />
        <Link
          href="/help"
          aria-label="Help chat"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#8A8377] hover:bg-[#FBF7EF] hover:text-[#1F1E1D]"
        >
          <MessageCircle className="h-4 w-4" />
        </Link>
        <AccountMenu userName={userName} userInitials={userInitials} />
      </div>
    </header>
  );
}

type CustomerResult = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

function SearchPopover() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
      document.addEventListener("keydown", onKeyDown);
      // focus input when opened
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/customers?q=${encodeURIComponent(trimmed)}&limit=8`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          // For users with no business yet, API returns 400 — show no results, not an error wall
          if (res.status === 400) {
            setResults([]);
            setError(null);
          } else {
            throw new Error(json.error ?? "Search failed");
          }
        } else {
          setResults((json.data ?? []) as CustomerResult[]);
        }
      } catch (e: unknown) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div ref={containerRef} className="relative">
      <button
        aria-label="Search"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[#8A8377] hover:bg-[#FBF7EF] hover:text-[#1F1E1D]"
      >
        <Search className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-[#E9E1D3] bg-[#FBF7EF] shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[#E9E1D3] px-3 py-2">
            <Search className="h-4 w-4 text-[#8A8377] shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients..."
              aria-label="Search clients"
              className="flex-1 bg-transparent text-sm text-[#1F1E1D] placeholder:text-[#6B7280] outline-none"
            />
            {query ? (
              <button
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="flex h-6 w-6 items-center justify-center rounded-full text-[#8A8377] hover:bg-[#FBF7EF] hover:text-[#1F1E1D]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-[#8A8377]">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching...
              </div>
            ) : error ? (
              <p className="px-4 py-6 text-sm text-red-300">{error}</p>
            ) : query.trim().length < 2 ? (
              <p className="px-4 py-6 text-sm text-[#8A8377]">Type at least 2 characters to search your clients by name, email, or phone.</p>
            ) : results.length === 0 ? (
              <p className="px-4 py-6 text-sm text-[#8A8377]">No clients found for &ldquo;{query.trim()}&rdquo;.</p>
            ) : (
              <ul className="py-2">
                {results.map((c) => (
                  <li key={c.id}>
                    <Link
                      href="/dashboard/clients/list"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FBF7EF]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FBF7EF] text-xs font-semibold text-[#1F1E1D]">
                        {c.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-[#1F1E1D]">{c.name}</span>
                        <span className="block truncate text-xs text-[#8A8377]">{c.phone ?? c.email ?? "No contact on file"}</span>
                      </span>
                      <User className="h-4 w-4 shrink-0 text-[#8A8377]" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-[#E9E1D3] bg-white/[0.02] px-4 py-2">
            <p className="text-[11px] leading-snug text-[#6B7280]">Only clients are searchable here. Marketplace and service search are on the ADNAVRA roadmap.</p>
          </div>
        </div>
      )}
    </div>
  );
}

type PendingBooking = {
  id: string;
  startTime: string;
  status: string;
  customer?: { name: string } | null;
  service?: { name: string } | null;
};

function NotificationBell() {
  const [count, setCount] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<PendingBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchPending() {
      try {
        const res = await fetch("/api/bookings?status=PENDING&limit=5");
        if (!res.ok) {
          if (!cancelled) setCount(0);
          return;
        }
        const json = await res.json();
        if (cancelled) return;
        const total: number = json.pagination?.total ?? (json.data?.length ?? 0);
        setCount(total);
        setPending((json.data ?? []) as PendingBooking[]);
      } catch {
        if (!cancelled) setCount(0);
      }
    }
    fetchPending();
    const interval = setInterval(fetchPending, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
      document.addEventListener("keydown", onKeyDown);
      // refresh when opened
      setLoading(true);
      fetch("/api/bookings?status=PENDING&limit=5")
        .then(async (res) => {
          if (!res.ok) {
            setPending([]);
            setCount(0);
            return;
          }
          const json = await res.json();
          setPending((json.data ?? []) as PendingBooking[]);
          setCount(json.pagination?.total ?? (json.data?.length ?? 0));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const showBadge = count !== null && count > 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        aria-label={showBadge ? `Notifications, ${count} pending` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#8A8377] hover:bg-[#FBF7EF] hover:text-[#1F1E1D]"
      >
        <Bell className="h-4 w-4" />
        {showBadge && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#9A7B4F] px-1 text-[10px] font-bold leading-none text-[#1F1E1D]">
            {count! > 99 ? "99+" : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-[#E9E1D3] bg-[#FBF7EF] shadow-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#E9E1D3] px-4 py-3">
            <h3 className="text-sm font-semibold text-[#1F1E1D]">Notifications</h3>
            {showBadge && <span className="rounded-full bg-[#9A7B4F] px-2 py-0.5 text-xs font-semibold text-[#1F1E1D]">{count} pending</span>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-6 text-sm text-[#8A8377]">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading...
              </div>
            ) : showBadge && pending.length > 0 ? (
              <ul className="divide-y divide-white/5">
                {pending.map((b) => (
                  <li key={b.id} className="px-4 py-3">
                    <p className="text-sm font-medium text-[#1F1E1D] truncate">{b.customer?.name ?? "Client"} · {b.service?.name ?? "Service"}</p>
                    <p className="text-xs text-[#8A8377] mt-1">
                      {new Date(b.startTime).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" })} · {b.status}
                    </p>
                  </li>
                ))}
                {count !== null && count > pending.length && (
                  <li className="px-4 py-3 text-center">
                    <Link href="/dashboard/sales/appointments" onClick={() => setOpen(false)} className="text-xs font-medium text-[#9A7B4F] hover:text-[#1F1E1D]">
                      View all {count} pending bookings
                    </Link>
                  </li>
                )}
              </ul>
            ) : (
              <div className="px-4 py-6">
                <p className="text-sm text-[#8A8377]">No new notifications.</p>
                <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">
                  Pending bookings that need your confirmation will appear here. Right now all bookings are created as{" "}
                  <span className="text-[#8A8377]">CONFIRMED</span> automatically, so there is no action needed. A dedicated notification feed is on the roadmap.
                </p>
                <Link
                  href="/dashboard/sales/appointments"
                  onClick={() => setOpen(false)}
                  className="mt-3 inline-flex text-xs font-medium text-[#9A7B4F] hover:text-[#1F1E1D]"
                >
                  Go to appointments
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function QrTopbarButton({
  businessId: initialBusinessId,
  businessSlug: initialSlug,
}: {
  businessId: string | null;
  businessSlug: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(initialBusinessId);
  const [slug, setSlug] = useState<string | null>(initialSlug);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolvingBusiness, setResolvingBusiness] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // keep in sync if layout props arrive after hydration
  useEffect(() => {
    if (initialBusinessId) setBusinessId(initialBusinessId);
    if (initialSlug) setSlug(initialSlug);
  }, [initialBusinessId, initialSlug]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
      document.addEventListener("keydown", onKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // lazy fetch businessId/slug if not provided via props
  useEffect(() => {
    if (open && !businessId) {
      let cancelled = false;
      setResolvingBusiness(true);
      fetch("/api/businesses")
        .then((r) => r.json())
        .then((j) => {
          if (cancelled) return;
          const b = j.data?.[0];
          if (b) {
            setBusinessId(b.id);
            setSlug(b.slug);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setResolvingBusiness(false);
        });
      return () => {
        cancelled = true;
      };
    } else if (open && businessId) {
      setResolvingBusiness(false);
    }
  }, [open, businessId]);

  // fetch QR when opened and we have a businessId
  useEffect(() => {
    if (!open || !businessId || hasFetched) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/businesses/${businessId}/qr`)
      .then(async (r) => {
        const j = await r.json();
        if (cancelled) return;
        if (!r.ok) throw new Error(j.error ?? "Failed to generate QR");
        setDataUrl(j.data.qrDataUrl);
        setUrl(j.data.url);
        setSlug(j.data.slug ?? slug);
        setHasFetched(true);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, businessId, hasFetched, slug]);

  const isResolving = resolvingBusiness || (!businessId && !hasFetched && loading);
  const noBusiness = !businessId && !isResolving && !loading && !hasFetched && !error;

  return (
    <div ref={containerRef} className="relative">
      <button
        aria-label="Booking QR code"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        title="Booking QR code"
        className="flex h-9 w-9 items-center justify-center rounded-full text-[#8A8377] hover:bg-[#FBF7EF] hover:text-[#1F1E1D]"
      >
        <QrCode className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-[#E9E1D3] bg-[#FBF7EF] shadow-xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#E9E1D3] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#795831] text-[#ffffff]">
                <QrCode className="h-4 w-4" />
              </span>
              <h3 className="text-sm font-semibold text-[#1F1E1D]">Booking QR</h3>
            </div>
            <button
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#8A8377] hover:bg-[#FBF7EF] hover:text-[#1F1E1D]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-4 py-4">
            {isResolving || loading ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <Loader2 className="h-6 w-6 animate-spin text-[#8A8377]" />
                <p className="text-xs text-[#8A8377]">{isResolving ? "Loading salon…" : "Generating QR for your salon…"}</p>
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-3">
                <p className="text-xs font-medium text-red-300">{error}</p>
                <button
                  onClick={() => {
                    setHasFetched(false);
                    setError(null);
                    setLoading(false);
                  }}
                  className="mt-2 text-xs font-medium text-[#1F1E1D] hover:text-[#8A8377]"
                >
                  Try again
                </button>
              </div>
            ) : noBusiness ? (
              <div className="py-2 text-center">
                <p className="text-sm font-medium text-[#1F1E1D]">No salon yet</p>
                <p className="mt-1 text-xs leading-relaxed text-[#8A8377]">Create your salon profile first to generate a QR code that points to your public booking page.</p>
                <Link
                  href="/dashboard/onboarding"
                  onClick={() => setOpen(false)}
                  className="mt-3 inline-flex h-8 items-center justify-center rounded-lg bg-white px-3 text-xs font-semibold text-[#FAF7F2] hover:bg-white/90"
                >
                  Create salon profile
                </Link>
              </div>
            ) : dataUrl ? (
              <div className="flex flex-col items-center text-center">
                <p className="text-xs text-[#8A8377]">Customers scan to open your booking page — unique to this salon.</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dataUrl} alt="QR code for booking page" className="mt-3 h-48 w-48 shrink-0 rounded-xl border border-[#E9E1D3] bg-white p-2 object-contain" />
                {url && (
                  <p className="mt-3 max-w-full break-all text-[11px] leading-relaxed text-[#8A8377]">{url}</p>
                )}
                <div className="mt-3 flex w-full gap-2">
                  <a href={dataUrl} download={`adnavra-${slug ?? businessId}-qr.png`} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#FAF7F2] hover:bg-white/90">
                    <Download className="h-3.5 w-3.5" /> Download PNG
                  </a>
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-[#FBF7EF] px-3 py-2 text-xs font-semibold text-[#1F1E1D] hover:bg-[#FBF7EF]">
                      <ExternalLink className="h-3.5 w-3.5" /> Open page
                    </a>
                  )}
                </div>
                <Link
                  href="/dashboard/qr-code"
                  onClick={() => setOpen(false)}
                  className="mt-2 text-xs font-medium text-[#8A8377] hover:text-[#1F1E1D]"
                >
                  View full page →
                </Link>
              </div>
            ) : null}
          </div>
          {dataUrl && (
            <div className="border-t border-[#E9E1D3] bg-white/[0.02] px-4 py-2">
              <p className="text-[11px] leading-snug text-[#6B7280]">Each salon gets its own QR — linked to <span className="text-[#8A8377]">/{slug ?? "your-slug"}</span>. Print it for reception or mirrors.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
