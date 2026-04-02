"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getErrorMessage } from "@/lib/api/client";
import {
  createResult,
  deleteResult,
  fetchCompetitions,
  fetchResultsAll,
  fetchSectors,
  fetchTeamsAll,
  updateResult,
} from "@/lib/api/resources";
import { queryKeys } from "@/lib/queryKeys";
import type { CompetitionResult } from "@/types/models";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export default function AdminResultsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.resultsAll,
    queryFn: fetchResultsAll,
  });
  const contestsQ = useQuery({
    queryKey: queryKeys.competitions,
    queryFn: fetchCompetitions,
  });
  const teamsQ = useQuery({
    queryKey: queryKeys.teamsAll,
    queryFn: fetchTeamsAll,
  });

  const [contestForSectors, setContestForSectors] = useState("");
  const sectorsQ = useQuery({
    queryKey: queryKeys.sectors(contestForSectors),
    queryFn: () => fetchSectors({ competition: contestForSectors }),
    enabled: Boolean(contestForSectors),
  });

  const [contestId, setContestId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [totalWeight, setTotalWeight] = useState("");
  const [totalFish, setTotalFish] = useState("0");
  const [biggestFish, setBiggestFish] = useState("0");
  const [rankPosition, setRankPosition] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CompetitionResult | null>(null);

  const inv = () =>
    qc.invalidateQueries({ queryKey: queryKeys.resultsAll });

  const createMut = useMutation({
    mutationFn: () => {
      const tw = parseFloat(totalWeight.replace(",", "."));
      if (!Number.isFinite(tw)) throw new Error("Greutate invalidă");
      const tf = parseInt(totalFish, 10);
      const bf = parseFloat(biggestFish.replace(",", "."));
      const rp =
        rankPosition.trim() === ""
          ? null
          : parseInt(rankPosition, 10);
      return createResult({
        contest: Number(contestId),
        team: Number(teamId),
        sector: Number(sectorId),
        total_weight: tw,
        total_fish: Number.isFinite(tf) ? tf : 0,
        biggest_fish: Number.isFinite(bf) ? bf : 0,
        rank_position: rp != null && Number.isFinite(rp) ? rp : null,
      });
    },
    onSuccess: async () => {
      setTotalWeight("");
      setTotalFish("0");
      setBiggestFish("0");
      setRankPosition("");
      setError(null);
      await inv();
      if (contestId) {
        await qc.invalidateQueries({
          queryKey: queryKeys.results(contestId),
        });
      }
    },
    onError: (e) => setError(getErrorMessage(e, "Eroare.")),
  });

  const saveMut = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("—");
      return updateResult(editing.id, {
        contest: Number(editing.competitionId),
        team: Number(editing.teamId),
        sector: Number(editing.sectorId),
        total_weight: editing.totalWeightKg,
        total_fish: editing.totalFish,
        biggest_fish: editing.biggestFishKg,
        rank_position: editing.rankPosition ?? null,
      });
    },
    onSuccess: async () => {
      const cid = editing?.competitionId;
      setEditing(null);
      await inv();
      if (cid) {
        await qc.invalidateQueries({ queryKey: queryKeys.results(cid) });
      }
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteResult(id),
    onSuccess: async () => inv(),
  });

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h2 className="text-lg font-semibold">Rezultate</h2>
        {isLoading && <p className="text-sm text-zinc-500">Se încarcă…</p>}
        <ul className="mt-3 max-h-[520px] space-y-2 overflow-y-auto text-sm">
          {data?.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  #{r.id} · concurs {r.competitionId} · echipă {r.teamId} ·{" "}
                  {r.totalWeightKg} kg · loc {r.rankPosition ?? "—"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setContestForSectors(r.competitionId);
                      setEditing({ ...r });
                    }}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600"
                  >
                    Editează
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Ștergi rezultatul?")) delMut.mutate(r.id);
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
            <h3 className="font-semibold">Editare rezultat #{editing.id}</h3>
            <label className="mt-2 block text-sm">
              Concurs
              <select
                className={inputClass}
                value={editing.competitionId}
                onChange={(e) => {
                  const v = e.target.value;
                  setContestForSectors(v);
                  setEditing({ ...editing, competitionId: v, sectorId: "" });
                }}
              >
                {contestsQ.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-2 block text-sm">
              Sector
              <select
                className={inputClass}
                value={editing.sectorId}
                onChange={(e) =>
                  setEditing({ ...editing, sectorId: e.target.value })
                }
              >
                {sectorsQ.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
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
              Greutate totală
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
            <label className="mt-2 block text-sm">
              Nr. pești
              <input
                type="number"
                className={inputClass}
                value={editing.totalFish}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    totalFish: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
            </label>
            <label className="mt-2 block text-sm">
              Cel mai mare pește
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={editing.biggestFishKg}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    biggestFishKg: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </label>
            <label className="mt-2 block text-sm">
              Loc (opțional)
              <input
                type="number"
                className={inputClass}
                value={editing.rankPosition ?? ""}
                onChange={(e) => {
                  if (e.target.value === "") {
                    setEditing({ ...editing, rankPosition: null });
                    return;
                  }
                  const n = parseInt(e.target.value, 10);
                  setEditing({
                    ...editing,
                    rankPosition: Number.isFinite(n) ? n : null,
                  });
                }}
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
          <h2 className="text-lg font-semibold">Rezultat nou</h2>
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
                value={contestId}
                onChange={(e) => {
                  const v = e.target.value;
                  setContestId(v);
                  setContestForSectors(v);
                  setSectorId("");
                }}
                required
              >
                <option value="">Alege</option>
                {contestsQ.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Sector
              <select
                className={inputClass}
                value={sectorId}
                onChange={(e) => setSectorId(e.target.value)}
                required
              >
                <option value="">Alege</option>
                {sectorsQ.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
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
            <label className="block text-sm">
              Greutate totală (kg)
              <input
                className={inputClass}
                value={totalWeight}
                onChange={(e) => setTotalWeight(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm">
              Nr. pești
              <input
                className={inputClass}
                value={totalFish}
                onChange={(e) => setTotalFish(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Cel mai mare pește (kg)
              <input
                className={inputClass}
                value={biggestFish}
                onChange={(e) => setBiggestFish(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Loc (opțional)
              <input
                className={inputClass}
                value={rankPosition}
                onChange={(e) => setRankPosition(e.target.value)}
              />
            </label>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={createMut.isPending}
              className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white"
            >
              Adaugă rezultat
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
