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
    <main className="min-h-screen bg-[#f7f8fa] bg-[radial-gradient(circle_at_8%_0%,rgba(20,184,166,0.10),transparent_28%),radial-gradient(circle_at_92%_14%,rgba(59,130,246,0.06),transparent_24%)] px-4 py-5 transition-colors dark:bg-[#070b14] dark:bg-[radial-gradient(circle_at_8%_0%,rgba(45,212,191,0.10),transparent_26%),radial-gradient(circle_at_92%_14%,rgba(59,130,246,0.08),transparent_22%)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 py-2">
          <Link href="/" className="group flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-xl shadow-lg shadow-slate-900/15 transition duration-200 group-hover:scale-105 dark:bg-white">💰</span>
            <span>
              <h1 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">Calculadora de Pagamento Quinzenal</h1>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">Controle sua remuneração em tempo real.</p>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              aria-label="Configurações"
              title="Configurações"
              className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white/80 text-lg text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200"
            >
              ⚙️
            </Link>
            <Link
              href="/history"
              className="rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-teal-500 dark:hover:text-teal-200"
            >
              Histórico
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Alternar tema"
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
