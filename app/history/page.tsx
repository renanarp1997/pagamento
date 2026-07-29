"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { HistoryCard } from "@/components/HistoryCard";
import { useSavedMonths } from "@/hooks/useSavedMonths";

export default function HistoryPage() {
  const months = useSavedMonths();

  return (
    <AppShell>
      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/90">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Meses salvos</p>
            <h2 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">Histórico</h2>
          </div>
          <Link
            href="/"
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-teal-700 dark:bg-white dark:text-slate-950 dark:hover:bg-teal-200"
          >
            Calculadora
          </Link>
        </div>

        {months.length > 0 ? (
          <div className="grid gap-4">
            {months.map((month) => (
              <HistoryCard key={month.key} month={month} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center shadow-lg shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-xl font-black text-slate-950 dark:text-white">Nenhum mês salvo ainda</p>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">A calculadora salva automaticamente depois que você marca os dias.</p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
