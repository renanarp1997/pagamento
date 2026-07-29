"use client";

import { FULL_DAY_VALUE, HALF_DAY_VALUE } from "@/lib/constants";
import { WEEKDAY_NAMES } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import type { PeriodSummary } from "@/types/payment";

type SummaryCardProps = {
  summary: PeriodSummary;
  weeklyCounts?: number[];
  className?: string;
};

export function SummaryCard({ summary, weeklyCounts = [0, 0, 0, 0, 0, 0, 0], className = "" }: SummaryCardProps) {
  return (
    <aside className={`rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Resumo</p>
          <p className="mt-2 text-3xl font-black tracking-normal text-slate-950 dark:text-white">{formatCurrency(summary.total)}</p>
        </div>
        <div className="rounded-2xl bg-teal-50 px-3 py-2 text-right text-sm font-bold text-teal-700 dark:bg-teal-400/10 dark:text-teal-200">
          {summary.workedPercentage}%
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Metric label="Inteiros" value={summary.fullDays} tone="emerald" />
        <Metric label="Meios" value={summary.halfDays} tone="amber" />
        <Metric label="Folgas" value={summary.daysOff} tone="slate" />
      </div>

      <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/70">
        <Line label={`${summary.fullDays} x R$${FULL_DAY_VALUE}`} value={formatCurrency(summary.fullTotal)} />
        <Line label={`${summary.halfDays} x R$${HALF_DAY_VALUE}`} value={formatCurrency(summary.halfTotal)} />
        <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
          <Line label="TOTAL" value={formatCurrency(summary.total)} strong />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500" style={{ width: `${summary.workedPercentage}%` }} />
        </div>
        <div className="space-y-2 text-sm">
          <Line label="Dias trabalhados" value={`${summary.workedDays}/${summary.totalDays}`} />
          <Line label="Percentual" value={`${summary.workedPercentage}%`} />
          <Line label="Media/trabalhado" value={formatCurrency(summary.averagePerWorkedDay)} />
          <Line label="Media/calendario" value={formatCurrency(summary.averagePerCalendarDay)} />
        </div>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-800">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Dias trabalhados por semana</p>
        <div className="mt-3 space-y-2">
          {weeklyCounts.map((count, index) => (
            <Line key={WEEKDAY_NAMES[index]} label={WEEKDAY_NAMES[index].replace("-feira", "")} value={String(count)} />
          ))}
        </div>
      </div>
    </aside>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "emerald" | "amber" | "slate" }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
  };

  return (
    <div className={`rounded-2xl p-3 ${tones[tone]}`}>
      <p className="text-xs font-bold">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${strong ? "text-lg font-black" : "font-semibold"}`}>
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right text-slate-950 dark:text-white">{value}</span>
    </div>
  );
}
