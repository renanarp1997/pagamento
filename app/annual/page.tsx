"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { useSavedMonths } from "@/hooks/useSavedMonths";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";
import { buildAnnualSummary } from "@/lib/annual-summary";
import { MONTHS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { summarizeMonth } from "@/lib/payments";
import { usePaymentHistory } from "@/hooks/usePaymentHistory";

export default function AnnualPage() {
  const saved = useSavedMonths();
  const { rates } = usePaymentSettings();
  const { entries } = usePaymentHistory();
  const years = [...new Set(saved.map((item) => item.year))].sort((a, b) => b - a);
  const [year, setYear] = useState(years[0] ?? new Date().getFullYear());
  const summary = useMemo(() => {
    const historical = new Map<number, (typeof entries)[number]>();
    entries.filter((entry) => entry.year === year && entry.summary).forEach((entry) => {
      if (!historical.has(entry.month)) historical.set(entry.month, entry);
    });
    return buildAnnualSummary(saved.filter((item) => item.year === year).map((item) => {
    const snapshot = historical.get(item.month)?.summary;
    if (snapshot) return { month: item.month, ...snapshot };
    const calculated = summarizeMonth(item.data, rates, item.year, item.month);
    const configurations = Object.values(item.data.daySettings);
    return {
      month: item.month,
      total: calculated.monthlyTotal,
      workedDays: calculated.first.workedDays + calculated.second.workedDays,
      absences: configurations.filter((configuration) => configuration.workStatus === "absence").length,
      holidays: configurations.filter((configuration) => configuration.holiday?.isHoliday).length
    };
  }));
  }, [entries, rates, saved, year]);
  const maximum = Math.max(1, ...summary.months.map((month) => month.total));

  return (
    <AppShell>
      <section className="flex flex-col gap-5">
        <header className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/95 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">Histórico consolidado</p><h2 className="mt-1 text-3xl font-black">Resumo anual</h2></div>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
              <select aria-label="Ano do resumo" value={year} onChange={(event) => setYear(Number(event.target.value))} className="h-12 min-w-0 rounded-xl border border-slate-200 bg-white px-3 font-black dark:border-slate-700 dark:bg-slate-950 sm:px-4">{(years.length ? years : [year]).map((item) => <option key={item}>{item}</option>)}</select>
              <Link href="/" className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-950 px-4 font-black text-white dark:bg-white dark:text-slate-950">Voltar</Link>
            </div>
          </div>
        </header>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Total anual" value={formatCurrency(summary.total)} />
          <Metric label="Média mensal" value={formatCurrency(summary.average)} />
          <Metric label="Dias trabalhados" value={String(summary.workedDays)} />
          <Metric label="Faltas / feriados" value={`${summary.absences} / ${summary.holidays}`} />
        </div>
        <section className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/95 sm:p-7">
          <div className="-mx-2 overflow-x-auto px-2 pb-2">
          <div className="grid h-64 min-w-[640px] grid-cols-12 items-end gap-2" role="img" aria-label={`Gráfico de pagamentos de ${year}`}>
            {Array.from({ length: 12 }, (_, index) => {
              const item = summary.months.find((month) => month.month === index + 1);
              const height = item ? Math.max(3, item.total / maximum * 100) : 2;
              return <div key={index} className="flex h-full min-w-0 flex-col justify-end text-center"><span className="mb-2 hidden text-[10px] font-bold sm:block">{item ? formatCurrency(item.total) : "—"}</span><div className="rounded-t-lg bg-gradient-to-t from-teal-700 to-emerald-400" style={{ height: `${height}%` }} /><span className="mt-2 text-[10px] font-black">{MONTHS[index].slice(0, 3)}</span></div>;
            })}
          </div></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <p className="rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200">Maior mês: {summary.highest ? `${MONTHS[summary.highest.month - 1]} · ${formatCurrency(summary.highest.total)}` : "—"}</p>
            <p className="rounded-2xl bg-slate-100 p-4 font-bold dark:bg-slate-950">Menor mês: {summary.lowest ? `${MONTHS[summary.lowest.month - 1]} · ${formatCurrency(summary.lowest.total)}` : "—"}</p>
          </div>
        </section>
      </section>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-soft dark:border-slate-800 dark:bg-slate-900/95"><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}
