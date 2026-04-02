"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/api/client";
import {
  fetchCompetition,
  fetchCompetitions,
  fetchSectors,
  fetchStands,
  fetchStandsForCompetition,
  fetchTeams,
  updateStand,
} from "@/lib/api/resources";
import { standLetterOrFallback } from "@/lib/constants/lakeStands";
import { queryKeys } from "@/lib/queryKeys";
import type { Stand } from "@/types/models";

const inputClass =
  "mt-1 w-full max-w-xs rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900";

function standDisplay(s: Stand): string {
  return standLetterOrFallback(s.label, s.id);
}

export default function AdminStandsPage() {
  const qc = useQueryClient();
  const compsQ = useQuery({
    queryKey: queryKeys.competitions,
    queryFn: fetchCompetitions,
  });
  const [contestId, setContestId] = useState("");
  const contestEff = useMemo(() => {
    if (contestId) return contestId;
    return compsQ.data?.[0]?.id ?? "";
  }, [contestId, compsQ.data]);

  const compQ = useQuery({
    queryKey: queryKeys.competition(contestEff),
    queryFn: () => fetchCompetition(contestEff),
    enabled: Boolean(contestEff),
  });

  const lakeId = compQ.data?.lakeId ?? "";

  const lakePoolQ = useQuery({
    queryKey: queryKeys.standsLake(lakeId),
    queryFn: () => fetchStands({ lake: lakeId }),
    enabled: Boolean(lakeId),
  });

  const contestStandsQ = useQuery({
    queryKey: queryKeys.stands(contestEff),
    queryFn: () => fetchStandsForCompetition(contestEff),
    enabled: Boolean(contestEff),
  });

  const teamsQ = useQuery({
    queryKey: queryKeys.teams(contestEff),
    queryFn: () => fetchTeams({ competition: contestEff }),
    enabled: Boolean(contestEff),
  });

  const sectorsQ = useQuery({
    queryKey: queryKeys.sectors(contestEff),
    queryFn: () => fetchSectors({ competition: contestEff }),
    enabled: Boolean(contestEff),
  });

  const sectorOrder = useMemo(() => {
    const ids = new Set<string>();
    for (const sec of sectorsQ.data ?? []) ids.add(sec.id);
    for (const s of contestStandsQ.data ?? []) {
      if (s.sectorId) ids.add(s.sectorId);
    }
    return [...ids].sort();
  }, [sectorsQ.data, contestStandsQ.data]);

  const sectorName = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of sectorsQ.data ?? []) m.set(s.id, s.name);
    return m;
  }, [sectorsQ.data]);

  const unassignedOnLake = useMemo(() => {
    const pool = lakePoolQ.data ?? [];
    const inContest = new Set((contestStandsQ.data ?? []).map((x) => x.id));
    return pool.filter(
      (s) => !s.sectorId && !inContest.has(s.id),
    );
  }, [lakePoolQ.data, contestStandsQ.data]);

  const [error, setError] = useState<string | null>(null);

  const assignSectorMut = useMutation({
    mutationFn: ({
      standId,
      sectorId,
    }: {
      standId: string;
      sectorId: string;
    }) =>
      updateStand(standId, {
        sector: Number(sectorId),
        contest: Number(contestEff),
      }),
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: queryKeys.stands(contestEff) });
      if (lakeId)
        await qc.invalidateQueries({ queryKey: queryKeys.standsLake(lakeId) });
      await qc.invalidateQueries({ queryKey: queryKeys.standsAll });
    },
    onError: (e) => setError(getErrorMessage(e, "Eroare repartizare.")),
  });

  const assignTeamMut = useMutation({
    mutationFn: ({
      standId,
      teamId,
    }: {
      standId: string;
      teamId: string | null;
    }) =>
      updateStand(standId, {
        team: teamId ? Number(teamId) : null,
        contest: Number(contestEff),
      }),
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: queryKeys.stands(contestEff) });
      await qc.invalidateQueries({ queryKey: queryKeys.standsAll });
    },
    onError: (e) => setError(getErrorMessage(e, "Eroare echipă pe stand.")),
  });

  const standsBySector = useMemo(() => {
    const map = new Map<string, Stand[]>();
    for (const s of contestStandsQ.data ?? []) {
      if (!s.sectorId) continue;
      const list = map.get(s.sectorId) ?? [];
      list.push(s);
      map.set(s.sectorId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) =>
        (a.label ?? a.id).localeCompare(b.label ?? b.id, "ro"),
      );
    }
    return map;
  }, [contestStandsQ.data]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold">Repartizare standuri la concurs</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Standurile sunt definite pe lac. Aici le aloci pe sectoarele acestui
          concurs și le legi de echipe (tragerea la sorți / repartizare).
        </p>
        <label className="mt-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Concurs
          <select
            className={inputClass + " mt-1 max-w-md"}
            value={contestEff}
            onChange={(e) => setContestId(e.target.value)}
          >
            {compsQ.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {compQ.data && (
          <p className="mt-2 text-sm text-zinc-500">
            Lac concurs:{" "}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {lakeId
                ? `id ${lakeId} (standurile se filtrează după lac)`
                : "— (setează lacul pe concurs)"}
            </span>
          </p>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </section>

      {lakeId && unassignedOnLake.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
            Standuri pe lac — fără sector la acest concurs
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {unassignedOnLake.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-2 rounded-lg bg-zinc-50 px-2 py-2 dark:bg-zinc-900/50"
              >
                <span className="font-medium">{standDisplay(s)}</span>
                <span className="text-zinc-500">→ sector</span>
                <select
                  className={inputClass}
                  defaultValue=""
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return;
                    assignSectorMut.mutate({ standId: s.id, sectorId: v });
                    e.target.value = "";
                  }}
                >
                  <option value="">Alege sector</option>
                  {(sectorsQ.data ?? []).map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
          {!(sectorsQ.data?.length ?? 0) && (
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
              Nu există sectoare încă pentru acest concurs. Creează sectoare în
              pagina „Sectoare”, apoi revino aici.
            </p>
          )}
        </section>
      )}

      <section className="space-y-4">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
          Echipe pe stand (în cadrul concursului)
        </h3>
        {!contestStandsQ.data?.length && !contestStandsQ.isLoading && (
          <p className="text-sm text-zinc-500">
            Niciun stand cu sector. Alocă standuri din lac pe sectoare mai sus,
            sau creează standuri direct pe sector din API-ul vechi.
          </p>
        )}
        {contestStandsQ.isLoading && (
          <p className="text-sm text-zinc-500">Se încarcă standurile…</p>
        )}
        <div className="space-y-6">
          {sectorOrder.map((sid) => {
            const list = standsBySector.get(sid) ?? [];
            if (!list.length) return null;
            return (
              <div
                key={sid}
                className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  {sectorName.get(sid) ?? `Sector ${sid}`}
                </h4>
                <ul className="mt-2 space-y-2">
                  {list.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center gap-2 text-sm"
                    >
                      <span className="w-40 shrink-0 font-medium text-zinc-800 dark:text-zinc-200">
                        {standDisplay(s)}
                      </span>
                      <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                        Echipă
                        <select
                          className={inputClass}
                          value={s.teamId ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            assignTeamMut.mutate({
                              standId: s.id,
                              teamId: v || null,
                            });
                          }}
                        >
                          <option value="">—</option>
                          {teamsQ.data?.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
