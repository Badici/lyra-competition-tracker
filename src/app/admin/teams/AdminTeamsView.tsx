"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/api/client";
import {
  createSector,
  createStand,
  createTeam,
  deleteTeam,
  fetchCompetitions,
  fetchSectors,
  fetchStandsForCompetition,
  fetchTeams,
  fetchTeamsAll,
  updateStand,
  updateTeam,
} from "@/lib/api/resources";
import { standLetterOrFallback } from "@/lib/constants/lakeStands";
import { queryKeys } from "@/lib/queryKeys";

export function AdminTeamsView() {
  const qc = useQueryClient();
  const router = useRouter();
  const sp = useSearchParams();

  const compsQ = useQuery({
    queryKey: queryKeys.competitions,
    queryFn: fetchCompetitions,
  });

  const competitionId = useMemo(() => {
    const q = sp.get("competition");
    if (q) return q;
    const first = compsQ.data?.[0]?.id;
    return first ?? "";
  }, [sp, compsQ.data]);

  const teamsAllQ = useQuery({
    queryKey: queryKeys.teamsAll,
    queryFn: fetchTeamsAll,
  });

  const teamsInContestQ = useQuery({
    queryKey: queryKeys.teams(competitionId),
    queryFn: () => fetchTeams({ competition: competitionId }),
    enabled: Boolean(competitionId),
  });

  const sectorsQ = useQuery({
    queryKey: queryKeys.sectors(competitionId),
    queryFn: () => fetchSectors({ competition: competitionId }),
    enabled: Boolean(competitionId),
  });

  const standsContestQ = useQuery({
    queryKey: queryKeys.stands(competitionId),
    queryFn: () => fetchStandsForCompetition(competitionId),
    enabled: Boolean(competitionId),
  });

  const [catalogName, setCatalogName] = useState("");
  const [catalogMembers, setCatalogMembers] = useState("");
  const [sectorName, setSectorName] = useState("");
  const [enrollTeamId, setEnrollTeamId] = useState("");
  const [enrollSectorId, setEnrollSectorId] = useState("");
  const [enrollStandId, setEnrollStandId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingCatalog, setEditingCatalog] = useState<{
    id: string;
    name: string;
    members: string;
  } | null>(null);

  const sectorMut = useMutation({
    mutationFn: async () => {
      if (!competitionId) throw new Error("Alege concursul.");
      const order = (sectorsQ.data?.length ?? 0) + 1;
      return createSector({
        name: sectorName,
        contest: Number(competitionId),
        description: `Sector ${order}`,
      });
    },
    onSuccess: async () => {
      setSectorName("");
      setError(null);
      await qc.invalidateQueries({
        queryKey: queryKeys.sectors(competitionId),
      });
    },
    onError: (e) => setError(getErrorMessage(e, "Eroare sector.")),
  });

  const catalogCreateMut = useMutation({
    mutationFn: () =>
      createTeam({
        name: catalogName.trim(),
        members_label: catalogMembers.trim() || undefined,
        logo_url: null,
      }),
    onSuccess: async () => {
      setCatalogName("");
      setCatalogMembers("");
      setError(null);
      await qc.invalidateQueries({ queryKey: queryKeys.teamsAll });
    },
    onError: (e) => setError(getErrorMessage(e, "Eroare creare echipă.")),
  });

  const catalogSaveMut = useMutation({
    mutationFn: () => {
      if (!editingCatalog) throw new Error("—");
      return updateTeam(editingCatalog.id, {
        name: editingCatalog.name.trim(),
        members_label: editingCatalog.members.trim() || undefined,
      });
    },
    onSuccess: async () => {
      setEditingCatalog(null);
      await qc.invalidateQueries({ queryKey: queryKeys.teamsAll });
      if (competitionId) {
        await qc.invalidateQueries({
          queryKey: queryKeys.teams(competitionId),
        });
      }
    },
    onError: (e) => setError(getErrorMessage(e, "Eroare salvare.")),
  });

  const enrollMut = useMutation({
    mutationFn: async () => {
      if (!competitionId || !enrollTeamId || !enrollSectorId) {
        throw new Error("Alege concurs, echipă și sector.");
      }
      await updateTeam(enrollTeamId, {
        contest: Number(competitionId),
        sector: Number(enrollSectorId),
      });
      if (enrollStandId) {
        await updateStand(enrollStandId, {
          team: Number(enrollTeamId),
          sector: Number(enrollSectorId),
          contest: Number(competitionId),
        });
      } else {
        await createStand({
          sector: Number(enrollSectorId),
          team: Number(enrollTeamId),
          contest: Number(competitionId),
          position_number: null,
        });
      }
    },
    onSuccess: async () => {
      setError(null);
      setEnrollTeamId("");
      setEnrollStandId("");
      await qc.invalidateQueries({ queryKey: queryKeys.teams(competitionId) });
      await qc.invalidateQueries({ queryKey: queryKeys.stands(competitionId) });
      await qc.invalidateQueries({ queryKey: queryKeys.standsAll });
    },
    onError: (e) => setError(getErrorMessage(e, "Eroare înscriere.")),
  });

  const deleteTeamMut = useMutation({
    mutationFn: (id: string) => deleteTeam(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.teamsAll });
      if (competitionId) {
        await qc.invalidateQueries({
          queryKey: queryKeys.teams(competitionId),
        });
      }
    },
  });

  function setCompetitionInUrl(id: string) {
    const next = new URLSearchParams(sp.toString());
    if (id) next.set("competition", id);
    else next.delete("competition");
    router.replace(`/admin/teams?${next.toString()}`);
  }

  const standsInSector = useMemo(() => {
    if (!enrollSectorId) return [];
    return (standsContestQ.data ?? []).filter(
      (s) => s.sectorId === enrollSectorId,
    );
  }, [standsContestQ.data, enrollSectorId]);

  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Registru echipe</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Definești o dată numele echipei și participanții (câte un nume pe
          linie). Apoi, la concurs, doar o înscrii și o legi de stand.
        </p>

        {editingCatalog && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/30">
            <h3 className="text-sm font-semibold">Editare echipă</h3>
            <label className="mt-2 block text-sm">
              Nume echipă
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                value={editingCatalog.name}
                onChange={(e) =>
                  setEditingCatalog({ ...editingCatalog, name: e.target.value })
                }
              />
            </label>
            <label className="mt-2 block text-sm">
              Participanți (câte un nume pe linie)
              <textarea
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                rows={4}
                value={editingCatalog.members}
                onChange={(e) =>
                  setEditingCatalog({
                    ...editingCatalog,
                    members: e.target.value,
                  })
                }
              />
            </label>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => catalogSaveMut.mutate()}
                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white"
              >
                Salvează
              </button>
              <button
                type="button"
                onClick={() => setEditingCatalog(null)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600"
              >
                Anulează
              </button>
            </div>
          </div>
        )}

        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            catalogCreateMut.mutate();
          }}
        >
          <input
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Nume echipă"
            value={catalogName}
            onChange={(e) => setCatalogName(e.target.value)}
            required
          />
          <textarea
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Participanți (câte un nume pe linie)"
            rows={4}
            value={catalogMembers}
            onChange={(e) => setCatalogMembers(e.target.value)}
          />
          <button
            type="submit"
            disabled={catalogCreateMut.isPending}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Adaugă în registru
          </button>
        </form>

        <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto text-sm">
          {teamsAllQ.data?.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-lg bg-zinc-50 px-2 py-2 dark:bg-zinc-900/60"
            >
              <div>
                <span className="font-medium">{t.name}</span>
                {t.membersLabel && (
                  <p className="mt-0.5 text-xs text-zinc-500 whitespace-pre-line">
                    {t.membersLabel}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditingCatalog({
                      id: t.id,
                      name: t.name,
                      members: t.membersLabel ?? "",
                    })
                  }
                  className="rounded border border-zinc-300 px-2 py-0.5 text-xs dark:border-zinc-600"
                >
                  Editează
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Ștergi echipa „${t.name}”?`))
                      deleteTeamMut.mutate(t.id);
                  }}
                  className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-700 dark:border-red-800 dark:text-red-400"
                >
                  Șterge
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-emerald-900/20 bg-emerald-50/40 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
        <h2 className="text-lg font-semibold text-emerald-950 dark:text-emerald-100">
          Înscriere la concurs
        </h2>
        <label className="mt-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Concurs
          <select
            className="mt-1 w-full max-w-md rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={competitionId}
            onChange={(e) => setCompetitionInUrl(e.target.value)}
          >
            {compsQ.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="font-semibold">Sector nou (acest concurs)</h3>
            <form
              className="mt-2 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                sectorMut.mutate();
              }}
            >
              <input
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                placeholder="Nume sector"
                value={sectorName}
                onChange={(e) => setSectorName(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={!competitionId || sectorMut.isPending}
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-semibold text-white dark:bg-zinc-200 dark:text-zinc-900"
              >
                Adaugă sector
              </button>
            </form>
            <ul className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              {sectorsQ.data?.map((s) => (
                <li key={s.id}>
                  {s.name} (ordine {s.order})
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="font-semibold">Leagă echipă de sector / stand</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Alege echipa din registru, sectorul și opțional standul (dacă
              există deja standuri repartizate pe sector). Altfel se creează un
              stand nou pe acel sector.
            </p>
            <form
              className="mt-3 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                enrollMut.mutate();
              }}
            >
              <label className="block text-sm">
                Echipă
                <select
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                  value={enrollTeamId}
                  onChange={(e) => setEnrollTeamId(e.target.value)}
                  required
                >
                  <option value="">Alege din registru</option>
                  {teamsAllQ.data?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Sector
                <select
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                  value={enrollSectorId}
                  onChange={(e) => {
                    setEnrollSectorId(e.target.value);
                    setEnrollStandId("");
                  }}
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
                Stand pe sector (opțional)
                <select
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                  value={enrollStandId}
                  onChange={(e) => setEnrollStandId(e.target.value)}
                >
                  <option value="">— creează stand nou pe sector —</option>
                  {standsInSector.map((s) => (
                    <option key={s.id} value={s.id}>
                      {standLetterOrFallback(s.label, s.id)}
                      {s.teamId ? " (are echipă)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={enrollMut.isPending || !competitionId}
                className="w-full rounded-xl bg-emerald-700 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Înscrie echipa
              </button>
            </form>
            <p className="mt-3 text-xs text-zinc-500">
              Înscrise la acest concurs:{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {teamsInContestQ.data?.length ?? 0}
              </span>
            </p>
          </div>
        </div>
      </section>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
