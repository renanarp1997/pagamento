"use client";

import { STATUS_LABELS } from "@/lib/constants";
import { formatLongDate, getWeekdayIndex, isToday, WEEKDAY_ABBR } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { calculateDayValue } from "@/lib/payments";
import type { DayConfiguration, DayStatus, PaymentRates } from "@/types/payment";

type Props = {
  day: number;
  month: number;
  year: number;
  status: DayStatus;
  rates: PaymentRates;
  configuration?: DayConfiguration;
  holidayName?: string;
  onClick: () => void;
  onConfigure: (button: HTMLButtonElement) => void;
};

const normalStyles: Record<DayStatus, string> = {
  O: "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  V: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100",
  M: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
};

export function DayCard({ day, month, year, status, rates, configuration, holidayName, onClick, onConfigure }: Props) {
  const weekday = getWeekdayIndex(year, month, day);
  const isAbsence = configuration?.workStatus === "absence";
  const isHoliday = Boolean(holidayName || configuration?.holiday?.isHoliday);
  const value = calculateDayValue(status, configuration, rates);
  const label = isHoliday ? "Feriado" : isAbsence ? "Falta" : STATUS_LABELS[status];
  const style = isHoliday
    ? "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-400/25 dark:bg-violet-400/10 dark:text-violet-100"
    : isAbsence
      ? "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-400/25 dark:bg-rose-400/10 dark:text-rose-100"
      : normalStyles[status];
  const workedLabel = isHoliday
    ? configuration?.holiday?.workedStatus === "full" ? "Inteiro" : configuration?.holiday?.workedStatus === "half" ? "Meio" : "Não trabalhou"
    : label;
  const modified = configuration?.valueOverride && configuration.valueOverride.type !== "default";

  return (
    <article className={`day-card-pop group relative min-h-16 min-w-0 overflow-hidden rounded-xl border shadow-md transition hover:z-10 hover:-translate-y-1 hover:shadow-xl min-[380px]:aspect-[0.9] min-[380px]:rounded-2xl sm:aspect-[1.05] sm:min-h-24 ${style} ${isToday(year, month, day) ? "ring-4 ring-teal-400/35 ring-offset-2" : ""}`}>
      <button type="button" onClick={onClick} aria-label={`Dia ${day}: ${label}. Valor ${formatCurrency(value)}`} title={`${formatLongDate(year, month, day)}\n${label}\n${formatCurrency(value)}`} className="flex h-full min-h-16 w-full flex-col items-center justify-center px-0.5 py-1.5 outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-teal-500/30 sm:min-h-24 sm:p-2">
        <span className="text-[9px] font-black uppercase tracking-[0.1em] opacity-70 sm:text-xs">{WEEKDAY_ABBR[weekday]}</span>
        <span className="mt-0.5 text-xl font-black leading-none sm:text-3xl">{day}</span>
        <span className="mt-1 max-w-full truncate rounded-full bg-black/5 px-1.5 py-0.5 text-[7px] font-black uppercase ring-1 ring-black/5 min-[380px]:text-[8px] sm:mt-2 sm:px-2 sm:text-[10px]">{workedLabel}</span>
        {holidayName ? <span className="mt-1 hidden max-w-full truncate px-1 text-[8px] font-bold opacity-75 sm:block">{holidayName}</span> : null}
        <span className="mt-1 hidden text-[10px] font-black sm:block">{formatCurrency(value)}</span>
        <span className="mt-1 flex items-center gap-1 text-[8px] font-black uppercase">
          {modified ? <span aria-label="Valor alterado" title="Valor alterado">✎</span> : null}
          {configuration?.absence?.reason ? <span aria-label="Motivo registrado" title="Motivo registrado">●</span> : null}
        </span>
      </button>
      <button type="button" aria-label={`Configurar dia ${day}`} title="Configurar dia" onClick={(event) => { event.stopPropagation(); onConfigure(event.currentTarget); }} className="absolute right-0.5 top-0.5 grid h-7 w-7 place-items-center rounded-lg bg-white/75 text-sm font-black shadow-sm outline-none hover:bg-white focus-visible:ring-4 focus-visible:ring-teal-500/30 dark:bg-slate-950/70 sm:right-1 sm:top-1">⋮</button>
    </article>
  );
}
