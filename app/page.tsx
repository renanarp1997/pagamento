"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DayCard } from "@/components/DayCard";
import { DownloadIcon } from "@/components/icons";
import { ExportModal } from "@/components/ExportModal";
import { MonthSelector } from "@/components/MonthSelector";
import { PeriodSelector } from "@/components/PeriodSelector";
import { StatsChart } from "@/components/StatsChart";
import { SummaryCard } from "@/components/SummaryCard";
import { FULL_DAY_VALUE, HALF_DAY_VALUE } from "@/lib/constants";
import { getCalendarLeadingBlanks, getPeriodDays, getWeekdayIndex, WEEKDAY_ABBR, WEEKDAY_NAMES } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { summarizePeriod } from "@/lib/payments";
import { useMonthPayment } from "@/hooks/useMonthPayment";
import type { Period } from "@/types/payment";

export default function Home() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [period, setPeriod] = useState<Period>(today.getDate() <= 15 ? "first" : "second");
  const [exportOpen, setExportOpen] = useState(false);
  const { data, cycleDay, setDays, clearDays } = useMonthPayment(year, month);

  const days = useMemo(() => getPeriodDays(year, month, period), [year, month, period]);
  const periodData = data[period];
  const summary = useMemo(() => summarizePeriod(periodData, days.length), [periodData, days.length]);
  const leadingBlanks = useMemo(() => getCalendarLeadingBlanks(year, month, days[0] ?? 1), [days, month, year]);
  const weeklyCounts = useMemo(() => getWorkedByWeekday(year, month, periodData), [month, periodData, year]);

  function markWeekdayAsFull(weekday: number) {
    const matchingDays = days.filter((day) => getWeekdayIndex(year, month, day) === weekday);

    setDays(period, matchingDays, "V");
  }

  return (
    <AppShell>
      <section className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">Total da quinzena</p>
                <p className="mt-2 text-5xl font-black tracking-normal text-slate-950 dark:text-white sm:text-6xl">{formatCurrency(summary.total)}</p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-3 text-right text-sm font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {summary.workedDays}/{summary.totalDays} dias
              </div>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500" style={{ width: `${summary.workedPercentage}%` }} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            <div className="grid gap-4 xl:grid-cols-[1fr_1fr_auto] xl:items-end">
              <MonthSelector month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Period</p>
                <PeriodSelector period={period} onPeriodChange={setPeriod} />
              </div>
              <button
                type="button"
                onClick={() => setExportOpen(true)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-teal-700 dark:bg-white dark:text-slate-950 dark:hover:bg-teal-200"
              >
                <DownloadIcon className="h-5 w-5" />
                Exportar
              </button>
            </div>
            <div className="mt-4 grid gap-2 border-t border-slate-200 pt-4 text-sm font-bold text-slate-600 dark:border-slate-800 dark:text-slate-300 sm:grid-cols-3">
              <LegendItem color="bg-emerald-500" label="V - Dia inteiro" value="R$94" />
              <LegendItem color="bg-amber-300" label="M - Meio periodo" value="R$45" />
              <LegendItem color="bg-slate-200 dark:bg-slate-700" label="Folga" value="R$0" />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/80 p-3 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/80 sm:p-4">
            <div className="grid gap-2 border-b border-slate-200 pb-3 dark:border-slate-800 sm:grid-cols-4">
              <QuickAction label="Marcar sextas como Inteiro" onClick={() => markWeekdayAsFull(5)} />
              <QuickAction label="Marcar sábados como Inteiro" onClick={() => markWeekdayAsFull(6)} />
              <QuickAction label="Marcar domingos como Inteiro" onClick={() => markWeekdayAsFull(0)} />
              <QuickAction label="Limpar todos" onClick={() => clearDays(period)} muted />
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
              {WEEKDAY_ABBR.map((weekday) => (
                <div key={weekday} className="py-1 text-center text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 sm:text-xs">
                  {weekday}
                </div>
              ))}

              {Array.from({ length: leadingBlanks }, (_, index) => (
                <div key={`blank-${index}`} aria-hidden="true" className="aspect-[0.9] rounded-2xl sm:aspect-[1.05]" />
              ))}

              {days.map((day) => (
                <DayCard key={day} day={day} month={month} year={year} status={periodData[day] ?? "O"} onClick={() => cycleDay(period, day)} />
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/90 lg:hidden">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Calculo</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MobileMetric label="Inteiros" value={summary.fullDays} detail={`${summary.fullDays} x R$${FULL_DAY_VALUE}`} total={formatCurrency(summary.fullTotal)} />
              <MobileMetric label="Meios" value={summary.halfDays} detail={`${summary.halfDays} x R$${HALF_DAY_VALUE}`} total={formatCurrency(summary.halfTotal)} />
              <MobileMetric label="Folgas" value={summary.daysOff} detail="R$0" total={`${summary.workedPercentage}%`} />
            </div>
            <WeeklyWorkedCounts counts={weeklyCounts} className="mt-5" />
          </section>

          {summary.workedDays > 0 ? (
            <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/90">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Progresso</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{summary.workedPercentage}% dos dias marcados como trabalho</h2>
                </div>
                <p className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {summary.workedDays} de {summary.totalDays}
                </p>
              </div>
              <div className="mt-5">
                <StatsChart data={periodData} />
              </div>
            </section>
          ) : null}
        </div>

        <SummaryCard summary={summary} weeklyCounts={weeklyCounts} className="hidden lg:block lg:sticky lg:top-6" />
      </section>
      <ExportModal year={year} month={month} data={data} isOpen={exportOpen} onClose={() => setExportOpen(false)} />
    </AppShell>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-950/60">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-slate-950 dark:text-white">{value}</span>
    </div>
  );
}

function MobileMetric({ label, value, detail, total }: { label: string; value: number; detail: string; total: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-black text-slate-950 dark:text-white">{value}</p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-sm font-bold">
        <span className="text-slate-500 dark:text-slate-400">{detail}</span>
        <span className="text-slate-950 dark:text-white">{total}</span>
      </div>
    </div>
  );
}

function QuickAction({ label, onClick, muted = false }: { label: string; onClick: () => void; muted?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 rounded-2xl px-3 text-xs font-black transition hover:-translate-y-0.5 sm:text-sm ${
        muted
          ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          : "bg-teal-50 text-teal-800 ring-1 ring-teal-100 hover:bg-teal-100 dark:bg-teal-400/10 dark:text-teal-200 dark:ring-teal-400/15 dark:hover:bg-teal-400/15"
      }`}
    >
      {label}
    </button>
  );
}

function getWorkedByWeekday(year: number, month: number, periodData: Record<number, string>) {
  return Object.entries(periodData).reduce<number[]>((counts, [day, status]) => {
    if (status === "V" || status === "M") {
      counts[getWeekdayIndex(year, month, Number(day))] += 1;
    }

    return counts;
  }, [0, 0, 0, 0, 0, 0, 0]);
}

function WeeklyWorkedCounts({ counts, className = "" }: { counts: number[]; className?: string }) {
  return (
    <div className={className}>
      <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Dias trabalhados por semana</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {counts.map((count, index) => (
          <div key={WEEKDAY_NAMES[index]} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm font-bold dark:bg-slate-950/60">
            <span className="text-slate-500 dark:text-slate-400">{WEEKDAY_NAMES[index].replace("-feira", "")}</span>
            <span className="text-slate-950 dark:text-white">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
