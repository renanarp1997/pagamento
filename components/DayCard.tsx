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
  selectionMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
};

const normalStyles: Record<DayStatus, string> = {
  O: "border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  V: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100",
  M: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
};

export function DayCard({ day, month, year, status, rates, configuration, holidayName, onClick, onConfigure, selectionMode = false, selected = false, onSelect }: Props) {
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
  const statusIcon = isHoliday ? "★" : isAbsence ? "!" : status === "V" ? "✓" : status === "M" ? "½" : "—";

  return (
    <article className={`day-card-pop group relative h-[116px] min-w-0 rounded-2xl border shadow-md transition hover:z-10 hover:-translate-y-1 hover:shadow-xl sm:h-[118px] ${style} ${selected ? "ring-4 ring-cyan-400 ring-offset-2 dark:ring-cyan-300" : isToday(year, month, day) ? "ring-2 ring-teal-300 ring-offset-2 ring-offset-white dark:ring-teal-400 dark:ring-offset-slate-950" : ""}`}>
      <button type="button" onClick={selectionMode ? onSelect : onClick} aria-pressed={selectionMode ? selected : undefined} aria-label={selectionMode ? `${selected ? "Remover" : "Adicionar"} dia ${day} da seleção` : `Dia ${day}: ${label}. Valor ${formatCurrency(value)}`} title={`${formatLongDate(year, month, day)}\n${label}\n${formatCurrency(value)}`} className="grid h-full w-full grid-rows-[auto_1fr_auto] overflow-hidden rounded-[inherit] px-1.5 py-1.5 text-center outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-teal-500/30 min-[380px]:px-2 sm:px-2.5 sm:py-2">
        <span className="pr-5 text-[11px] font-black uppercase leading-none tracking-[0.08em] opacity-75">{WEEKDAY_ABBR[weekday]}</span>
        <span className="self-center text-[32px] font-black leading-none">{day}</span>
        <span className="min-w-0">
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-[9px] font-black uppercase leading-tight"><span aria-hidden="true">{statusIcon} </span>{workedLabel}</span>
          <span className="mt-0.5 block whitespace-nowrap text-[11px] font-black leading-none">{formatCurrency(value)}</span>
          <span className="mt-0.5 flex min-h-2 items-center justify-center gap-1 text-[8px] font-black leading-none">
            {modified ? <span aria-label="Valor alterado" title="Valor alterado">✎</span> : null}
            {configuration?.absence?.reason ? <span aria-label="Motivo registrado" title="Motivo registrado">●</span> : null}
            {configuration?.observation ? <span aria-label="Observação registrada" title={configuration.observation}>◆</span> : null}
          </span>
        </span>
      </button>
      {selectionMode ? <span aria-hidden="true" className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-lg bg-cyan-500 text-xs font-black text-white">{selected ? "✓" : "+"}</span> : <button type="button" aria-label={`Configurar dia ${day}`} title="Configurar dia" onClick={(event) => { event.stopPropagation(); onConfigure(event.currentTarget); }} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-lg bg-white/85 text-xs font-black shadow-sm outline-none hover:bg-white focus-visible:ring-4 focus-visible:ring-teal-500/30 dark:bg-slate-950/80 sm:h-7 sm:w-7 sm:text-sm">⋮</button>}
    </article>
  );
}
