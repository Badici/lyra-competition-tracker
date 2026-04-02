"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/api/client";
import {
  createWeighIn,
  deleteWeighIn,
  fetchCapturesAll,
  fetchCompetitions,
  fetchStandsForCompetition,
  fetchTeams,
  updateWeighIn,
} from "@/lib/api/resources";
import {
  FISH_SPECIES_OPTIONS,
  type FishSpeciesApi,
  fishSpeciesLabel,
  resolveStandIdForTeam,
} from "@/lib/constants/fishing";
import { standLetterOrFallback } from "@/lib/constants/lakeStands";
import { queryKeys } from "@/lib/queryKeys";
import type { WeighIn } from "@/types/models";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export default function AdminCapturesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.capturesAll,
    queryFn: fetchCapturesAll,
  });
  const contestsQ = useQuery({
    queryKey: queryKeys.competitions,
    queryFn: fetchCompetitions,
  });

  const [contestId, setContestId] = useState("");
  const contestEff = useMemo(() => {
    if (contestId) return contestId;
    return contestsQ.data?.[0]?.id ?? "";
  }, [contestId, contestsQ.data]);

  const standsQ = useQuery({
    queryKey: queryKeys.stands(contestEff),
    queryFn: () => fetchStandsForCompetition(contestEff),
    enabled: Boolean(contestEff),
  });

  const teamsQ = useQuery({
    queryKey: queryKeys.teams(contestEff),
    queryFn: () => fetchTeams({ competition: contestEff }),
    enabled: Boolean(contestEff),
  });

  const [teamId, setTeamId] = useState("");
  const [species, setSpecies] = useState<FishSpeciesApi>("carp");
  const [fishCount, setFishCount] = useState("1");
  const [weight, setWeight] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<WeighIn | null>(null);

  const standIdForTeam = teamId
    ? resolveStandIdForTeam(standsQ.data ?? [], teamId)
    : undefined;

  const standRowForTeam = standIdForTeam
    ? (standsQ.data ?? []).find((s) => s.id === standIdForTeam)
    : undefined;

  const inv = () =>
    qc.invalidateQueries({ queryKey: queryKeys.capturesAll });

  const createMut = useMutation({
    mutationFn: () => {
      const w = parseFloat(weight.replace(",", "."));
      const count = parseInt(fishCount, 10);
      if (!teamId) throw new Error("Alege echipa.");
      if (!standIdForTeam) {
        throw new Error(
          "Echipa nu are stand repartizat în acest concurs. Folosește „Repartizare standuri”.",
        );
      }
      if (!Number.isFinite(w) || w <= 0) throw new Error("Greutate invalidă");
      if (!Number.isFinite(count) || count < 1) {
        throw new Error("Număr de pești invalid.");
      }
      return createWeighIn({
        contest: Number(contestEff),
        stand: Number(standIdForTeam),
        team: Number(teamId),
        fish_type: species,
        fish_count: count,
        weight: w,
        caught_at: new Date().toISOString(),
      });
    },
    onSuccess: async () => {
      setWeight("");
      setFishCount("1");
      setError(null);
      await inv();
      await qc.invalidateQueries({
        queryKey: queryKeys.weighIns(contestEff),
      });
    },
    onError: (e) => setError(getErrorMessage(e, "Eroare.")),
  });

  const saveMut = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("—");
      const sid = editing.teamId
        ? resolveStandIdForTeam(standsQ.data ?? [], editing.teamId)
        : undefined;
      return updateWeighIn(editing.id, {
        contest: Number(editing.competitionId),
        stand: sid ? Number(sid) : null,
        team: editing.teamId ? Number(editing.teamId) : null,
        fish_type: editing.fishType,
        fish_count: editing.fishCount,
        weight: editing.totalWeightKg,
        caught_at: editing.recordedAt,
      });
    },
    onSuccess: async () => {
      setEditing(null);
      await inv();
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteWeighIn(id),
    onSuccess: async () => inv(),
  });

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h2 className="text-lg font-semibold">Cântăriri / capturi</h2>
        {isLoading && <p className="text-sm text-zinc-500">Se încarcă…</p>}
        <ul className="mt-3 max-h-[520px] space-y-2 overflow-y-auto text-sm">
          {data?.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  #{c.id} · {fishSpeciesLabel(c.fishType)} · {c.fishCount}{" "}
                  pești · {c.totalWeightKg} kg · concurs {c.competitionId}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing({ ...c })}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600"
                  >
                    Editează
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Ștergi înregistrarea?")) delMut.mutate(c.id);
                    }}
                    className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 dark:border-red-800 dark:text-red-400"
                  >
                    Șterge
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-6">
        {editing && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
            <h3 className="font-semibold">Editare #{editing.id}</h3>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Standul rămâne legat de echipă; schimbă echipa doar dacă știi că
              repartizarea s-a actualizat.
            </p>
            <label className="mt-2 block text-sm">
              Concurs
              <select
                className={inputClass}
                value={editing.competitionId}
                onChange={(e) =>
                  setEditing({ ...editing, competitionId: e.target.value })
                }
              >
                {contestsQ.data?.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-2 block text-sm">
              Echipă
              <select
                className={inputClass}
                value={editing.teamId}
                onChange={(e) =>
                  setEditing({ ...editing, teamId: e.target.value })
                }
              >
                {teamsQ.data?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-2 block text-sm">
              Specie
              <select
                className={inputClass}
                value={
                  editing.fishType === "tench" || editing.fishType === "carp"
                    ? editing.fishType
                    : "carp"
                }
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    fishType: e.target.value,
                  })
                }
              >
                {FISH_SPECIES_OPTIONS.map((o) => (
                  <option key={o.apiValue} value={o.apiValue}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-2 block text-sm">
              Număr pești
              <input
                type="number"
                min={1}
                className={inputClass}
                value={editing.fishCount}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    fishCount: parseInt(e.target.value, 10) || 1,
                  })
                }
              />
            </label>
            <label className="mt-2 block text-sm">
              Greutate (kg)
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={editing.totalWeightKg}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    totalWeightKg: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </label>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => saveMut.mutate()}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Salvează
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
              >
                Anulează
              </button>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold">Cântărire nouă</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Standul se deduce din echipa aleasă. Specia: doar crap sau țipă.
          </p>
          <form
            className="mt-3 space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            onSubmit={(e) => {
              e.preventDefault();
              createMut.mutate();
            }}
          >
            <label className="block text-sm">
              Concurs
              <select
                className={inputClass}
                value={contestEff}
                onChange={(e) => setContestId(e.target.value)}
                required
              >
                {contestsQ.data?.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Echipă
              <select
                className={inputClass}
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
              >
                <option value="">Alege</option>
                {teamsQ.data?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            {teamId && (
              <p className="text-xs text-zinc-500">
                {standRowForTeam
                  ? `Stand: ${standLetterOrFallback(standRowForTeam.label, standRowForTeam.id)}`
                  : standIdForTeam
                    ? `Stand: #${standIdForTeam}`
                    : "Echipa nu are stand — repartizează în „Sectoare” sau „Repartizare standuri”."}
              </p>
            )}
            <label className="block text-sm">
              Specie
              <select
                className={inputClass}
                value={species}
                onChange={(e) =>
                  setSpecies(e.target.value as FishSpeciesApi)
                }
              >
                {FISH_SPECIES_OPTIONS.map((o) => (
                  <option key={o.apiValue} value={o.apiValue}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Număr de pești
              <input
                type="number"
                min={1}
                className={inputClass}
                value={fishCount}
                onChange={(e) => setFishCount(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm">
              Greutate totală (kg)
              <input
                className={inputClass}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
            </label>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={
                createMut.isPending || !contestEff || !teamId || !standIdForTeam
              }
              className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Salvează
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
