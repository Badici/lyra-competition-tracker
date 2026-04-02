"use client";

import { useParams, useSearchParams } from "next/navigation";
import { TeamCard } from "@/components/teams/TeamCard";
import { useCompetitionBundle } from "@/hooks/useCompetitionBundle";
import { Skeleton } from "@/components/ui/Skeleton";

export function TeamsView() {
  const params = useParams();
  const sp = useSearchParams();
  const highlight = sp.get("highlight");
  const id = String(params.id ?? "");
  const { teams, leaderboard, competition, isLoading, isError } =
    useCompetitionBundle(id, true);

  const byTeam = new Map(leaderboard.map((e) => [e.teamId, e]));

  if (isError || (!isLoading && !competition)) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
        Nu s-au putut încărca echipele.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const sorted = [...teams].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Echipe
      </h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {sorted.map((t) => (
          <div
            key={t.id}
            id={`team-${t.id}`}
            className={
              highlight === t.id ? "ring-2 ring-emerald-500 rounded-xl" : ""
            }
          >
            <TeamCard
              team={t}
              competitionId={id}
              stats={byTeam.get(t.id) ?? null}
            />
          </div>
        ))}
      </div>
      {!sorted.length && (
        <p className="text-sm text-zinc-500">Nu există echipe înscrise.</p>
      )}
    </div>
  );
}
