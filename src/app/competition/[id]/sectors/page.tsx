"use client";

import { useParams } from "next/navigation";
import { SectorCard } from "@/components/sectors/SectorCard";
import { useCompetitionBundle } from "@/hooks/useCompetitionBundle";
import { Skeleton } from "@/components/ui/Skeleton";

export default function SectorsPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { sectors, sectorRankings, competition, isLoading, isError } =
    useCompetitionBundle(id, true);

  if (isError || (!isLoading && !competition)) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
        Nu s-au putut încărca sectoarele.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const sortedSectors = [...sectors].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Sectoare
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Clasamente pe fiecare zonă, pentru organizatori și participanți.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {sortedSectors.map((s) => (
          <SectorCard
            key={s.id}
            sector={s}
            entries={sectorRankings.get(s.id) ?? []}
          />
        ))}
      </div>
      {!sortedSectors.length && (
        <p className="text-sm text-zinc-500">
          Nu există sectoare definite pentru acest concurs.
        </p>
      )}
    </div>
  );
}
