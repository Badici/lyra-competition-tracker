"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { isPrivilegedUser } from "@/lib/auth/rbac";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, hydrated } = useAuth();
  const showAdminPortal = hydrated && isPrivilegedUser(user);

  const nav = [
    { href: "/dashboard", label: "Acasă" },
    ...(!user && hydrated
      ? [{ href: "/login", label: "Conectare" }]
      : []),
  ];

  if (pathname?.startsWith("/login")) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight text-emerald-900 dark:text-emerald-400">
            Lyra Fish
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-lg px-3 py-1.5 font-medium ${
                  pathname === n.href || pathname?.startsWith(n.href + "/")
                    ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {n.label}
              </Link>
            ))}
            {showAdminPortal && (
              <Link
                href="/admin/contests"
                className={`rounded-xl px-3 py-1.5 text-sm font-semibold shadow-sm transition ${
                  pathname?.startsWith("/admin")
                    ? "bg-emerald-900 text-white ring-2 ring-emerald-400/50 dark:bg-emerald-700"
                    : "bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                }`}
              >
                Portal admin
              </Link>
            )}
            {user && (
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-lg px-3 py-1.5 font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Ieșire
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
