"use client";

import type { BrailaEntry } from "@/types/models";
import { Skeleton } from "@/components/ui/Skeleton";

export function BrailaWidget({
  entries,
  loading,
}: {
  entries: BrailaEntry[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const latest = entries[0];

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm dark:border-amber-900/50 dark:from-amber-950/40 dark:to-zinc-950">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">
        Braila
      </h3>
      {latest ? (
        <div className="mt-3">
          <p className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
            {latest.weightKg.toFixed(2)} kg
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {latest.teamName}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Nu există încă înregistrări pentru Braila.
        </p>
      )}
      {entries.length > 1 && (
        <ul className="mt-4 space-y-2 border-t border-amber-200/60 pt-3 text-sm dark:border-amber-900/40">
          {entries.slice(1, 5).map((e) => (
            <li
              key={`${e.date}-${e.teamId}`}
              className="flex justify-between gap-2 text-zinc-700 dark:text-zinc-300"
            >
              <span className="font-medium">{e.teamName}</span>
              <span className="tabular-nums">{e.weightKg.toFixed(2)} kg</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
