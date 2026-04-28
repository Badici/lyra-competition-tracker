import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tablou de bord concursuri",
  description:
    "Lista completă a concursurilor active și finalizate, cu acces rapid la clasament, echipe și capturi.",
  openGraph: {
    title: "Tablou de bord concursuri",
    description:
      "Alege concursul dorit și urmărește scorurile în timp real, într-o interfață simplă pentru toți participanții.",
    locale: "ro_RO",
    type: "website",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
