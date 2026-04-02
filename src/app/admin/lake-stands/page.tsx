"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/api/client";
import {
  createStand,
  deleteStand,
  fetchLakes,
  fetchStands,
  fetchStandsAll,
  updateStand,
} from "@/lib/api/resources";
import {
  LAKE_STAND_LETTERS,
  normalizeStandLetter,
  sortLakeStandsByLetter,
  standLetterOrFallback,
} from "@/lib/constants/lakeStands";
import { queryKeys } from "@/lib/queryKeys";
import type { Stand } from "@/types/models";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export default function AdminLakeStandsPage() {
  const qc = useQueryClient();
  const lakesQ = useQuery({
    queryKey: queryKeys.lakes,
    queryFn: fetchLakes,
  });
  const [lakeId, setLakeId] = useState("");
  const lakeEff = useMemo(() => {
    if (lakeId) return lakeId;
    return lakesQ.data?.[0]?.id ?? "";
  }, [lakeId, lakesQ.data]);

  const byLakeQ = useQuery({
    queryKey: queryKeys.standsLake(lakeEff),
    queryFn: () => fetchStands({ lake: lakeEff }),
    enabled: Boolean(lakeEff),
  });

  const allStandsQ = useQuery({
    queryKey: queryKeys.standsAll,
    queryFn: fetchStandsAll,
  });

  const pool = useMemo(() => {
    const fromApi = byLakeQ.data ?? [];
    const raw =
      fromApi.length > 0
        ? fromApi
        : (allStandsQ.data ?? []).filter((s) => s.lakeId === lakeEff);
    return sortLakeStandsByLetter(raw);
  }, [byLakeQ.data, allStandsQ.data, lakeEff]);

  const usedLetters = useMemo(() => {
    const u = new Set<string>();
    for (const s of pool) {
      const L = normalizeStandLetter(s.label);
      if (L) u.add(L);
    }
    return u;
  }, [pool]);

  const [letter, setLetter] = useState<(typeof LAKE_STAND_LETTERS)[number]>("A");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Stand | null>(null);

  const inv = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.standsAll });
    if (lakeEff)
      void qc.invalidateQueries({ queryKey: queryKeys.standsLake(lakeEff) });
  };

  const createMut = useMutation({
    mutationFn: () => {
      const L = availableForCreate.includes(letter)
        ? letter
        : availableForCreate[0];
      if (!L) throw new Error("Toate literele A–D sunt folosite.");
      return createStand({
        lake: Number(lakeEff),
        label: L,
        position_number: null,
      });
    },
    onSuccess: async () => {
      setError(null);
      await inv();
    },
    onError: (e) =>
      setError(
        getErrorMessage(e, "Eroare. Verifică că API-ul acceptă stand pe lac."),
      ),
  });

  const saveMut = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("—");
      const L = normalizeStandLetter(editing.label);
      if (!L) throw new Error("Alege A, B, C sau D.");
      return updateStand(editing.id, {
        lake: Number(lakeEff),
        label: L,
        position_number: null,
      });
    },
    onSuccess: async () => {
      setEditing(null);
      setError(null);
      await inv();
    },
    onError: (e) => setError(getErrorMessage(e, "Eroare salvare.")),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteStand(id),
    onSuccess: async () => inv(),
  });

  const availableForCreate = LAKE_STAND_LETTERS.filter(
    (L) => !usedLetters.has(L),
  );

  const displayLetter = availableForCreate.includes(letter)
    ? letter
    : (availableForCreate[0] ?? LAKE_STAND_LETTERS[0]);

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h2 className="text-lg font-semibold">Standuri pe lac</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Doar literele <strong>A, B, C, D</strong>. Repartizarea pe sectoare la
          un concurs se face în pagina <strong>Sectoare</strong>.
        </p>
        <label className="mt-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Lac
          <select
            className={inputClass}
            value={lakeEff}
            onChange={(e) => setLakeId(e.target.value)}
          >
            {lakesQ.data?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>
        {byLakeQ.isLoading && (
          <p className="mt-2 text-sm text-zinc-500">Se încarcă…</p>
        )}
        <ul className="mt-3 max-h-[480px] space-y-2 overflow-y-auto text-sm">
          {pool.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <span className="text-lg font-semibold tabular-nums">
                Stand {standLetterOrFallback(s.label, s.id)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(s)}
                  className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600"
                >
                  Schimbă litera
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Ștergi standul de pe lac?")) delMut.mutate(s.id);
                  }}
                  className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 dark:border-red-800 dark:text-red-400"
                >
                  Șterge
                </button>
              </div>
            </li>
          ))}
        </ul>
        {!pool.length && !byLakeQ.isLoading && (
          <p className="mt-2 text-sm text-zinc-500">
            Niciun stand. Adaugă A–D mai jos.
          </p>
        )}
      </section>

      <section className="space-y-6">
        {editing && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
            <h3 className="font-semibold">Literă stand</h3>
            <label className="mt-2 block text-sm">
              Alege litera
              <select
                className={inputClass}
                value={normalizeStandLetter(editing.label) ?? "A"}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    label: e.target.value,
                  })
                }
              >
                {LAKE_STAND_LETTERS.map((L) => (
                  <option key={L} value={L}>
                    {L}
                  </option>
                ))}
              </select>
            </label>
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  saveMut.mutate();
                }}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Salvează
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setError(null);
                }}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
              >
                Anulează
              </button>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold">Stand nou (literă)</h2>
          <form
            className="mt-3 space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              createMut.mutate();
            }}
          >
            <label className="block text-sm">
              Literă
              {availableForCreate.length > 0 ? (
                <select
                  className={inputClass}
                  value={displayLetter}
                  onChange={(e) =>
                    setLetter(
                      e.target.value as (typeof LAKE_STAND_LETTERS)[number],
                    )
                  }
                >
                  {LAKE_STAND_LETTERS.map((L) => (
                    <option key={L} value={L} disabled={usedLetters.has(L)}>
                      {L}
                      {usedLetters.has(L) ? " (folosită)" : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="mt-1 text-sm text-zinc-500">
                  Toate literele A–D sunt folosite pe acest lac.
                </p>
              )}
            </label>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={
                createMut.isPending || !lakeEff || !availableForCreate.length
              }
              className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Adaugă stand
            </button>
            {!availableForCreate.length && pool.length > 0 && (
              <p className="text-xs text-zinc-500">
                Toate literele A–D sunt deja folosite pe acest lac.
              </p>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
