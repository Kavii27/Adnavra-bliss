"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

export function ContactForm() {
  const { t } = useLocale();
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value.trim();
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement)?.value.trim();

    if (!name || !email || !message) {
      setError(t("mkt.contactForm.required"));
      return;
    }

    setStatus("sending");
    // No backend endpoint wired up yet — simulate a short delay, then hand
    // off to a mailto link so the message still reaches the team.
    await new Promise((r) => setTimeout(r, 500));
    const subject = encodeURIComponent(`Message from ${name} via ADNAVRA website`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:hello@adnavra.lk?subject=${subject}&body=${body}`;
    setStatus("sent");
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-[#1F1E1D]">
            {t("mkt.contactForm.name")}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder={t("mkt.contactForm.namePh")}
            className="mt-1.5 w-full rounded-lg border border-[#E5DDD0] bg-[#FDF9F3] px-3.5 py-2.5 text-sm text-[#1F1E1D] outline-none placeholder:text-[#B4AA98] focus:border-[#2A1D12] focus:ring-1 focus:ring-[#2A1D12]"
          />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-[#1F1E1D]">
            {t("mkt.contactForm.email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder={t("mkt.contactForm.emailPh")}
            className="mt-1.5 w-full rounded-lg border border-[#E5DDD0] bg-[#FDF9F3] px-3.5 py-2.5 text-sm text-[#1F1E1D] outline-none placeholder:text-[#B4AA98] focus:border-[#2A1D12] focus:ring-1 focus:ring-[#2A1D12]"
          />
        </div>
      </div>

      <div>
          <label htmlFor="subject" className="text-sm font-medium text-[#1F1E1D]">
            {t("mkt.contactForm.subject")}
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            placeholder={t("mkt.contactForm.subjectPh")}
          className="mt-1.5 w-full rounded-lg border border-[#E5DDD0] bg-[#FDF9F3] px-3.5 py-2.5 text-sm text-[#1F1E1D] outline-none placeholder:text-[#B4AA98] focus:border-[#2A1D12] focus:ring-1 focus:ring-[#2A1D12]"
        />
      </div>

      <div>
          <label htmlFor="message" className="text-sm font-medium text-[#1F1E1D]">
            {t("mkt.contactForm.message")}
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            placeholder={t("mkt.contactForm.messagePh")}
          className="mt-1.5 w-full resize-none rounded-lg border border-[#E5DDD0] bg-[#FDF9F3] px-3.5 py-2.5 text-sm text-[#1F1E1D] outline-none placeholder:text-[#B4AA98] focus:border-[#2A1D12] focus:ring-1 focus:ring-[#2A1D12]"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2A1D12] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#17100A] disabled:opacity-60 sm:w-auto"
      >
        {status === "sending" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> {t("mkt.contactForm.sending")}
          </>
        ) : status === "sent" ? (
          <>
            <CheckCircle2 className="h-4 w-4" /> {t("mkt.contactForm.sent")}
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> {t("mkt.contactForm.send")}
          </>
        )}
      </button>
      <p className="text-xs text-[#8A7F6E]">
        {t("mkt.contactForm.note")}
      </p>
    </form>
  );
}
