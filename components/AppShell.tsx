"use client";

import Link from "next/link";
import { Moon, Sun } from "@/components/icons";
import { useTheme } from "@/hooks/useTheme";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.16),transparent_36%),linear-gradient(135deg,#f8fafc,#eef2f7_42%,#f8fafc)] px-4 py-5 transition-colors dark:bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_34%),linear-gradient(135deg,#020617,#111827_52%,#020617)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="group">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-300">Pagamento quinzenal</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-950 dark:text-white sm:text-4xl">Quinzena Calculator</h1>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/history"
              className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-teal-500 dark:hover:text-teal-200"
            >
              Histórico
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-teal-500"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
