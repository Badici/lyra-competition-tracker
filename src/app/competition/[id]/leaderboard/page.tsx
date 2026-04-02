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
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {competition?.name ?? "Clasament"}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Actualizare automată la câteva secunde; WebSocket opțional dacă este
          configurat pe server.
        </p>
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
