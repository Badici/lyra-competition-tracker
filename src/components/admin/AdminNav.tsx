"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections: { title: string; links: { href: string; label: string }[] }[] =
  [
    {
      title: "Date generale",
      links: [
        { href: "/admin/lakes", label: "Lacuri" },
        { href: "/admin/lake-stands", label: "Standuri pe lac" },
        { href: "/admin/regulations", label: "Regulamente" },
        { href: "/admin/lake-regulations", label: "Regulamente lac" },
        { href: "/admin/users", label: "Utilizatori" },
      ],
    },
    {
      title: "Concurs",
      links: [
        { href: "/admin/contests", label: "Concursuri" },
        { href: "/admin/sectors", label: "Sectoare" },
        { href: "/admin/teams", label: "Echipe" },
        { href: "/admin/stands", label: "Repartizare standuri" },
        { href: "/admin/team-members", label: "Membri echipe" },
        { href: "/admin/captures", label: "Cântăriri" },
        { href: "/admin/results", label: "Rezultate" },
      ],
    },
    {
      title: "Sistem",
      links: [{ href: "/admin/settings", label: "Setări API" }],
    },
  ];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      {sections.map((sec) => (
        <div key={sec.title}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {sec.title}
          </p>
          <nav className="flex flex-wrap gap-2">
            {sec.links.map((l) => {
              const active =
                pathname === l.href || pathname?.startsWith(`${l.href}/`);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-emerald-800 text-white shadow"
                      : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );
}
