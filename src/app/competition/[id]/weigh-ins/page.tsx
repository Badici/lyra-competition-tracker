"use client";

import { useParams } from "next/navigation";
import { WeighInForm } from "@/components/weigh-ins/WeighInForm";
import { fishSpeciesLabel } from "@/lib/constants/fishing";
import { useCompetitionBundle } from "@/hooks/useCompetitionBundle";
import { useAuth } from "@/hooks/useAuth";
import { isPrivilegedUser } from "@/lib/auth/rbac";
import { Skeleton } from "@/components/ui/Skeleton";

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ro-RO", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function WeighInsPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { user, hydrated } = useAuth();
  const canManage = hydrated && isPrivilegedUser(user);
  const { competition, teams, stands, weighIns, isLoading, isError } =
    useCompetitionBundle(id, true);

  if (isError || (!isLoading && !competition)) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
        Nu s-au putut încărca capturile.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Capturi
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {canManage
            ? "Poți înregistra capturi noi. Formularul este simplificat pentru arbitri."
            : "Vizualizare istoric capturi. Pentru înregistrare, autentifică-te ca organizator."}
        </p>
      </header>

      {canManage && competition && (
        <WeighInForm
          competition={competition}
          teams={teams}
          stands={stands}
        />
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Istoric
        </h2>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <ul className="space-y-2">
            {[...weighIns]
              .sort(
                (a, b) =>
                  new Date(b.recordedAt).getTime() -
                  new Date(a.recordedAt).getTime(),
              )
              .map((w) => {
                const teamName =
                  teams.find((t) => t.id === w.teamId)?.name ?? w.teamId;
                return (
                  <li
                    key={w.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {teamName}
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {fishSpeciesLabel(w.fishType)} · {w.fishCount} pești ·{" "}
                      {w.totalWeightKg.toFixed(2)} kg
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formatTime(w.recordedAt)} ·{" "}
                      {w.kind === "extra" ? "suplimentară" : "programată"}
                    </span>
                  </li>
                );
              })}
            {!weighIns.length && (
              <li className="text-sm text-zinc-500">Nicio captură încă.</li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
