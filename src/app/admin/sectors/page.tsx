"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/api/client";
import {
  createSector,
  deleteSector,
  fetchCompetition,
  fetchCompetitions,
  fetchSectors,
  fetchStands,
  fetchStandsAll,
  updateSector,
  updateStand,
} from "@/lib/api/resources";
import {
  sortLakeStandsByLetter,
  standLetterOrFallback,
} from "@/lib/constants/lakeStands";
import { queryKeys } from "@/lib/queryKeys";
import type { Sector } from "@/types/models";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";
const selectSm =
  "rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900";

export default function AdminSectorsPage() {
  const qc = useQueryClient();
  const compsQ = useQuery({
    queryKey: queryKeys.competitions,
    queryFn: fetchCompetitions,
  });
  const [contestId, setContestId] = useState("");
  const contestIdEff = useMemo(() => {
    if (contestId) return contestId;
    return compsQ.data?.[0]?.id ?? "";
  }, [contestId, compsQ.data]);

  const compQ = useQuery({
    queryKey: queryKeys.competition(contestIdEff),
    queryFn: () => fetchCompetition(contestIdEff),
    enabled: Boolean(contestIdEff),
  });

  const lakeId = compQ.data?.lakeId ?? "";

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.sectors(contestIdEff),
    queryFn: () => fetchSectors({ competition: contestIdEff }),
    enabled: Boolean(contestIdEff),
  });

  const lakeStandsByApiQ = useQuery({
    queryKey: queryKeys.standsLake(lakeId),
    queryFn: () => fetchStands({ lake: lakeId }),
    enabled: Boolean(lakeId),
  });

  const allStandsQ = useQuery({
    queryKey: queryKeys.standsAll,
    queryFn: fetchStandsAll,
  });

  const lakeStands = useMemo(() => {
    if (!lakeId) return [];
    const raw =
      (lakeStandsByApiQ.data?.length ?? 0) > 0
        ? (lakeStandsByApiQ.data ?? [])
        : (allStandsQ.data ?? []).filter((s) => s.lakeId === lakeId);
    return sortLakeStandsByLetter(raw);
  }, [lakeId, lakeStandsByApiQ.data, allStandsQ.data]);

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Sector | null>(null);

  const inv = () =>
    qc.invalidateQueries({ queryKey: queryKeys.sectors(contestIdEff) });

  const invStands = async () => {
    await qc.invalidateQueries({ queryKey: queryKeys.stands(contestIdEff) });
    if (lakeId)
      await qc.invalidateQueries({ queryKey: queryKeys.standsLake(lakeId) });
    await qc.invalidateQueries({ queryKey: queryKeys.standsAll });
  };

  const createMut = useMutation({
    mutationFn: () =>
      createSector({
        contest: Number(contestIdEff),
        name,
        description: "",
      }),
    onSuccess: async () => {
      setName("");
      setError(null);
      await inv();
    },
    onError: (e) => setError(getErrorMessage(e, "Eroare.")),
  });

  const saveMut = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("—");
      return updateSector(editing.id, {
        contest: Number(contestIdEff),
        name: editing.name,
        description: "",
      });
    },
    onSuccess: async () => {
      setEditing(null);
      await inv();
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteSector(id),
    onSuccess: async () => inv(),
  });

  const assignStandMut = useMutation({
    mutationFn: ({
      standId,
      sectorId,
    }: {
      standId: string;
      sectorId: string;
    }) =>
      updateStand(standId, {
        sector: sectorId ? Number(sectorId) : null,
        contest: Number(contestIdEff),
      }),
    onSuccess: async () => {
      setError(null);
      await invStands();
    },
    onError: (e) => setError(getErrorMessage(e, "Eroare repartizare stand.")),
  });

  return (
    <div className="space-y-10">
      <section>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Concurs
          <select
            className={inputClass}
            value={contestIdEff}
            onChange={(e) => setContestId(e.target.value)}
          >
            {compsQ.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Standuri pe lac → sector</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Lista standurilor (litere A–D) de pe lacul concursului. Alege pentru
          fiecare în ce sector intră la acest concurs.
        </p>
        {!lakeId && compQ.isFetched && (
          <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">
            Concursul nu are lac setat — editează concursul și alege lacul, apoi
            definește standurile A–D în „Standuri pe lac”.
          </p>
        )}
        {lakeId && !lakeStands.length && !lakeStandsByApiQ.isLoading && (
          <p className="mt-3 text-sm text-zinc-500">
            Niciun stand pe acest lac. Adaugă standuri A–D în „Standuri pe lac”.
          </p>
        )}
        {lakeStandsByApiQ.isLoading && lakeId && (
          <p className="mt-2 text-sm text-zinc-500">Se încarcă standurile…</p>
        )}
        {lakeStands.length > 0 && (
          <ul className="mt-4 space-y-2">
            {lakeStands.map((st) => (
              <li
                key={st.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/50"
              >
                <span className="w-24 text-base font-semibold">
                  Stand {standLetterOrFallback(st.label, st.id)}
                </span>
                <label className="flex flex-wrap items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="text-zinc-500">Sector</span>
                  <select
                    className={selectSm}
                    value={st.sectorId || ""}
                    onChange={(e) => {
                      assignStandMut.mutate({
                        standId: st.id,
                        sectorId: e.target.value,
                      });
                    }}
                    disabled={assignStandMut.isPending || !data?.length}
                  >
                    <option value="">— nealocat —</option>
                    {(data ?? []).map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        )}
        {lakeStands.length > 0 && !(data?.length ?? 0) && (
          <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">
            Creează mai jos cel puțin un sector ca să poți repartiza standurile.
          </p>
        )}
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-semibold">Sectoare</h2>
          {isLoading && (
            <p className="mt-2 text-sm text-zinc-500">Se încarcă…</p>
          )}
          <ul className="mt-3 space-y-2">
            {data?.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <span className="font-medium">{s.name}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(s)}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600"
                  >
                    Redenumește
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Ștergi sectorul „${s.name}”?`))
                        delMut.mutate(s.id);
                    }}
                    className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 dark:border-red-800 dark:text-red-400"
                  >
                    Șterge
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-6">
          {editing && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
              <h3 className="font-semibold">Redenumește sector</h3>
              <label className="mt-2 block text-sm">
                Nume
                <input
                  className={inputClass}
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
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
            <h2 className="text-lg font-semibold">Sector nou</h2>
            <form
              className="mt-3 space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              onSubmit={(e) => {
                e.preventDefault();
                createMut.mutate();
              }}
            >
              <label className="block text-sm">
                Nume sector
                <input
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <button
                type="submit"
                disabled={createMut.isPending || !contestIdEff}
                className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Adaugă sector
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
