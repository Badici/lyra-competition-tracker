"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { fetchCompetitions } from "@/lib/api/resources";
import { queryKeys } from "@/lib/queryKeys";
import { Skeleton } from "@/components/ui/Skeleton";

function typeLabel(t: string): string {
  switch (t) {
    case "quantity":
      return "Cantitate";
    case "quality":
      return "Calitate";
    case "combined":
      return "Combinat";
    default:
      return t;
  }
}

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.competitions,
    queryFn: fetchCompetitions,
  });

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-3 py-6 sm:px-4">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Concursuri
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Selectează un concurs pentru clasament live.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="self-start rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Reîmprospătează
        </button>
      </header>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          Nu s-au putut încărca concursurile. Verifică API-ul Django și
          variabilele de mediu ({String(error)}).
        </div>
      )}

      {!isLoading && data && !data.length && (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
          Nu există concursuri. Creează unul din zona de administrare.
        </p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {data?.map((c) => (
          <li key={c.id}>
            <Link
              href={`/competition/${c.id}/leaderboard`}
              className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-emerald-800"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {c.name}
                </h2>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.isActive
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {c.isActive ? "Activ" : "Închis"}
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {typeLabel(c.type)} · {c.startDate} → {c.endDate}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
