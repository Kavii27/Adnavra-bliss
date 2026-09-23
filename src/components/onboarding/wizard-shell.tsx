"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WizardShell({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
}: {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#faf6ef] text-[#3a2f22]">
      <div className="flex gap-1 p-1">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i < step ? "bg-[#c9a26d]" : "bg-[#f3ebdd]"}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between px-8 py-4">
        {onBack ? (
          <button
            onClick={onBack}
            className="h-9 w-9 rounded-full border border-white/15 flex items-center justify-center hover:bg-[#f6efe3]"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <span />
        )}
        <Button variant="gradient" onClick={onNext} disabled={nextDisabled}>
          {nextLabel} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <div className="max-w-3xl mx-auto px-8 pb-20 pt-8">
        <p className="text-xs text-[#a89880]">Account setup</p>
        <h1 className="mt-2 text-4xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-3 text-[#a89880] max-w-xl">{subtitle}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}
