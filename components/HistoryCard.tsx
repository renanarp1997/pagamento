"use client";

import { useState } from "react";
import { formatMonthYear } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { summarizeMonth } from "@/lib/payments";
import type { SavedMonth } from "@/types/payment";

type HistoryCardProps = {
  month: SavedMonth;
};

export function HistoryCard({ month }: HistoryCardProps) {
  const [open, setOpen] = useState(false);
  const summary = summarizeMonth(month.data);

  return (
    <article className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900/90">
      <button type="button" onClick={() => setOpen((current) => !current)} className="w-full text-left">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">{formatMonthYear(month.year, month.month)}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{month.key}</p>
          </div>
          <p className="rounded-2xl bg-teal-50 px-4 py-2 text-xl font-black text-teal-700 dark:bg-teal-400/10 dark:text-teal-200">{formatCurrency(summary.monthlyTotal)}</p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <HistoryMetric label="Primeira quinzena" value={formatCurrency(summary.first.total)} />
          <HistoryMetric label="Segunda quinzena" value={formatCurrency(summary.second.total)} />
          <HistoryMetric label="Total mensal" value={formatCurrency(summary.monthlyTotal)} />
        </div>
      </button>

      {open ? (
        <div className="mt-5 grid gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:grid-cols-2">
          <Detail title="Primeira quinzena" full={summary.first.fullDays} half={summary.first.halfDays} off={summary.first.daysOff} />
          <Detail title="Segunda quinzena" full={summary.second.fullDays} half={summary.second.halfDays} off={summary.second.daysOff} />
        </div>
      ) : null}
    </article>
  );
}

function HistoryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/70">
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function Detail({ title, full, half, off }: { title: string; full: number; half: number; off: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/70">
      <p className="font-black text-slate-950 dark:text-white">{title}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm font-bold">
        <span className="rounded-xl bg-emerald-50 px-2 py-2 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">V: {full}</span>
        <span className="rounded-xl bg-amber-50 px-2 py-2 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200">M: {half}</span>
        <span className="rounded-xl bg-slate-100 px-2 py-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">Folga: {off}</span>
      </div>
    </div>
  );
}
