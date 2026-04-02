import { CompetitionSection } from "@/components/competition/CompetitionSection";

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
