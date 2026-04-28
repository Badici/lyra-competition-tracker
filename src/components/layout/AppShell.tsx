"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { isPrivilegedUser } from "@/lib/auth/rbac";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, hydrated } = useAuth();
  const canManage = hydrated && isPrivilegedUser(user);
  const inCompetition = pathname?.startsWith("/competition/");
  const inAdmin = pathname?.startsWith("/admin");

  const primaryNav = [
    { href: "/dashboard", label: "Acasă" },
    ...(canManage ? [{ href: "/admin/contests", label: "Organizare" }] : []),
    ...(inCompetition
      ? [{ href: pathname ?? "/dashboard", label: "Concurs curent" }]
      : []),
  ];

  if (pathname?.startsWith("/login")) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-6 py-3 md:px-10">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-emerald-900 dark:text-emerald-400"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700 text-xs font-bold text-white">
              LY
            </span>
            Lyra Competition Tracker
          </Link>
          <nav
            className="flex flex-wrap items-center justify-end gap-2 text-sm"
            aria-label="Navigație principală"
          >
            {primaryNav.map((item) => {
              const active =
                pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2 font-medium transition ${
                    active
                      ? "bg-emerald-700 text-white"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {!user && hydrated && (
              <Link
                href="/login"
                className="rounded-xl bg-emerald-700 px-3 py-2 font-semibold text-white transition hover:bg-emerald-800"
              >
                Conectare
              </Link>
            )}
            <ThemeToggle />
            {user && (
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-xl border border-zinc-300 px-3 py-2 font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Ieșire
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="flex flex-1 flex-col">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex flex-1 flex-col"
        >
          {children}
        </motion.div>
      </main>
      {!inAdmin && (
        <footer className="border-t border-zinc-200 bg-white/70 py-6 dark:border-zinc-800 dark:bg-zinc-950/70">
          <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-2 px-6 text-sm text-zinc-600 md:px-10 dark:text-zinc-400">
            <p>Lyra - platforma simplă pentru concursuri de pescuit.</p>
            <p>Roluri suportate: organizator, arbitru, participant.</p>
          </div>
        </footer>
      )}
    </div>
  );
}
