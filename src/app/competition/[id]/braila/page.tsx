"use client";

import { useParams } from "next/navigation";
import { BrailaWidget } from "@/components/braila/BrailaWidget";
import { useCompetitionBundle } from "@/hooks/useCompetitionBundle";

export default function BrailaPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { braila, competition, isLoading, isError } = useCompetitionBundle(
    id,
    true,
  );

  if (isError || (!isLoading && !competition)) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
        Nu s-au putut încărca datele Braila.
      </p>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Braila
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Cel mai mare pește înregistrat pe zi, vizibil pentru toți participanții.
          Se bazează pe câmpul „cel mai mare pește” sau pe greutățile individuale
          din cântăriri.
        </p>
      </header>
      <BrailaWidget entries={braila} loading={isLoading} />
    </div>
  );
}
