import { redirect } from "next/navigation";

export default function SettingsTeamRedirect() {
  redirect("/dashboard/team/members");
}
