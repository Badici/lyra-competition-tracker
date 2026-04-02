"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { getErrorMessage } from "@/lib/api/client";
import {
  createCompetition,
  deleteCompetition,
  fetchCompetitions,
  fetchLakes,
  fetchUsers,
  updateCompetition,
} from "@/lib/api/resources";
import { queryKeys } from "@/lib/queryKeys";
import type { Competition } from "@/types/models";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export default function AdminContestsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.competitions,
    queryFn: fetchCompetitions,
  });
  const usersQ = useQuery({
    queryKey: queryKeys.users,
    queryFn: fetchUsers,
  });
  const lakesQ = useQuery({
    queryKey: queryKeys.lakes,
    queryFn: fetchLakes,
  });

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [contestType, setContestType] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [organizerId, setOrganizerId] = useState("");
  const [lakeId, setLakeId] = useState("");
  const [rulesText, setRulesText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Competition | null>(null);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: queryKeys.competitions });

  const createMut = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        organizer: Number(organizerId),
        lake: Number(lakeId),
        name,
        rules: rulesText || "",
      };
      if (startDate) payload.start_date = startDate;
      if (endDate) payload.end_date = endDate;
      if (contestType.trim()) payload.type = contestType.trim();
      if (durationHours.trim()) {
        const n = parseInt(durationHours, 10);
        if (Number.isFinite(n)) payload.duration_hours = n;
      }
      return createCompetition(payload);
    },
    onSuccess: async () => {
      setFormError(null);
      setName("");
      setRulesText("");
      setStartDate("");
      setEndDate("");
      setContestType("");
      setDurationHours("");
      await invalidate();
    },
    onError: (e) => setFormError(getErrorMessage(e, "Eroare la creare.")),
  });

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!editing) throw new Error("—");
      const payload: Record<string, unknown> = {
        organizer: Number(editing.organizerId),
        lake: Number(editing.lakeId),
        name: editing.name,
        rules: editing.rulesText ?? "",
      };
      if (editing.startDate) payload.start_date = editing.startDate;
      if (editing.endDate) payload.end_date = editing.endDate;
      if (editing.rawType != null && editing.rawType !== "")
        payload.type = editing.rawType;
      if (editing.durationHours != null)
        payload.duration_hours = editing.durationHours;
      return updateCompetition(editing.id, payload);
    },
    onSuccess: async () => {
      setEditing(null);
      await invalidate();
    },
    onError: (e) => setFormError(getErrorMessage(e, "Eroare la salvare.")),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCompetition(id),
    onSuccess: async () => {
      await invalidate();
    },
  });

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Concursuri
        </h2>
        {isLoading && <p className="text-sm text-zinc-500">Se încarcă…</p>}
        <ul className="mt-3 space-y-2">
          {data?.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div>
                <Link
                  href={`/competition/${c.id}/leaderboard`}
                  className="font-medium text-emerald-800 hover:underline dark:text-emerald-400"
                >
                  {c.name}
                </Link>
                <p className="text-xs text-zinc-500">
                  {c.rawType ?? c.type}
                  {c.startDate ? ` · ${c.startDate}` : ""}
                  {c.endDate ? ` → ${c.endDate}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditing({ ...c })}
                  className="rounded-lg border border-zinc-300 px-2 py-1 text-xs font-medium dark:border-zinc-600"
                >
                  Editează
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        `Ștergi concursul „${c.name}”? Operația este ireversibilă.`,
                      )
                    )
                      deleteMut.mutate(c.id);
                  }}
                  className="rounded-lg border border-red-300 px-2 py-1 text-xs font-medium text-red-700 dark:border-red-800 dark:text-red-400"
                >
                  Șterge
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-8">
        {editing && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              Editare: {editing.name}
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="font-medium">Nume</span>
                <input
                  className={inputClass}
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Organizator (id)</span>
                <select
                  className={inputClass}
                  value={editing.organizerId ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, organizerId: e.target.value })
                  }
                >
                  {usersQ.data?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium">Lac (id)</span>
                <select
                  className={inputClass}
                  value={editing.lakeId ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, lakeId: e.target.value })
                  }
                >
                  {lakesQ.data?.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium">Tip (text API)</span>
                <input
                  className={inputClass}
                  value={editing.rawType ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, rawType: e.target.value })
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Durată (ore)</span>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={editing.durationHours ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      durationHours: e.target.value
                        ? parseInt(e.target.value, 10)
                        : undefined,
                    })
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Start</span>
                <input
                  type="date"
                  className={inputClass}
                  value={editing.startDate}
                  onChange={(e) =>
                    setEditing({ ...editing, startDate: e.target.value })
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Sfârșit</span>
                <input
                  type="date"
                  className={inputClass}
                  value={editing.endDate}
                  onChange={(e) =>
                    setEditing({ ...editing, endDate: e.target.value })
                  }
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="font-medium">Reguli</span>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={editing.rulesText ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, rulesText: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => updateMut.mutate()}
                disabled={updateMut.isPending}
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
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Concurs nou
          </h2>
          <form
            className="mt-3 space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            onSubmit={(e) => {
              e.preventDefault();
              createMut.mutate();
            }}
          >
            <label className="block text-sm">
              <span className="font-medium">Nume</span>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium">Start (opțional)</span>
                <input
                  type="date"
                  className={inputClass}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Sfârșit (opțional)</span>
                <input
                  type="date"
                  className={inputClass}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="font-medium">Tip (opțional, text API)</span>
              <input
                className={inputClass}
                value={contestType}
                onChange={(e) => setContestType(e.target.value)}
                placeholder="ex: quantity sau etichetă backend"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Durată ore (opțional)</span>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Organizator</span>
              <select
                className={inputClass}
                value={organizerId}
                onChange={(e) => setOrganizerId(e.target.value)}
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
              <span className="font-medium">Lac</span>
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
              <span className="font-medium">Reguli (text)</span>
              <textarea
                className={inputClass}
                rows={4}
                value={rulesText}
                onChange={(e) => setRulesText(e.target.value)}
              />
            </label>
            {formError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {formError}
              </p>
            )}
            <button
              type="submit"
              disabled={createMut.isPending || !organizerId || !lakeId}
              className="w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {createMut.isPending ? "Se creează…" : "Creează concurs"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
