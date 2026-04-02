"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getErrorMessage } from "@/lib/api/client";
import {
  createUser,
  deleteUser,
  fetchUsers,
  updateUser,
} from "@/lib/api/resources";
import { queryKeys } from "@/lib/queryKeys";
import type { AuthUser } from "@/types/models";

/** Valori trimise la API (Django UserRole), nu etichetele normalizate din UI */
type ApiRole = "admin" | "contest_organizer" | "user";

function uiRoleToApi(role: AuthUser["role"]): ApiRole {
  if (role === "organizer") return "contest_organizer";
  if (role === "admin") return "admin";
  return "user";
}

function apiRoleLabel(r: ApiRole): string {
  switch (r) {
    case "admin":
      return "Administrator";
    case "contest_organizer":
      return "Organizator concurs";
    default:
      return "Utilizator";
  }
}

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.users,
    queryFn: fetchUsers,
  });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<ApiRole>("user");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AuthUser | null>(null);
  const [editPassword, setEditPassword] = useState("");

  const inv = () => qc.invalidateQueries({ queryKey: queryKeys.users });

  const createMut = useMutation({
    mutationFn: () =>
      createUser({
        username,
        password: password || undefined,
        email: email || undefined,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        role,
      }),
    onSuccess: async () => {
      setUsername("");
      setPassword("");
      setEmail("");
      setFirstName("");
      setLastName("");
      setRole("user");
      setError(null);
      await inv();
    },
    onError: (e) => setError(getErrorMessage(e, "Eroare creare utilizator.")),
  });

  const saveMut = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("—");
      const payload: Record<string, unknown> = {
        email: editing.email || undefined,
        role: uiRoleToApi(editing.role),
      };
      if (editPassword.trim()) payload.password = editPassword.trim();
      return updateUser(editing.id, payload);
    },
    onSuccess: async () => {
      setEditing(null);
      setEditPassword("");
      await inv();
    },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: async () => inv(),
  });

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h2 className="text-lg font-semibold">Utilizatori</h2>
        {isLoading && <p className="text-sm text-zinc-500">Se încarcă…</p>}
        <ul className="mt-3 max-h-[560px] space-y-2 overflow-y-auto text-sm">
          {data?.map((u) => (
            <li
              key={u.id}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-medium">{u.username}</span>
                  <span className="ml-2 text-zinc-500">
                    {u.role === "organizer"
                      ? apiRoleLabel("contest_organizer")
                      : u.role === "admin"
                        ? apiRoleLabel("admin")
                        : apiRoleLabel("user")}
                    {u.isStaff ? " · staff" : ""}
                  </span>
                  {u.email && (
                    <p className="text-xs text-zinc-500">{u.email}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(u);
                      setEditPassword("");
                    }}
                    className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600"
                  >
                    Editează
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `Ștergi utilizatorul „${u.username}”? Operația poate eșua dacă are dependențe.`,
                        )
                      )
                        delMut.mutate(u.id);
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
            <h3 className="font-semibold">Editare {editing.username}</h3>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              Parola: lasă gol ca să nu o schimbi.
            </p>
            <label className="mt-2 block text-sm">
              Email
              <input
                className={inputClass}
                value={editing.email ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, email: e.target.value })
                }
              />
            </label>
            <label className="mt-2 block text-sm">
              Rol (API)
              <select
                className={inputClass}
                value={uiRoleToApi(editing.role)}
                onChange={(e) => {
                  const v = e.target.value as ApiRole;
                  setEditing({
                    ...editing,
                    role:
                      v === "contest_organizer"
                        ? "organizer"
                        : v === "admin"
                          ? "admin"
                          : "user",
                  });
                }}
              >
                <option value="user">{apiRoleLabel("user")}</option>
                <option value="contest_organizer">
                  {apiRoleLabel("contest_organizer")}
                </option>
                <option value="admin">{apiRoleLabel("admin")}</option>
              </select>
            </label>
            <label className="mt-2 block text-sm">
              Parolă nouă
              <input
                type="password"
                autoComplete="new-password"
                className={inputClass}
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
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
                onClick={() => {
                  setEditing(null);
                  setEditPassword("");
                }}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
              >
                Anulează
              </button>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold">Utilizator nou</h2>
          <form
            className="mt-3 space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
            onSubmit={(e) => {
              e.preventDefault();
              createMut.mutate();
            }}
          >
            <label className="block text-sm">
              Nume utilizator
              <input
                className={inputClass}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </label>
            <label className="block text-sm">
              Parolă
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <label className="block text-sm">
              Email
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Prenume
              <input
                className={inputClass}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Nume
              <input
                className={inputClass}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Rol
              <select
                className={inputClass}
                value={role}
                onChange={(e) => setRole(e.target.value as ApiRole)}
              >
                <option value="user">{apiRoleLabel("user")}</option>
                <option value="contest_organizer">
                  {apiRoleLabel("contest_organizer")}
                </option>
                <option value="admin">{apiRoleLabel("admin")}</option>
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
              Creează
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
