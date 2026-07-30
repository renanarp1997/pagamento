"use client";

import Link from "next/link";
import Image from "next/image";
import { Moon, Sun } from "@/components/icons";
import { useTheme } from "@/hooks/useTheme";
import logo from "@/logo.png";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="min-h-screen bg-[#f7f8fa] bg-[radial-gradient(circle_at_8%_0%,rgba(20,184,166,0.10),transparent_28%),radial-gradient(circle_at_92%_14%,rgba(59,130,246,0.06),transparent_24%)] px-3 py-4 transition-colors dark:bg-[#070b14] dark:bg-[radial-gradient(circle_at_8%_0%,rgba(45,212,191,0.10),transparent_26%),radial-gradient(circle_at_92%_14%,rgba(59,130,246,0.08),transparent_22%)] sm:px-6 sm:py-5 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6">
        <header className="flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-2">
          <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label="Abrir página inicial e configuração de pagamento">
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-slate-950 shadow-lg shadow-slate-900/15 transition duration-200 group-hover:scale-105 sm:h-12 sm:w-12">
              <Image src={logo} alt="" fill sizes="48px" className="scale-[1.55] object-cover" priority />
            </span>
            <span className="min-w-0">
              <h1 className="text-lg font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-2xl">One Blond</h1>
              <p className="mt-1 hidden text-sm font-medium text-slate-500 dark:text-slate-400 min-[380px]:block">Controle sua remuneração em tempo real.</p>
            </span>
          </Link>
          <nav aria-label="Navegação principal" className="grid w-full grid-cols-4 gap-2 sm:flex sm:w-auto sm:justify-end">
            <Link
              href="/settings"
              aria-label="Configurações"
              title="Configurações"
              className="inline-flex h-11 min-w-0 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white/80 px-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 sm:w-11 sm:px-0 sm:text-lg"
            >
              <span aria-hidden="true">⚙️</span><span className="sm:sr-only">Ajustes</span>
            </Link>
            <Link
              href="/history"
              className="inline-flex h-11 min-w-0 items-center justify-center rounded-xl border border-slate-200 bg-white/80 px-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-teal-500 dark:hover:text-teal-200 sm:px-4 sm:text-sm"
            >
              Histórico
            </Link>
            <Link href="/annual" className="inline-flex h-11 min-w-0 items-center justify-center rounded-xl border border-slate-200 bg-white/80 px-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-teal-300 hover:text-teal-700 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 sm:px-4 sm:text-sm">Anual</Link>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Alternar tema"
              className="grid h-11 min-w-0 place-items-center rounded-xl border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-teal-500 sm:w-11"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
