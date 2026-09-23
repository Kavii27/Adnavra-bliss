"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Wraps a section and adds `.in-view` once it scrolls into the viewport,
 * which triggers the `.reveal-up` / `.reveal-stagger` CSS animations
 * defined in globals.css. Pure CSS animation, JS only toggles a class.
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Respect reduced-motion users by revealing immediately.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("in-view");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Comp = Tag as "div";
  return (
    <Comp ref={ref} className={className}>
      {children}
    </Comp>
  );
}
