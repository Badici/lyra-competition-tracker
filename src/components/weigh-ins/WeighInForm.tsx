"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/api/client";
import { createWeighIn } from "@/lib/api/resources";
import {
  FISH_SPECIES_OPTIONS,
  type FishSpeciesApi,
  resolveStandIdForTeam,
} from "@/lib/constants/fishing";
import { standLetterOrFallback } from "@/lib/constants/lakeStands";
import { queryKeys } from "@/lib/queryKeys";
import type { Competition, Stand, Team } from "@/types/models";

export function WeighInForm({
  competition,
  teams,
  stands,
}: {
  competition: Competition;
  teams: Team[];
  stands: Stand[];
}) {
  const qc = useQueryClient();
  const [teamId, setTeamId] = useState("");
  const [species, setSpecies] = useState<FishSpeciesApi>("carp");
  const [fishCount, setFishCount] = useState("1");
  const [weight, setWeight] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeTeamId = useMemo(() => {
    if (teamId && teams.some((t) => t.id === teamId)) return teamId;
    return teams[0]?.id ?? "";
  }, [teams, teamId]);

  const standId = activeTeamId
    ? resolveStandIdForTeam(stands, activeTeamId)
    : undefined;

  const standRow = standId ? stands.find((x) => x.id === standId) : undefined;

  const mutation = useMutation({
    mutationFn: async () => {
      const parsedWeight = parseFloat(weight.replace(",", "."));
      const count = parseInt(fishCount, 10);
      if (!activeTeamId) throw new Error("Alege echipa.");
      if (!standId)
        throw new Error(
          "Echipa nu are stand repartizat. Alocă standul în panoul de admin (repartizare standuri).",
        );
      if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
        throw new Error("Greutate invalidă.");
      }
      if (!Number.isFinite(count) || count < 1) {
        throw new Error("Număr de pești invalid (minim 1).");
      }
      const payload: Record<string, unknown> = {
        contest: Number(competition.id),
        stand: Number(standId),
        team: Number(activeTeamId),
        fish_type: species,
        fish_count: count,
        weight: parsedWeight,
        caught_at: new Date().toISOString(),
      };
      return createWeighIn(payload);
    },
    onMutate: async () => {
      setError(null);
      await qc.cancelQueries({
        queryKey: queryKeys.weighIns(competition.id),
      });
    },
    onSuccess: async () => {
      setWeight("");
      setFishCount("1");
      await qc.invalidateQueries({
        queryKey: queryKeys.weighIns(competition.id),
      });
    },
    onError: (e) => {
      setError(getErrorMessage(e, "Nu s-a putut salva cântărirea."));
    },
  });

  const standHint = activeTeamId
    ? standId
      ? `Stand: ${
          standRow
            ? standLetterOrFallback(standRow.label, standRow.id)
            : `#${standId}`
        }`
      : "— fără stand"
    : "";

  return (
    <form
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Înregistrare cântărire
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Standul se ia automat din repartizarea echipei; aici alegi doar echipa,
        specia (crap / țipă), numărul de pești și greutatea totală a cântarului.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Echipă
          </span>
          <select
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={activeTeamId}
            onChange={(e) => setTeamId(e.target.value)}
            required
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.membersLabel ? ` — ${t.membersLabel.replace(/\n/g, ", ")}` : ""}
              </option>
            ))}
          </select>
          {activeTeamId && (
            <span className="text-xs text-zinc-500">{standHint}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Specie
          </span>
          <select
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={species}
            onChange={(e) => setSpecies(e.target.value as FishSpeciesApi)}
            required
          >
            {FISH_SPECIES_OPTIONS.map((o) => (
              <option key={o.apiValue} value={o.apiValue}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Număr de pești (cântarul curent)
          </span>
          <input
            type="number"
            min={1}
            step={1}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={fishCount}
            onChange={(e) => setFishCount(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Greutate totală (kg)
          </span>
          <input
            inputMode="decimal"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0.00"
            required
          />
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={
          mutation.isPending ||
          !teams.length ||
          !activeTeamId ||
          !resolveStandIdForTeam(stands, activeTeamId)
        }
        className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-800 disabled:opacity-50 sm:w-auto"
      >
        {mutation.isPending ? "Se salvează…" : "Salvează cântărirea"}
      </button>
    </form>
  );
}
