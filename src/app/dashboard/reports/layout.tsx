import { SectionShell } from "@/components/dashboard/section-shell";
import { ReportsSubNav } from "./sub-nav";

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SectionShell
      sidebar={
        <div className="space-y-6">
          <div>
            <ReportsSubNav
              links={[
                { href: "/dashboard/reports", label: "All reports" },
                { href: "/dashboard/reports/favourites", label: "Favourites", disabled: true },
                { href: "/dashboard/reports/dashboards", label: "Dashboards", disabled: true },
                { href: "/dashboard/reports/standard", label: "Standard", disabled: true },
                { href: "/dashboard/reports/premium", label: "Premium", disabled: true },
                { href: "/dashboard/reports/custom", label: "Custom", disabled: true },
              ]}
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#a89880] mb-2">Folders</p>
            <ReportsSubNav
              links={[
                { href: "#add-folder", label: "Add folder", disabled: true },
                { href: "#data-connector", label: "Data connector", disabled: true },
              ]}
            />
          </div>
        </div>
      }
    >
      {children}
    </SectionShell>
  );
}
