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
    // Dashboard shell: solid white with dark text and a visible border, always contrasts on the cream background
    secondaryDark: "bg-white text-[#1F1E1D] border border-[#E5DDD0] hover:bg-[#FBF7EF] shadow-sm",
    // Subtle secondary on light cards/modals: dark text on a light tan fill — never white-on-light
    ghostDark: "text-[#4A4640] hover:bg-[#F3EEE4] border border-[#E5DDD0] bg-[#FBF7EF]",
    gradient: "text-white brand-gradient-bg hover:opacity-90 shadow-sm",
    ghost: "text-[#1F1E1D] hover:bg-[#F7F3ED]",
  };
  // fallback: if someone passes old ghost on dark, ghostDark is available; keep ghost for light surfaces
  const resolved = variants[variant as keyof typeof variants] ?? variants.primary;
  return <button className={`${base} ${resolved} ${className}`} {...props} />;
}
