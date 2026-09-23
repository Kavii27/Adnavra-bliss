import { ClipboardList } from "lucide-react";

export default function FormsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[#3a2f22]">Forms</h1>
        <p className="mt-1 text-sm text-[#a89880]">Intake and consent forms from salons you book with.</p>
      </div>
      <div className="rounded-xl border border-[#E3E8F0] bg-white p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF4FA] border border-[#E3E8F0]">
          <ClipboardList className="h-6 w-6 text-[#8a6d4f]" />
        </div>
        <p className="mt-4 text-sm font-semibold text-[#3a2f22]">No forms yet</p>
        <p className="mt-1 text-sm text-[#a89880] max-w-md mx-auto">
          Salons you book with may ask you to fill out forms before your appointment. When a salon sends you one, it will show up
          here.
        </p>
      </div>
    </div>
  );
}
