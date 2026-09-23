import * as React from "react";

export function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-lg bg-[#F7F3ED] p-8 ${className}`} {...props} />;
}
