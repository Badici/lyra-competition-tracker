"use client";

import { useParams } from "next/navigation";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { BrailaWidget } from "@/components/braila/BrailaWidget";
import { useCompetitionBundle } from "@/hooks/useCompetitionBundle";

export default function LeaderboardPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const {
    competition,
    leaderboard,
    sectors,
    stands,
    braila,
    isLoading,
    isError,
  } = useCompetitionBundle(id, true);

  if (isError || (!isLoading && !competition)) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
        Concursul nu a fost găsit sau API-ul nu răspunde.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {competition?.name ?? "Clasament"}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Clasamentul este actualizat automat. Poți verifica rapid podiumul
          general și clasamentul pe sectoare.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <article className="rounded-xl bg-zinc-100 px-3 py-2 dark:bg-zinc-800/70">
            <p className="text-xs text-zinc-500">Echipe în clasament</p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {leaderboard.length}
            </p>
          </article>
          <article className="rounded-xl bg-zinc-100 px-3 py-2 dark:bg-zinc-800/70">
            <p className="text-xs text-zinc-500">Sectoare</p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {sectors.length}
            </p>
          </article>
          <article className="rounded-xl bg-zinc-100 px-3 py-2 dark:bg-zinc-800/70">
            <p className="text-xs text-zinc-500">Standuri alocate</p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {stands.filter((s) => s.teamId).length}
            </p>
          </article>
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <LeaderboardTable
          entries={leaderboard}
          sectors={sectors}
          stands={stands}
          competitionType={competition?.type ?? "quantity"}
          loading={isLoading}
        />
        <aside className="space-y-4">
          <BrailaWidget entries={braila} loading={isLoading} />
        </aside>
      </div>
    </div>
  );
}
