import { SectionShell } from "@/components/dashboard/section-shell";
import { ClientsSubNav } from "./sub-nav";

export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SectionShell
      sidebar={
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#a89880] mb-2">Clients</p>
            <ClientsSubNav
              links={[
                { href: "/dashboard/clients/list", label: "Clients" },
                { href: "/dashboard/clients/segments", label: "Client segments" },
              ]}
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#a89880] mb-2">Engage</p>
            <ClientsSubNav
              links={[
                { href: "/dashboard/clients/loyalty", label: "Client loyalty" },
                { href: "/dashboard/clients/reputation", label: "Online reputation" },
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
