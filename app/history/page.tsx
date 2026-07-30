"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { HistoryCard } from "@/components/HistoryCard";
import { useSavedMonths } from "@/hooks/useSavedMonths";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";
import { usePaymentHistory } from "@/hooks/usePaymentHistory";
import { MONTHS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { summarizeMonth } from "@/lib/payments";
import type { PaymentHistoryEntry } from "@/lib/payment-history";

export default function HistoryPage() {
  const months = useSavedMonths();
  const { rates } = usePaymentSettings();
  const { entries, restore } = usePaymentHistory();
  const [search, setSearch] = useState("");
  const [restoredId, setRestoredId] = useState<string | null>(null);
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
        <div className="flex flex-col items-stretch gap-4 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900/90 sm:rounded-[28px] sm:p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">Meses salvos</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">Histórico financeiro</h2>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">Consulte e compare seus pagamentos anteriores.</p>
          </div>
          <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-black text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-teal-700 dark:bg-white dark:text-slate-950 dark:hover:bg-teal-200">Voltar à calculadora</Link>
        </div>

        {entries.length > 0 ? (
          <section className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 shadow-soft dark:border-amber-900/60 dark:bg-amber-950/20 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">Proteção contra exclusões</p>
                <h3 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Alterações recentes</h3>
                <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  As versões anteriores ficam salvas neste navegador. Você pode restaurar qualquer uma delas.
                </p>
              </div>
              <span className="rounded-xl bg-white/80 px-3 py-2 text-xs font-black text-amber-800 dark:bg-slate-900/70 dark:text-amber-200">
                {entries.length} versão(ões) protegida(s)
              </span>
            </div>
            <div className="mt-5 grid gap-3">
              {entries.slice(0, 50).map((entry) => (
                <HistoryVersion
                  key={entry.id}
                  entry={entry}
                  rates={rates}
                  restored={restoredId === entry.id}
                  onRestore={() => {
                    restore(entry);
                    setRestoredId(entry.id);
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}

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

function HistoryVersion({
  entry,
  rates,
  restored,
  onRestore
}: {
  entry: PaymentHistoryEntry;
  rates: ReturnType<typeof usePaymentSettings>["rates"];
  restored: boolean;
  onRestore: () => void;
}) {
  const total = summarizeMonth(entry.before, rates, entry.year, entry.month).monthlyTotal;
  const date = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(entry.createdAt));

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-white p-4 dark:border-amber-900/50 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-black text-slate-950 dark:text-white">{entry.action}</p>
        <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
          {MONTHS[entry.month - 1]} de {entry.year} · {date} · Versão anterior: {formatCurrency(total)}
        </p>
      </div>
      <button
        type="button"
        onClick={onRestore}
        className="min-h-11 shrink-0 rounded-xl bg-amber-600 px-4 text-sm font-black text-white transition hover:bg-amber-700 disabled:cursor-default disabled:bg-emerald-600"
        disabled={restored}
      >
        {restored ? "Restaurado" : "Restaurar esta versão"}
      </button>
    </article>
  );
}
