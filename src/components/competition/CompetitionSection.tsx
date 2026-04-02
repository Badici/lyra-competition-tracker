"use client";

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
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-3 pb-24 pt-4 sm:px-4 sm:pb-8">
      <nav
        className="-mx-1 flex gap-1 overflow-x-auto pb-1 scrollbar-thin sm:flex-wrap"
        aria-label="Secțiuni concurs"
      >
        {tabs.map((t) => {
          const href = t.href(competitionId);
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={t.label}
              href={href}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-emerald-800 text-white shadow"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
