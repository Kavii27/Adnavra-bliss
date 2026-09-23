import { SectionShell } from "@/components/dashboard/section-shell";
import { TeamSubNav } from "./sub-nav";

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <SectionShell
      sidebar={
        <TeamSubNav
          links={[
            { href: "/dashboard/team/members", label: "Team members" },
            { href: "/dashboard/team/shifts", label: "Scheduled shifts" },
            { href: "/dashboard/team/timesheets", label: "Timesheets" },
          ]}
        />
      }
    >
      {children}
    </SectionShell>
  );
}
