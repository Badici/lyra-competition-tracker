"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getErrorMessage } from "@/lib/api/client";
import {
  createLakeRegulation,
  deleteLakeRegulation,
  fetchLakeRegulations,
  fetchLakes,
  fetchRegulations,
} from "@/lib/api/resources";
import { queryKeys } from "@/lib/queryKeys";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export default function AdminLakeRegulationsPage() {
  const qc = useQueryClient();
  const lakesQ = useQuery({
    queryKey: queryKeys.lakes,
    queryFn: fetchLakes,
  });
  const regsQ = useQuery({
    queryKey: queryKeys.regulations,
    queryFn: fetchRegulations,
  });
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.lakeRegulations,
    queryFn: () => fetchLakeRegulations(),
  });
  const [lakeId, setLakeId] = useState("");
  const [regulationId, setRegulationId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const inv = () =>
    qc.invalidateQueries({ queryKey: queryKeys.lakeRegulations });

  const createMut = useMutation({
    mutationFn: () =>
      createLakeRegulation({
        lake: Number(lakeId),
        regulation: Number(regulationId),
      }),
    onSuccess: async () => {
      setError(null);
      await inv();
    },
    onError: (e) => setError(getErrorMessage(e, "Eroare.")),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteLakeRegulation(id),
    onSuccess: async () => inv(),
  });

  const lakeName = (id: string) =>
    lakesQ.data?.find((l) => l.id === id)?.name ?? id;
  const regTitle = (id: string) =>
    regsQ.data?.find((r) => r.id === id)?.title ?? id;

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h2 className="text-lg font-semibold">Legături lac ↔ regulament</h2>
        {isLoading && <p className="text-sm text-zinc-500">Se încarcă…</p>}
        <ul className="mt-3 space-y-2">
          {data?.map((x) => (
            <li
              key={x.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <span className="text-sm">
                {lakeName(x.lakeId)} · {regTitle(x.regulationId)}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Ștergi legătura?")) delMut.mutate(x.id);
                }}
                className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 dark:border-red-800 dark:text-red-400"
              >
                Șterge
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Legătură nouă</h2>
        <form
          className="mt-3 space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          onSubmit={(e) => {
            e.preventDefault();
            createMut.mutate();
          }}
        >
          <label className="block text-sm">
            Lac
            <select
              className={inputClass}
              value={lakeId}
              onChange={(e) => setLakeId(e.target.value)}
              required
            >
              <option value="">Alege</option>
              {lakesQ.data?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Regulament
            <select
              className={inputClass}
              value={regulationId}
              onChange={(e) => setRegulationId(e.target.value)}
              required
            >
              <option value="">Alege</option>
              {regsQ.data?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </label>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={createMut.isPending}
            className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white"
          >
            Creează legătura
          </button>
        </form>
      </section>
    </div>
  );
}
