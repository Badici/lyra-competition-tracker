"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getErrorMessage } from "@/lib/api/client";
import {
  createTeamMember,
  deleteTeamMember,
  fetchTeamMembers,
  fetchTeamsAll,
  fetchUsers,
  updateTeamMember,
} from "@/lib/api/resources";
import { queryKeys } from "@/lib/queryKeys";
import type { TeamMember } from "@/types/models";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export default function AdminTeamMembersPage() {
  const qc = useQueryClient();
  const teamsQ = useQuery({
    queryKey: queryKeys.teamsAll,
    queryFn: fetchTeamsAll,
  });
  const usersQ = useQuery({
    queryKey: queryKeys.users,
    queryFn: fetchUsers,
  });
  const [filterTeam, setFilterTeam] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.teamMembers(filterTeam || undefined),
    queryFn: () =>
      fetchTeamMembers(filterTeam ? { team: filterTeam } : undefined),
  });

  const [teamId, setTeamId] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"captain" | "member">("member");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<TeamMember | null>(null);

  const inv = () =>
    qc.invalidateQueries({ queryKey: ["teamMembers"] });

  const createMut = useMutation({
    mutationFn: () =>
      createTeamMember({
        team: Number(teamId),
        user: Number(userId),
        role,
      }),
    onSuccess: async () => {
      setTeamId("");
      setUserId("");
      setError(null);
      await inv();
    },
    onError: (e) => setError(getErrorMessage(e, "Eroare.")),
  });

  const saveMut = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("—");
      return updateTeamMember(editing.id, {
        team: Number(editing.teamId),
        user: Number(editing.userId),
        role: editing.role,
      });
    },
    onSuccess: async () => {
      setEditing(null);
      await inv();
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteTeamMember(id),
    onSuccess: async () => inv(),
  });

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h2 className="text-lg font-semibold">Membri echipe</h2>
        <label className="mt-2 block text-sm">
          Filtrează după echipă
          <select
            className={inputClass}
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
          >
            <option value="">Toate</option>
            {teamsQ.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        {isLoading && <p className="mt-2 text-sm text-zinc-500">Se încarcă…</p>}
        <ul className="mt-3 space-y-2">
          {data?.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <span>
                Echipă {m.teamId} · User {m.userId} · {m.role}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(m)}
                  className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600"
                >
                  Editează
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Ștergi membrul?")) delMut.mutate(m.id);
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
            <h3 className="font-semibold">Editare membru</h3>
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
              Utilizator
              <select
                className={inputClass}
                value={editing.userId}
                onChange={(e) =>
                  setEditing({ ...editing, userId: e.target.value })
                }
              >
                {usersQ.data?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-2 block text-sm">
              Rol
              <select
                className={inputClass}
                value={editing.role}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    role: e.target.value as TeamMember["role"],
                  })
                }
              >
                <option value="captain">Căpitan</option>
                <option value="member">Membru</option>
              </select>
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
          <h2 className="text-lg font-semibold">Membru nou</h2>
          <form
            className="mt-3 space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            onSubmit={(e) => {
              e.preventDefault();
              createMut.mutate();
            }}
          >
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
              Utilizator
              <select
                className={inputClass}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              >
                <option value="">Alege</option>
                {usersQ.data?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Rol
              <select
                className={inputClass}
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "captain" | "member")
                }
              >
                <option value="captain">Căpitan</option>
                <option value="member">Membru</option>
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
              Adaugă
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
