import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "gradient" | "ghost" | "secondaryDark" | "ghostDark";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-semibold h-10 px-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A1D12] disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-[#2A1D12] text-white hover:bg-[#17100A] shadow-sm",
    secondary: "bg-[#FDF9F3] text-[#1F1E1D] border border-[#E5DDD0] hover:bg-[#F7F3ED] shadow-sm",
    // Dashboard dark shell: solid white with dark text — guaranteed contrast on #1F1E1D / #2A2823, never white-on-white
    secondaryDark: "bg-white text-[#1F1E1D] border border-white hover:bg-white/90 shadow-sm",
    // Subtle dark secondary: semi-transparent white with white text — visible but not competing with primary
    ghostDark: "text-white hover:bg-[#f3ebdd] border border-white/15 bg-[#f3ebdd]",
    gradient: "text-white brand-gradient-bg hover:opacity-90 shadow-sm",
    ghost: "text-[#1F1E1D] hover:bg-[#F7F3ED]",
  };
  // fallback: if someone passes old ghost on dark, ghostDark is available; keep ghost for light surfaces
  const resolved = variants[variant as keyof typeof variants] ?? variants.primary;
  return <button className={`${base} ${resolved} ${className}`} {...props} />;
}
