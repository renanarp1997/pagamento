"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { HistoryCard } from "@/components/HistoryCard";
import { useSavedMonths } from "@/hooks/useSavedMonths";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";

export default function HistoryPage() {
  const months = useSavedMonths();
  const { rates } = usePaymentSettings();
  const [search, setSearch] = useState("");
  const filteredMonths = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return months;
    return months.filter((month) =>
      new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" })
        .format(new Date(month.year, month.month - 1))
        .toLocaleLowerCase("pt-BR")
        .includes(term)
    );
  }, [months, search]);

  return (
    <AppShell>
      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900/90">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">Meses salvos</p>
            <h2 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">Histórico financeiro</h2>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">Consulte e compare seus pagamentos anteriores.</p>
          </div>
          <Link href="/" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-teal-700 dark:bg-white dark:text-slate-950 dark:hover:bg-teal-200">Voltar à calculadora</Link>
        </div>

        {months.length > 0 ? (
          <label className="relative block">
            <span className="sr-only">Buscar no histórico</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por mês ou ano..." className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-800 dark:bg-slate-900" />
          </label>
        ) : null}

        {filteredMonths.length > 0 ? (
          <div className="grid gap-4">
            {filteredMonths.map((month) => <HistoryCard key={month.key} month={month} rates={rates} />)}
          </div>
        ) : months.length > 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-lg font-black">Nenhum resultado encontrado</p>
            <p className="mt-2 text-sm text-slate-500">Tente buscar por outro mês ou ano.</p>
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
