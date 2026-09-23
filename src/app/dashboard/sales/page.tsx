import { redirect } from "next/navigation";

export default function SalesIndexPage() {
  redirect("/dashboard/sales/daily-summary");
}
