"use client";

import { WEEKDAY_NAMES } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import type { PaymentRates, PeriodSummary } from "@/types/payment";

type SummaryCardProps = {
  summary: PeriodSummary;
  rates: PaymentRates;
  weeklyCounts?: number[];
  className?: string;
};

export function SummaryCard({ summary, rates, weeklyCounts = [0, 0, 0, 0, 0, 0, 0], className = "" }: SummaryCardProps) {
  return (
    <aside className={`rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Resumo da quinzena</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{formatCurrency(summary.total)}</p>
        </div>
        <div className="rounded-2xl bg-teal-50 px-3 py-2 text-right text-sm font-bold text-teal-700 dark:bg-teal-400/10 dark:text-teal-200">{summary.workedPercentage}%</div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Metric icon="📅" label="Dias" value={`${summary.workedDays}/${summary.totalDays}`} tone="slate" />
        <Metric icon="📈" label="Aproveitamento" value={`${summary.workedPercentage}%`} tone="emerald" />
        <Metric icon="💵" label="Média/dia" value={formatCurrency(summary.averagePerWorkedDay)} tone="amber" />
      </div>

      <div className="mt-5 space-y-3">
        <PaymentBar label="Dias inteiros" count={summary.fullDays} max={summary.totalDays} detail={`${summary.fullDays} × ${formatCurrency(rates.fullDay)}`} total={formatCurrency(summary.fullTotal)} tone="emerald" />
        <PaymentBar label="Meios períodos" count={summary.halfDays} max={summary.totalDays} detail={`${summary.halfDays} × ${formatCurrency(rates.halfDay)}`} total={formatCurrency(summary.halfTotal)} tone="amber" />
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/70">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Progresso</p>
            <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">{summary.workedDays} de {summary.totalDays} dias</p>
          </div>
          <p className="text-xl font-black text-teal-700 dark:text-teal-300">{summary.workedPercentage}%</p>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-700 ease-out" style={{ width: `${summary.workedPercentage}%` }} />
        </div>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-800">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Dias trabalhados por semana</p>
        <div className="mt-3 space-y-2">
          {weeklyCounts.map((count, index) => (
            <div key={WEEKDAY_NAMES[index]} className="flex items-center justify-between gap-3 text-sm font-semibold">
              <span className="text-slate-500 dark:text-slate-400">{WEEKDAY_NAMES[index].replace("-feira", "")}</span>
              <span className="text-slate-950 dark:text-white">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function Metric({ icon, label, value, tone }: { icon: string; label: string; value: string; tone: "emerald" | "amber" | "slate" }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
  };
  return (
    <div className={`min-w-0 rounded-2xl p-3 ${tones[tone]}`}>
      <p className="text-base">{icon}</p>
      <p className="mt-2 truncate text-[9px] font-bold uppercase tracking-wide">{label}</p>
      <p className="mt-1 truncate text-base font-black">{value}</p>
    </div>
  );
}

function PaymentBar({ label, count, max, detail, total, tone }: { label: string; count: number; max: number; detail: string; total: string; tone: "emerald" | "amber" }) {
  const bar = tone === "emerald" ? "bg-emerald-500" : "bg-amber-400";
  return (
    <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm font-black text-slate-950 dark:text-white">{label}</p><p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{detail}</p></div>
        <div className="text-right"><p className="font-black text-slate-950 dark:text-white">{total}</p><p className="text-xs font-semibold text-slate-500">{count} dias</p></div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full transition-all duration-700 ${bar}`} style={{ width: `${max === 0 ? 0 : (count / max) * 100}%` }} />
      </div>
    </div>
  );
}
