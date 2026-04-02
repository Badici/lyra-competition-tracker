"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await axios.post(
        "/api/auth/login",
        { username, password },
        { withCredentials: true },
      );
      await qc.invalidateQueries({ queryKey: queryKeys.me });
      router.replace(next);
    } catch (err: unknown) {
      const data = axios.isAxiosError(err)
        ? (err.response?.data as { detail?: string; hint?: string; upstreamStatus?: number } | undefined)
        : undefined;
      const parts = [data?.detail ?? "Autentificare eșuată."];
      if (data?.upstreamStatus) parts.push(`(upstream: ${data.upstreamStatus})`);
      if (data?.hint) parts.push(`Detaliu: ${data.hint}`);
      setError(parts.join(" "));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Autentificare
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Introdu credențialele primite de la organizator. Token-ul este păstrat
          securizat (cookie HttpOnly).
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Utilizator
            <input
              autoComplete="username"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Parolă
            <input
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-800 disabled:opacity-50"
          >
            {pending ? "Se conectează…" : "Conectare"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link
            href="/dashboard"
            className="text-emerald-700 hover:underline dark:text-emerald-400"
          >
            Înapoi la concursuri
          </Link>
        </p>
      </div>
    </div>
  );
}
