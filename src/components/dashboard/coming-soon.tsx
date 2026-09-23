import { Sparkles } from "lucide-react";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[#e6dcc8] bg-[#f6efe3] px-8 py-16 text-center">
      <Sparkles className="h-8 w-8 text-[#a89880]" />
      <h2 className="mt-4 text-lg font-semibold text-[#3a2f22]">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-[#a89880]">{description}</p>
    </div>
  );
}
