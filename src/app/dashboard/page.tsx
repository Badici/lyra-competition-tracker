"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
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

  const activeCount = data?.filter((c) => c.isActive).length ?? 0;

  return (
    <div className="mx-auto w-full max-w-[1280px] flex-1 px-6 py-10 md:px-10 md:py-16">
      <section className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 py-8 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <header>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50">
              Urmărește concursul tău în timp real
            </h1>
            <p className="mt-2 max-w-3xl text-base text-zinc-600 dark:text-zinc-300">
              Alege competiția și intră direct în clasament, sectoare, echipe sau
              capturi. Interfața este gândită pentru utilizatori non-tehnici:
              pași simpli, informații clare.
            </p>
          </header>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Reîmprospătează
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Concursuri total</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {data?.length ?? 0}
            </p>
          </article>
          <article className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Active acum</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {activeCount}
            </p>
          </article>
          <article className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Finalizate</p>
            <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {(data?.length ?? 0) - activeCount}
            </p>
          </article>
        </div>
      </section>

      <section className="mt-8">
        <header className="mb-4">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Alege un concurs
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Click pe orice card pentru a deschide vizualizarea live.
          </p>
        </header>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-36 w-full rounded-2xl" />
            <Skeleton className="h-36 w-full rounded-2xl" />
            <Skeleton className="h-36 w-full rounded-2xl" />
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            Nu s-au putut încărca concursurile. Verifică API-ul Django și
            variabilele de mediu ({String(error)}).
          </div>
        )}

        {!isLoading && data && !data.length && (
          <p className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-12 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-400">
            Nu există concursuri. Creează primul concurs din zona de organizare.
          </p>
        )}

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((c, index) => (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: index * 0.04 }}
            >
              <Link
                href={`/competition/${c.id}/leaderboard`}
                className="group block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:scale-[1.03] hover:border-emerald-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-emerald-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {c.name}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      c.isActive
                        ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {c.isActive ? "Activ" : "Închis"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Tip: {typeLabel(c.type)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {c.startDate || "?"} → {c.endDate || "?"}
                </p>
                <p className="mt-4 text-sm font-semibold text-emerald-700 transition group-hover:text-emerald-800 dark:text-emerald-400 dark:group-hover:text-emerald-300">
                  Intră în concurs
                </p>
              </Link>
            </motion.li>
          ))}
        </ul>
      </section>
    </div>
  );
}
