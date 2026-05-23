import { redirect } from "next/navigation";

export default function LegacyDashboard() {
  redirect("/?tab=home");
}
