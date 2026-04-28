"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompetitionWebSocket } from "@/hooks/useCompetitionWebSocket";

const tabs = [
  { href: (id: string) => `/competition/${id}/leaderboard`, label: "Clasament" },
  { href: (id: string) => `/competition/${id}/sectors`, label: "Sectoare" },
  { href: (id: string) => `/competition/${id}/teams`, label: "Echipe" },
  { href: (id: string) => `/competition/${id}/weigh-ins`, label: "Cântăriri" },
  { href: (id: string) => `/competition/${id}/braila`, label: "Braila" },
] as const;

export function CompetitionSection({
  competitionId,
  children,
}: {
  competitionId: string;
  children: React.ReactNode;
}) {
  useCompetitionWebSocket(competitionId);
  const pathname = usePathname();

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-6 pb-24 pt-6 md:px-10 md:pb-10">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Navigare concurs
        </p>
        <nav
          className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin sm:flex-wrap"
          aria-label="Secțiuni concurs"
        >
          {tabs.map((t) => {
            const href = t.href(competitionId);
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={t.label}
                href={href}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-emerald-700 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </section>
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-1 flex-col"
      >
        {children}
      </motion.section>
    </div>
  );
}
