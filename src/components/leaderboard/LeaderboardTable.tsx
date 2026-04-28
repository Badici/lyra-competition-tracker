"use client";

import { Fragment, useMemo } from "react";
import { standLetterOrFallback } from "@/lib/constants/lakeStands";
import { sortLeaderboardForDisplay } from "@/lib/scoring/engine";
import { SkeletonTable } from "@/components/ui/Skeleton";
import type {
  Competition,
  LeaderboardEntry,
  Sector,
  Stand,
} from "@/types/models";

function scoreLabel(type: Competition["type"]): string {
  switch (type) {
    case "quantity":
      return "Pești";
    case "quality":
      return "Calitate (kg)";
    case "combined":
      return "Scor comb.";
    default:
      return "Scor";
  }
}

function chunkBySector(
  entries: LeaderboardEntry[],
): { sectorId: string; sectorName: string; rows: LeaderboardEntry[] }[] {
  const groups: {
    sectorId: string;
    sectorName: string;
    rows: LeaderboardEntry[];
  }[] = [];
  for (const e of entries) {
    const g = groups[groups.length - 1];
    if (g && g.sectorId === e.sectorId) {
      g.rows.push(e);
    } else {
      groups.push({
        sectorId: e.sectorId,
        sectorName: e.sectorName,
        rows: [e],
      });
    }
  }
  return groups;
}

export function LeaderboardTable({
  entries,
  sectors,
  stands,
  competitionType,
  loading,
}: {
  entries: LeaderboardEntry[];
  sectors: Sector[];
  stands: Stand[];
  competitionType: Competition["type"];
  loading?: boolean;
}) {
  const grouped = useMemo(() => {
    const sorted = sortLeaderboardForDisplay(entries, sectors, stands);
    return chunkBySector(sorted);
  }, [entries, sectors, stands]);

  const standForTeam = (teamId: string) =>
    stands.find((s) => s.teamId === teamId);

  if (loading) {
    return <SkeletonTable rows={8} />;
  }

  if (!entries.length) {
    return (
      <p className="rounded-2xl border border-dashed border-zinc-200/80 bg-zinc-50/50 px-6 py-12 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-400">
        Nu există echipe sau cântăriri încă.
      </p>
    );
  }

  const colCount = competitionType === "combined" ? 8 : 7;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <table className="w-full border-collapse text-sm" aria-label="Clasament concurs">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/90 text-left text-[11px] font-medium uppercase tracking-widest text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
            <th className="w-11 px-2 py-3 font-medium">Loc sec.</th>
            <th className="w-11 px-2 py-3 font-medium">Loc gen.</th>
            <th className="w-14 px-2 py-3 font-medium">Stand</th>
            <th className="min-w-[8rem] px-3 py-3 font-medium">Echipă</th>
            <th className="px-3 py-3 text-right font-medium tabular-nums">
              {scoreLabel(competitionType)}
            </th>
            <th className="hidden px-3 py-3 text-right font-medium tabular-nums sm:table-cell">
              Kg
            </th>
            <th className="hidden px-3 py-3 text-right font-medium tabular-nums md:table-cell">
              Capturi
            </th>
            {competitionType === "combined" && (
              <th className="hidden px-3 py-3 text-right font-medium tabular-nums lg:table-cell">
                Top N
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {grouped.map((group, gi) => (
            <Fragment key={`sec-${gi}-${group.sectorId || "none"}`}>
              <tr className="bg-zinc-100/80 dark:bg-zinc-900/80">
                <td
                  colSpan={colCount}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300"
                >
                  {group.sectorName || "Fără sector"}
                </td>
              </tr>
              {group.rows.map((row) => {
                const st = standForTeam(row.teamId);
                const standLabel = st
                  ? standLetterOrFallback(st.label, st.id)
                  : "—";
                return (
                  <tr
                    key={row.teamId}
                    className="border-b border-zinc-100 transition-colors hover:bg-zinc-50/80 dark:border-zinc-800/80 dark:hover:bg-zinc-900/40"
                  >
                    <td className="px-2 py-3 tabular-nums text-zinc-400 dark:text-zinc-500">
                      {row.sectorRank ?? "—"}
                    </td>
                    <td className="px-2 py-3 tabular-nums text-zinc-400 dark:text-zinc-500">
                      {row.generalRank ?? row.rank}
                    </td>
                    <td className="px-2 py-3 text-center text-base font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">
                      {standLabel}
                    </td>
                    <td className="px-3 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      <span className="flex flex-wrap items-center gap-2">
                        {row.teamName}
                        {row.isSectorWinner && (
                          <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                            Sector
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {competitionType === "quantity" && row.primaryScore}
                      {competitionType === "quality" &&
                        row.primaryScore.toFixed(2)}
                      {competitionType === "combined" &&
                        row.primaryScore.toFixed(2)}
                    </td>
                    <td className="hidden px-3 py-3 text-right tabular-nums text-zinc-600 sm:table-cell dark:text-zinc-400">
                      {row.totalWeightKg.toFixed(2)}
                    </td>
                    <td className="hidden px-3 py-3 text-right tabular-nums text-zinc-600 md:table-cell dark:text-zinc-400">
                      {row.fishCount}
                    </td>
                    {competitionType === "combined" && (
                      <td className="hidden px-3 py-3 text-right tabular-nums text-zinc-600 lg:table-cell dark:text-zinc-400">
                        {row.qualityScoreKg.toFixed(2)}
                      </td>
                    )}
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
