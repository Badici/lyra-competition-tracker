"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getErrorMessage } from "@/lib/api/client";
import {
  createRegulation,
  deleteRegulation,
  fetchRegulations,
  updateRegulation,
} from "@/lib/api/resources";
import { queryKeys } from "@/lib/queryKeys";
import type { Regulation } from "@/types/models";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export default function AdminRegulationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.regulations,
    queryFn: fetchRegulations,
  });
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Regulation | null>(null);

  const inv = () => qc.invalidateQueries({ queryKey: queryKeys.regulations });

  const createMut = useMutation({
    mutationFn: () =>
      createRegulation({
        title,
        category: category || undefined,
        description: description || undefined,
      }),
    onSuccess: async () => {
      setTitle("");
      setCategory("");
      setDescription("");
      setError(null);
      await inv();
    },
    onError: (e) => setError(getErrorMessage(e, "Eroare.")),
  });

  const saveMut = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("—");
      return updateRegulation(editing.id, {
        title: editing.title,
        category: editing.category,
        description: editing.description,
      });
    },
    onSuccess: async () => {
      setEditing(null);
      await inv();
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteRegulation(id),
    onSuccess: async () => inv(),
  });

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h2 className="text-lg font-semibold">Regulamente</h2>
        {isLoading && <p className="text-sm text-zinc-500">Se încarcă…</p>}
        <ul className="mt-3 space-y-2">
          {data?.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{r.title}</p>
                  {r.category && (
                    <p className="text-xs text-zinc-500">{r.category}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(r)}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600"
                  >
                    Editează
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Ștergi regulamentul?"))
                        delMut.mutate(r.id);
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
            <h3 className="font-semibold">Editare</h3>
            <label className="mt-2 block text-sm">
              Titlu
              <input
                className={inputClass}
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </label>
            <label className="mt-2 block text-sm">
              Categorie
              <input
                className={inputClass}
                value={editing.category ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, category: e.target.value })
                }
              />
            </label>
            <label className="mt-2 block text-sm">
              Descriere
              <textarea
                className={inputClass}
                rows={3}
                value={editing.description ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, description: e.target.value })
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
          <h2 className="text-lg font-semibold">Regulament nou</h2>
          <form
            className="mt-3 space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            onSubmit={(e) => {
              e.preventDefault();
              createMut.mutate();
            }}
          >
            <label className="block text-sm">
              Titlu
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm">
              Categorie
              <input
                className={inputClass}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Descriere
              <textarea
                className={inputClass}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
              Adaugă
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
