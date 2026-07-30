"use client";

import { useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { OnboardingScreen } from "@/components/OnboardingScreen";
import { DayCard } from "@/components/DayCard";
import { DayConfigurationModal } from "@/components/DayConfigurationModal";
import { DownloadIcon } from "@/components/icons";
import { ExportModal } from "@/components/ExportModal";
import { MonthSelector } from "@/components/MonthSelector";
import { StatsChart } from "@/components/StatsChart";
import { SummaryCard } from "@/components/SummaryCard";
import { ConfirmClearModal } from "@/components/ConfirmClearModal";
import { UndoToast } from "@/components/UndoToast";
import { BulkEditModal } from "@/components/BulkEditModal";
import { getCalendarLeadingBlanks, getDaysInMonth, getPeriodDays, getWeekdayIndex, WEEKDAY_ABBR, WEEKDAY_NAMES } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { getBrazilianHoliday, toIsoDate } from "@/lib/holidays";
import { summarizeConfiguredPeriod } from "@/lib/payments";
import { useMonthPayment } from "@/hooks/useMonthPayment";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";
import type { DayStatus, PaymentPeriod, Period, UndoAction } from "@/types/payment";

export default function Home() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [period, setPeriod] = useState<Period>(today.getDate() <= 15 ? "first" : "second");
  const [weekIndex, setWeekIndex] = useState(Math.floor((today.getDate() + new Date(today.getFullYear(), today.getMonth(), 1).getDay() - 1) / 7));
  const [exportOpen, setExportOpen] = useState(false);
  const [configuredDay, setConfiguredDay] = useState<number | null>(null);
  const [pendingClear, setPendingClear] = useState<{ days: number[]; label: string } | null>(null);
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const configurationTrigger = useRef<HTMLButtonElement | null>(null);
  const { data, cycleDay, setDays, clearRange, undoClear, saveDayConfiguration, updateManyDays, duplicatePreviousMonth } = useMonthPayment(year, month);
  const { settings, rates, isReady, isConfigured, save } = usePaymentSettings();

  const days = useMemo(() => getVisibleDays(year, month, settings.period, period, weekIndex), [month, period, settings.period, weekIndex, year]);
  const periodData = useMemo(() => Object.fromEntries(days.map((day) => [day, day <= 15 ? data.first[day] : data.second[day]])), [data, days]);
  const summary = useMemo(() => summarizeConfiguredPeriod(year, month, days, periodData, data.daySettings, rates), [data.daySettings, days, month, periodData, rates, year]);
  const leadingBlanks = useMemo(() => getCalendarLeadingBlanks(year, month, days[0] ?? 1), [days, month, year]);
  const weeklyCounts = useMemo(() => getWorkedByWeekday(year, month, periodData), [month, periodData, year]);

  function setVisibleDays(status: DayStatus, filter?: (day: number) => boolean) {
    const selected = filter ? days.filter(filter) : days;
    const first = selected.filter((day) => day <= 15);
    const second = selected.filter((day) => day > 15);
    if (first.length) setDays("first", first, status);
    if (second.length) setDays("second", second, status);
  }

  function markWeekdayAsFull(weekday: number) {
    const matchingDays = days.filter((day) => getWeekdayIndex(year, month, day) === weekday);
    setVisibleDays("V", (day) => matchingDays.includes(day));
  }

  function moveInterval(direction: -1 | 1) {
    if (settings.period === "weekly") {
      const count = getWeekCount(year, month);
      const next = weekIndex + direction;
      if (next < 0) {
        const previous = shiftMonth(year, month, -1);
        setYear(previous.year); setMonth(previous.month); setWeekIndex(getWeekCount(previous.year, previous.month) - 1);
      } else if (next >= count) {
        const following = shiftMonth(year, month, 1);
        setYear(following.year); setMonth(following.month); setWeekIndex(0);
      } else setWeekIndex(next);
    } else if (settings.period === "fortnightly") {
      if ((period === "first" && direction === 1) || (period === "second" && direction === -1)) {
        setPeriod(period === "first" ? "second" : "first");
      } else {
        const shifted = shiftMonth(year, month, direction);
        setYear(shifted.year); setMonth(shifted.month); setPeriod(direction === 1 ? "first" : "second");
      }
    }
  }

  function closeDayConfiguration() {
    setConfiguredDay(null);
    window.setTimeout(() => configurationTrigger.current?.focus(), 0);
  }

  if (!isReady) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#f7f8fa] px-4 dark:bg-[#070b14]">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400" role="status">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-teal-500 border-r-transparent" />
          Carregando suas configurações...
        </div>
      </main>
    );
  }

  if (!isConfigured) {
    return <OnboardingScreen onComplete={save} />;
  }

  return (
    <AppShell>
      <section className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
          <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] dark:bg-white dark:text-slate-950 sm:rounded-[28px] sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl" />
            <div className="flex flex-col gap-5 min-[460px]:flex-row min-[460px]:items-end min-[460px]:justify-between">
              <div className="relative min-w-0">
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Você irá receber</p>
                <p key={summary.total} className="total-pop mt-2 break-words text-[clamp(2.5rem,13vw,4.5rem)] font-black leading-none tracking-[-0.045em]">{formatCurrency(summary.total)}</p>
                <p className="mt-2 text-sm font-medium text-slate-400 dark:text-slate-500">Pagamento estimado para {periodDescription(settings.period)}</p>
              </div>
              <div className="relative flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur dark:border-slate-200 dark:bg-slate-100 min-[460px]:block min-[460px]:px-5 min-[460px]:py-4 min-[460px]:text-right">
                <p className="text-3xl font-black text-teal-300 dark:text-teal-700">{summary.workedPercentage}%</p>
                <p className="mt-1 text-xs font-bold text-slate-400 dark:text-slate-500">{summary.workedDays} de {summary.totalDays} dias</p>
              </div>
            </div>
            <div className="relative mt-7 h-2 overflow-hidden rounded-full bg-white/10 dark:bg-slate-200">
              <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-700 ease-out" style={{ width: `${summary.workedPercentage}%` }} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:p-5">
            <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
              <MonthSelector month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />
              <button
                type="button"
                onClick={() => setExportOpen(true)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-teal-700 dark:bg-white dark:text-slate-950 dark:hover:bg-teal-200"
              >
                <DownloadIcon className="h-5 w-5" />
                Exportar
              </button>
            </div>
            <div className="mt-4 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/60">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">{modeLabel(settings.period)}</p>
                  <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">{intervalLabel(year, month, days)}</p>
                </div>
                {settings.period === "weekly" || settings.period === "fortnightly" ? (
                  <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
                    <button type="button" onClick={() => moveInterval(-1)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold dark:border-slate-700 dark:bg-slate-900">‹ Anterior</button>
                    <button type="button" onClick={() => moveInterval(1)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold dark:border-slate-700 dark:bg-slate-900">Próximo ›</button>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button type="button" aria-pressed={selectionMode} onClick={() => { setSelectionMode((active) => !active); setSelectedDays([]); }} className={`min-h-11 rounded-xl border px-4 text-sm font-black ${selectionMode ? "border-cyan-500 bg-cyan-500 text-white" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"}`}>{selectionMode ? "Cancelar seleção" : "Selecionar vários dias"}</button>
              <button type="button" onClick={() => { if (window.confirm("Copiar status, faltas, feriados, valores e observações do mês anterior?")) duplicatePreviousMonth(); }} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black dark:border-slate-700 dark:bg-slate-900">Copiar configurações do mês anterior</button>
            </div>
            {selectionMode ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-cyan-50 p-3 dark:bg-cyan-950/20">
                <span className="mr-auto text-sm font-black">{selectedDays.length} dia(s) selecionado(s)</span>
                <button type="button" onClick={() => setSelectedDays([...days])} className="min-h-10 rounded-xl bg-white px-3 text-sm font-bold dark:bg-slate-900">Selecionar período</button>
                <button type="button" disabled={!selectedDays.length} onClick={() => setBulkOpen(true)} className="min-h-10 rounded-xl bg-cyan-600 px-4 text-sm font-black text-white disabled:opacity-40">Editar seleção</button>
              </div>
            ) : null}
            <div className="mt-4 grid gap-2 border-t border-slate-200 pt-4 text-sm font-bold text-slate-600 dark:border-slate-800 dark:text-slate-300 sm:grid-cols-2 xl:grid-cols-5">
              <LegendItem color="bg-emerald-500" label="V - Dia inteiro" value={formatCurrency(rates.fullDay)} />
              <LegendItem color="bg-amber-300" label="M - Meio período" value={formatCurrency(rates.halfDay)} />
              <LegendItem color="bg-slate-200 dark:bg-slate-700" label="Folga" value="R$0" />
              <LegendItem color="bg-rose-500" label="Falta" value="Configurável" />
              <LegendItem color="bg-violet-500" label="Feriado" value="Configurável" />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/80 p-3 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/80 sm:p-4">
            <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-3 dark:border-slate-800 sm:grid-cols-4">
              {settings.period === "weekly" || settings.period === "fortnightly" ? (
                <>
                  <QuickAction label="Marcar dias úteis como Inteiro" onClick={() => setVisibleDays("V", (day) => ![0, 6].includes(getWeekdayIndex(year, month, day)))} />
                  <QuickAction label="Marcar todos como Inteiro" onClick={() => setVisibleDays("V")} />
                  <QuickAction label={`Limpar ${settings.period === "weekly" ? "semana" : "quinzena"}`} onClick={() => setPendingClear({ days, label: intervalLabel(year, month, days) })} muted />
                </>
              ) : (
                <>
                  <QuickAction label="Marcar sextas como Inteiro" onClick={() => markWeekdayAsFull(5)} />
                  <QuickAction label="Marcar sábados como Inteiro" onClick={() => markWeekdayAsFull(6)} />
                  <QuickAction label="Marcar domingos como Inteiro" onClick={() => markWeekdayAsFull(0)} />
                  <QuickAction label="Limpar todos" onClick={() => setPendingClear({ days, label: `${new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(year, month - 1, 1))} de ${year}` })} muted />
                </>
              )}
            </div>

            <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-7">
              {WEEKDAY_ABBR.map((weekday) => (
                <div key={weekday} className="hidden min-w-0 py-1 text-center text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 sm:block">
                  {weekday}
                </div>
              ))}

              {Array.from({ length: leadingBlanks }, (_, index) => (
                <div key={`blank-${index}`} aria-hidden="true" className="hidden rounded-2xl sm:block sm:aspect-[1.05]" />
              ))}

              {days.map((day) => (
                <DayCard
                  key={`${day}-${periodData[day] ?? "O"}`}
                  day={day}
                  month={month}
                  year={year}
                  status={periodData[day] ?? "O"}
                  rates={rates}
                  configuration={data.daySettings[toIsoDate(year, month, day)]}
                  holidayName={getBrazilianHoliday(year, month, day)?.name}
                  onClick={() => {
                    const configuration = data.daySettings[toIsoDate(year, month, day)];
                    if (configuration?.workStatus === "absence" || getBrazilianHoliday(year, month, day)) return;
                    cycleDay(day <= 15 ? "first" : "second", day);
                  }}
                  selectionMode={selectionMode}
                  selected={selectedDays.includes(day)}
                  onSelect={() => setSelectedDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort((a, b) => a - b))}
                  onConfigure={(button) => {
                    configurationTrigger.current = button;
                    setConfiguredDay(day);
                  }}
                />
              ))}
              {settings.period === "weekly" ? Array.from({ length: Math.max(0, 7 - leadingBlanks - days.length) }, (_, index) => (
                <div key={`trailing-${index}`} aria-hidden="true" className="hidden min-h-24 rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-950/20 sm:block" />
              )) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900/90 sm:p-5 lg:hidden">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Calculo</p>
            <div className="mt-4 grid gap-3 min-[520px]:grid-cols-3">
              <MobileMetric label="Inteiros" value={summary.fullDays} detail={`${summary.fullDays} × ${formatCurrency(rates.fullDay)}`} total={formatCurrency(summary.fullTotal)} />
              <MobileMetric label="Meios" value={summary.halfDays} detail={`${summary.halfDays} × ${formatCurrency(rates.halfDay)}`} total={formatCurrency(summary.halfTotal)} />
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

        <SummaryCard summary={summary} rates={rates} weeklyCounts={weeklyCounts} className="hidden lg:block lg:sticky lg:top-6" />
      </section>
      <ExportModal year={year} month={month} data={data} rates={rates} isOpen={exportOpen} onClose={() => setExportOpen(false)} />
      {configuredDay !== null ? (
        <DayConfigurationModal
          year={year}
          month={month}
          day={configuredDay}
          status={periodData[configuredDay] ?? "O"}
          rates={rates}
          holidayName={getBrazilianHoliday(year, month, configuredDay)?.name}
          initialConfiguration={data.daySettings[toIsoDate(year, month, configuredDay)]}
          onClose={closeDayConfiguration}
          onSave={(status, configuration) => {
            setDays(configuredDay <= 15 ? "first" : "second", [configuredDay], status);
            saveDayConfiguration(toIsoDate(year, month, configuredDay), configuration);
            closeDayConfiguration();
          }}
        />
      ) : null}
      {pendingClear ? (
        <ConfirmClearModal
          period={pendingClear.label}
          onCancel={() => setPendingClear(null)}
          onConfirm={() => {
            const undo = clearRange(pendingClear.days, `Limpeza de ${pendingClear.label}`);
            setPendingClear(null);
            if (undo) setUndoAction(undo);
          }}
        />
      ) : null}
      {undoAction ? (
        <UndoToast
          onExpire={() => setUndoAction(null)}
          onUndo={() => {
            undoClear(undoAction);
            setUndoAction(null);
          }}
        />
      ) : null}
      {bulkOpen ? <BulkEditModal count={selectedDays.length} onClose={() => setBulkOpen(false)} onApply={(update) => { updateManyDays(selectedDays, update); setBulkOpen(false); setSelectedDays([]); setSelectionMode(false); }} /> : null}
    </AppShell>
  );
}

function getVisibleDays(year: number, month: number, mode: PaymentPeriod, period: Period, weekIndex: number) {
  if (mode === "fortnightly") return getPeriodDays(year, month, period);
  const all = Array.from({ length: getDaysInMonth(year, month) }, (_, index) => index + 1);
  if (mode !== "weekly") return all;
  const leading = getWeekdayIndex(year, month, 1);
  return all.filter((day) => Math.floor((leading + day - 1) / 7) === weekIndex);
}

function getWeekCount(year: number, month: number) {
  return Math.ceil((getWeekdayIndex(year, month, 1) + getDaysInMonth(year, month)) / 7);
}

function shiftMonth(year: number, month: number, amount: number) {
  const date = new Date(year, month - 1 + amount, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function intervalLabel(year: number, month: number, days: number[]) {
  if (!days.length) return "";
  return `${days[0]} a ${days[days.length - 1]} de ${new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(year, month - 1, 1))} de ${year}`;
}

function modeLabel(mode: PaymentPeriod) {
  return { daily: "Pagamento por diária", weekly: "Pagamento semanal", fortnightly: "Pagamento quinzenal", monthly: "Pagamento mensal" }[mode];
}

function periodDescription(mode: PaymentPeriod) {
  return { daily: "os dias exibidos", weekly: "esta semana", fortnightly: "esta quinzena", monthly: "este mês" }[mode];
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
      className={`min-h-12 rounded-2xl px-3 py-2 text-xs font-black leading-tight transition hover:-translate-y-0.5 sm:text-sm ${
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
