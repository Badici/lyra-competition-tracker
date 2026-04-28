import type { Metadata } from "next";
import { CompetitionSection } from "@/components/competition/CompetitionSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Concurs #${id}`,
    description:
      "Clasament live, sectoare, echipe și capturi pentru concursul selectat.",
    openGraph: {
      title: `Concurs #${id} - Lyra Tracker`,
      description:
        "Urmărește în timp real evoluția echipelor, capturile și rezultatele pe sectoare.",
      locale: "ro_RO",
      type: "website",
      url: `/competition/${id}/leaderboard`,
    },
  };
}

export default async function CompetitionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CompetitionSection competitionId={id}>{children}</CompetitionSection>;
}
