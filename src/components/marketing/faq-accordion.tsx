"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-[#e6dcc8] bg-white/[0.03] backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05]"
          >
            <button
              onClick={() => toggleItem(index)}
              className="flex w-full items-center justify-between p-5 text-left transition-colors"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-medium text-[#F1F5F9]">
                {item.q}
              </span>
              <div className={`ml-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#e6dcc8] bg-[#f6efe3] text-[#3a2f22]/70 transition-transform duration-300 ${isOpen ? "rotate-180 bg-[#c9a26d]/20 text-[#c9a26d] border-[#c9a26d]/30" : ""}`}>
                <ChevronDown className="h-4 w-4" />
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-[#e6dcc8] px-5 pb-5 pt-3 text-xs leading-relaxed text-white/70">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}