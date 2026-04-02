import { redirect } from "next/navigation";

export default function LegacyAdminCompetitionsPage() {
  redirect("/admin/contests");
}
