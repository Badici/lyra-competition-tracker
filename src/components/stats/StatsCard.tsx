"use client";

import type { LeaderboardEntry } from "@/types/models";

export function StatsCard({ entry }: { entry: LeaderboardEntry }) {
  return (
    <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
      <div className="rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-900/60">
        <dt className="text-xs uppercase tracking-wide text-zinc-500">
          Loc general
        </dt>
        <dd className="text-lg font-semibold tabular-nums">
          {entry.generalRank ?? entry.rank}
        </dd>
      </div>
      <div className="rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-900/60">
        <dt className="text-xs uppercase tracking-wide text-zinc-500">
          Pești
        </dt>
        <dd className="text-lg font-semibold tabular-nums">{entry.fishCount}</dd>
      </div>
      <div className="rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-900/60">
        <dt className="text-xs uppercase tracking-wide text-zinc-500">
          Greutate totală
        </dt>
        <dd className="text-lg font-semibold tabular-nums">
          {entry.totalWeightKg.toFixed(2)} kg
        </dd>
      </div>
      <div className="rounded-xl bg-zinc-50 px-3 py-2 dark:bg-zinc-900/60">
        <dt className="text-xs uppercase tracking-wide text-zinc-500">
          Scor principal
        </dt>
        <dd className="text-lg font-semibold tabular-nums">
          {entry.primaryScore.toFixed(2)}
        </dd>
      </div>
    </dl>
  );
}
