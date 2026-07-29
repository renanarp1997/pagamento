"use client";

import { STATUS_LABELS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { formatLongDate, getWeekdayIndex, isToday, WEEKDAY_ABBR } from "@/lib/date";
import type { DayStatus, PaymentRates } from "@/types/payment";

type DayCardProps = {
  day: number;
  month: number;
  year: number;
  status: DayStatus;
  rates: PaymentRates;
  onClick: () => void;
};

const statusStyles: Record<DayStatus, string> = {
  O: "border-slate-200 bg-white text-slate-700 shadow-slate-900/5 hover:border-slate-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  V: "border-emerald-200 bg-emerald-50 text-emerald-950 shadow-emerald-900/10 hover:border-emerald-300 hover:shadow-xl dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100",
  M: "border-amber-200 bg-amber-50 text-amber-950 shadow-amber-900/10 hover:border-amber-300 hover:shadow-xl dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
};

const statusDisplay: Record<DayStatus, string> = {
  O: "Folga",
  V: "Inteiro",
  M: "Meio"
};

const dotStyles: Record<DayStatus, string> = {
  O: "bg-slate-200 ring-slate-300 dark:bg-slate-600 dark:ring-slate-500",
  V: "bg-emerald-500 ring-emerald-300",
  M: "bg-amber-300 ring-amber-400"
};

export function DayCard({ day, month, year, status, rates, onClick }: DayCardProps) {
  const statusValue: Record<DayStatus, number> = { O: 0, V: rates.fullDay, M: rates.halfDay };
  const weekday = getWeekdayIndex(year, month, day);
  const weekendStyle = status === "O" && weekday === 0
    ? "bg-rose-50 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/60"
    : status === "O" && weekday === 6
      ? "bg-orange-50 border-orange-100 dark:bg-orange-950/30 dark:border-orange-900/60"
      : "";
  const todayStyle = isToday(year, month, day) ? "ring-4 ring-teal-400/35 ring-offset-2 ring-offset-slate-50 dark:ring-teal-300/35 dark:ring-offset-slate-950" : "";
  const tooltip = `${formatLongDate(year, month, day)}\nStatus: ${STATUS_LABELS[status]}\nValor: ${formatCurrency(statusValue[status])}`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Dia ${day}: ${STATUS_LABELS[status]}`}
      title={tooltip}
      className={`day-card-pop group relative flex aspect-[0.9] min-h-16 flex-col items-center justify-center rounded-2xl border p-1.5 shadow-md transition duration-150 hover:z-10 hover:scale-[1.02] hover:-translate-y-1 active:scale-95 sm:aspect-[1.05] sm:min-h-24 sm:p-3 ${statusStyles[status]} ${weekendStyle} ${todayStyle}`}
    >
      <span className="text-[10px] font-black uppercase tracking-[0.12em] opacity-70 sm:text-xs">{WEEKDAY_ABBR[weekday]}</span>
      <span className="mt-0.5 text-xl font-black leading-none sm:text-3xl">{day}</span>
      <span className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-black/5 px-1.5 py-0.5 text-[8px] font-black uppercase ring-1 ring-black/5 transition group-hover:scale-105 dark:bg-white/10 dark:ring-white/10 sm:mt-2 sm:px-2.5 sm:py-1 sm:text-[11px]">
        <span className={`h-2 w-2 shrink-0 rounded-full ring-1 ${dotStyles[status]}`} />
        <span className="truncate">{statusDisplay[status]}</span>
      </span>
      <span className="mt-1 hidden text-[10px] font-black opacity-70 sm:block">{formatCurrency(statusValue[status])}</span>
      {weekday === 5 ? (
        <span className="absolute right-1 top-1 rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-black text-sky-700 ring-1 ring-sky-200 dark:bg-sky-400/15 dark:text-sky-200 dark:ring-sky-400/20">
          SEX
        </span>
      ) : null}
    </button>
  );
}
