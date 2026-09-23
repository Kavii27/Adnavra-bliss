import { SectionShell } from "@/components/dashboard/section-shell";
import { SalesSubNav } from "./sub-nav";

const SALES_LINKS = [
  { href: "/dashboard/sales/daily-summary", label: "Daily sales summary" },
  { href: "/dashboard/sales/appointments", label: "Appointments" },
  { href: "/dashboard/sales/sales", label: "Sales" },
  { href: "/dashboard/sales/payments", label: "Payments" },
  { href: "/dashboard/sales/gift-cards", label: "Gift cards sold" },
  { href: "/dashboard/sales/packages", label: "Packages sold" },
  { href: "/dashboard/sales/memberships", label: "Memberships sold" },
];

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return (
    <SectionShell
      sidebar={
        <div>
          <p className="text-xs uppercase tracking-wide text-[#a89880] mb-2">Sales</p>
          <SalesSubNav links={SALES_LINKS} />
        </div>
      }
    >
      {children}
    </SectionShell>
  );
}
