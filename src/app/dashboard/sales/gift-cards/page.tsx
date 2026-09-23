"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Store, Plus, Check, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { useBusinessId, lkr, formatDate } from "@/components/dashboard/use-business";

type GiftCard = {
  id: string;
  code: string;
  amount: number;
  balance: number;
  recipientName: string | null;
  recipientEmail: string | null;
  status: "ACTIVE" | "REDEEMED" | "EXPIRED" | "CANCELLED";
  expiresAt: string | null;
  createdAt: string;
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-500/20 text-emerald-300",
  REDEEMED: "bg-[#f3ebdd] text-[#a89880]",
  EXPIRED: "bg-[#f3ebdd] text-[#a89880]",
  CANCELLED: "bg-red-500/20 text-red-300",
};

export default function GiftCardsPage() {
  return (
    <PlanGate feature="giftCardsSold">
      <GiftCardsInner />
    </PlanGate>
  );
}

function GiftCardsInner() {
  const { businessId, loading: bizLoading, error: bizError, isNoBusiness } = useBusinessId();
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("5000");
  const [recipientName, setRecipientName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/gift-cards?businessId=${businessId}&limit=50`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed to load gift cards");
      setCards(j.data ?? []);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (businessId) load();
    else if (!bizLoading) setLoading(false);
  }, [businessId, bizLoading, load]);

  async function handleCreate() {
    if (!businessId) return;
    setFormError(null);
    if (!code.trim()) {
      setFormError("Code is required");
      return;
    }
    const amt = parseFloat(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      setFormError("Amount must be greater than 0");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          code: code.trim().toUpperCase(),
          amount: amt,
          recipientName: recipientName.trim() || null,
          expiresAt: expiresAt || null,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Create failed");
      setShowForm(false);
      setCode("");
      setAmount("5000");
      setRecipientName("");
      setExpiresAt("");
      await load();
    } catch (e: unknown) {
      setFormError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function setStatus(id: string, status: GiftCard["status"]) {
    const r = await fetch(`/api/gift-cards?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const j = await r.json();
    if (!r.ok) {
      alert(j.error ?? "Update failed");
      return;
    }
    await load();
  }

  if (bizLoading || (loading && businessId)) {
    return <div className="flex items-center gap-2 text-sm text-[#a89880]"><Loader2 className="h-4 w-4 animate-spin" /> Loading gift cards...</div>;
  }
  if (isNoBusiness || bizError) {
    return (
      <div className="rounded-xl border border-[#e6dcc8] bg-white/[0.04] p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f6efe3] border border-[#e6dcc8]">
          <Store className="h-5 w-5 text-[#a89880]" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-[#3a2f22]">Set up your salon to sell gift cards</h3>
        <p className="mt-1 text-sm text-[#a89880]">{bizError ?? "Create your business profile first."}</p>
        <Link href="/dashboard/settings" className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#faf6ef] hover:bg-white/90">Go to Settings</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#3a2f22]">Gift cards sold</h1>
          <p className="text-sm text-[#a89880] mt-1">Gift cards issued by your business. Issuing a card also records it in Sales.</p>
        </div>
        <Button onClick={() => { setFormError(null); setShowForm(true); }} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">
          <Plus className="h-4 w-4 mr-2" /> Issue gift card
        </Button>
      </div>

      {error ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-300"><AlertCircle className="h-4 w-4" /> {error}</div>
      ) : cards.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[#e6dcc8] bg-[#f6efe3] p-8 text-center">
          <Gift className="h-6 w-6 text-[#a89880] mx-auto" />
          <p className="mt-2 text-sm text-[#a89880]">No gift cards yet. Issue your first card to start selling them.</p>
          <Button onClick={() => setShowForm(true)} className="mt-4 bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">Issue gift card</Button>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-[#e6dcc8] bg-white/[0.04]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[#a89880] border-b border-[#e6dcc8] bg-white/[0.02]">
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Recipient</th>
                  <th className="px-4 py-3 font-medium text-right">Value</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {cards.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono font-medium text-[#3a2f22]">{c.code}</td>
                    <td className="px-4 py-3 text-[#a89880]">{c.recipientName ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-[#3a2f22]">{lkr(c.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[c.status]}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-[#a89880] text-xs">{formatDate(c.expiresAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {c.status === "ACTIVE" && (
                        <div className="inline-flex gap-2">
                          <button onClick={() => setStatus(c.id, "REDEEMED")} className="rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-1.5 text-xs font-medium text-[#a89880] hover:bg-[#f3ebdd] hover:text-[#3a2f22]">Redeem</button>
                          <button onClick={() => setStatus(c.id, "CANCELLED")} className="rounded-md border border-[#e6dcc8] bg-[#f6efe3] px-3 py-1.5 text-xs font-medium text-[#a89880] hover:bg-red-500/20 hover:text-red-300">Void</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
          <div className="bg-[#0F1729] rounded-xl border border-[#e6dcc8] p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-[#3a2f22]">Issue gift card</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Code *</label>
                <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="GIFT-1000" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880] font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Value (LKR) *</label>
                  <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min={1} className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#3a2f22]">Expires</label>
                  <Input value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} type="date" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22]" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#3a2f22]">Recipient name</label>
                <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Optional" className="mt-1 bg-[#f6efe3] border-[#e6dcc8] text-[#3a2f22] placeholder:text-[#a89880]" />
              </div>
              {formError && <p className="text-sm text-red-300 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {formError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghostDark" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={submitting} className="bg-[#8a6d4f] text-[#ffffff] hover:bg-white/90">{submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Issuing...</> : <><Check className="h-4 w-4 mr-2" /> Issue</>}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
