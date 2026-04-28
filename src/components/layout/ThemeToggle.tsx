"use client";

import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Schimbă tema vizuală"
      onClick={toggleTheme}
      className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
    >
      Mod lumină/întuneric
    </button>
  );
}
