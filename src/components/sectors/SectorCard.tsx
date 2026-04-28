"use client";

import type { LeaderboardEntry, Sector } from "@/types/models";

export function SectorCard({
  sector,
  entries,
}: {
  sector: Sector;
  entries: LeaderboardEntry[];
}) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:scale-[1.03] hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <header className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {sector.name}
        </h3>
        <span className="text-xs text-zinc-500">{entries.length} echipe</span>
      </header>
      <ol className="space-y-2">
        {entries.slice(0, 5).map((e) => (
          <li
            key={e.teamId}
            className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900/60"
          >
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              <span className="mr-2 font-mono text-zinc-500">
                {e.sectorRank ?? e.rank}.
              </span>
              {e.teamName}
            </span>
            <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
              {e.primaryScore.toFixed(2)}
            </span>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="text-sm text-zinc-500">Fără date în acest sector.</li>
        )}
      </ol>
    </article>
  );
}
