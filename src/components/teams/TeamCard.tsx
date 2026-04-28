"use client";

import Link from "next/link";
import type { LeaderboardEntry, Team } from "@/types/models";
import { StatsCard } from "@/components/stats/StatsCard";

export function TeamCard({
  team,
  competitionId,
  stats,
}: {
  team: Team;
  competitionId: string;
  stats?: LeaderboardEntry | null;
}) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:scale-[1.03] hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {team.name}
          </h3>
          {team.membersLabel && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {team.membersLabel}
            </p>
          )}
          {team.bibNumber && (
            <p className="text-xs text-zinc-500">Nr. {team.bibNumber}</p>
          )}
        </div>
        <Link
          href={`/competition/${competitionId}/teams?highlight=${team.id}`}
          className="shrink-0 rounded-lg bg-emerald-100 px-2.5 py-1 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:hover:bg-emerald-900/60"
        >
          Detalii
        </Link>
      </div>
      {stats && (
        <div className="mt-4">
          <StatsCard entry={stats} />
        </div>
      )}
    </article>
  );
}
