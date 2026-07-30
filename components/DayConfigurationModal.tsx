"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { XIcon } from "@/components/icons";
import { formatLongDate } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { calculateDayValue } from "@/lib/payments";
import type { DayConfiguration, DayStatus, PaymentRates } from "@/types/payment";

type Props = {
  year: number;
  month: number;
  day: number;
  status: DayStatus;
  rates: PaymentRates;
  holidayName?: string;
  initialConfiguration?: DayConfiguration;
  onClose: () => void;
  onSave: (status: DayStatus, configuration: DayConfiguration | null) => void;
};

export function DayConfigurationModal({ year, month, day, status, rates, holidayName, initialConfiguration, onClose, onSave }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const [workStatus, setWorkStatus] = useState<DayConfiguration["workStatus"]>(initialConfiguration?.workStatus ?? statusToWork(status));
  const [absenceType, setAbsenceType] = useState(initialConfiguration?.absence?.paymentType ?? "unpaid");
  const [reason, setReason] = useState(initialConfiguration?.absence?.reason ?? "");
  const [absenceDiscount, setAbsenceDiscount] = useState(String(initialConfiguration?.absence?.customDiscount ?? ""));
  const [holidayWorked, setHolidayWorked] = useState(initialConfiguration?.holiday?.workedStatus ?? "not_worked");
  const [holidayPayment, setHolidayPayment] = useState(initialConfiguration?.holiday?.paymentType ?? "unpaid");
  const [holidayCustom, setHolidayCustom] = useState(String(initialConfiguration?.holiday?.customValue ?? ""));
  const [overrideType, setOverrideType] = useState(initialConfiguration?.valueOverride?.type ?? "default");
  const [overrideValue, setOverrideValue] = useState(String(initialConfiguration?.valueOverride?.value ?? ""));
  const [observation, setObservation] = useState(initialConfiguration?.observation ?? "");
  const isHoliday = Boolean(holidayName || initialConfiguration?.holiday?.isHoliday);

  useEffect(() => {
    closeButton.current?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const modal = closeButton.current?.closest('[role="dialog"]');
        const focusable = modal?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])");
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [onClose]);

  const configuration = useMemo<DayConfiguration>(() => ({
    workStatus,
    observation: observation.trim() || undefined,
    absence: workStatus === "absence" ? {
      paymentType: absenceType,
      reason: reason.trim() || undefined,
      customDiscount: absenceType === "custom_discount" ? numeric(absenceDiscount) : undefined
    } : undefined,
    holiday: isHoliday ? {
      isHoliday: true,
      name: holidayName ?? initialConfiguration?.holiday?.name,
      workedStatus: holidayWorked,
      paymentType: holidayPayment,
      customValue: holidayPayment === "custom" ? numeric(holidayCustom) : undefined
    } : undefined,
    valueOverride: overrideType === "default" ? undefined : { type: overrideType, value: numeric(overrideValue) },
    updatedAt: new Date().toISOString()
  }), [absenceDiscount, absenceType, holidayCustom, holidayName, holidayPayment, holidayWorked, initialConfiguration?.holiday?.name, isHoliday, observation, overrideType, overrideValue, reason, workStatus]);

  const resultingStatus = workStatus === "absence" ? status : workToStatus(workStatus);
  const baseValue = resultingStatus === "V" ? rates.fullDay : resultingStatus === "M" ? rates.halfDay : 0;
  const calculated = calculateDayValue(resultingStatus, configuration, rates);
  const errors = {
    reason: reason.length > 300 ? "Use no máximo 300 caracteres." : "",
    observation: observation.length > 500 ? "Use no máximo 500 caracteres." : "",
    absenceDiscount: absenceType === "custom_discount" && absenceDiscount === "" ? "Informe o valor do desconto." : absenceType === "custom_discount" && (numeric(absenceDiscount) < 0 || numeric(absenceDiscount) > rates.fullDay) ? `O desconto deve ficar entre R$ 0,00 e ${formatCurrency(rates.fullDay)}.` : "",
    holidayCustom: isHoliday && holidayPayment === "custom" && numeric(holidayCustom) < 0 ? "Informe um valor válido." : isHoliday && holidayPayment === "custom" && holidayCustom === "" ? "Informe o valor personalizado." : "",
    override: overrideType !== "default" && overrideValue === "" ? "Informe um valor." : overrideType === "discount" && numeric(overrideValue) > calculateDayValue(resultingStatus, { ...configuration, valueOverride: undefined }, rates) ? "O desconto não pode superar o valor disponível." : ""
  };
  const valid = !Object.values(errors).some(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="day-modal-title" className="flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:max-h-[92vh] sm:rounded-3xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Configurar dia</p><h2 id="day-modal-title" className="mt-1 text-xl font-black">{formatLongDate(year, month, day)}</h2></div>
          <button ref={closeButton} type="button" onClick={onClose} aria-label="Fechar configuração do dia" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 focus-visible:ring-4 focus-visible:ring-teal-500/25 dark:border-slate-700"><XIcon className="h-5 w-5" /></button>
        </header>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
          <section>
            <h3 className="text-sm font-black">Status do dia</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {([["off", "Folga"], ["full", "Inteiro"], ["half", "Meio período"], ["absence", "Falta"]] as const).map(([value, label]) => (
                <button key={value} type="button" aria-pressed={workStatus === value} onClick={() => setWorkStatus(value)} className={`min-h-11 rounded-xl border px-3 text-sm font-bold focus-visible:ring-4 focus-visible:ring-teal-500/25 ${workStatus === value ? "border-slate-950 bg-slate-950 text-white dark:border-white dark:bg-white dark:text-slate-950" : "border-slate-200 dark:border-slate-700"}`}>{label}</button>
              ))}
            </div>
          </section>

          <ValueSummary base={baseValue} calculated={calculated} />

          {workStatus === "absence" ? (
            <section className="space-y-4 rounded-2xl bg-rose-50 p-4 dark:bg-rose-950/20">
              <h3 className="font-black text-rose-800 dark:text-rose-200">Configuração da falta</h3>
              <Select label="Pagamento da falta" value={absenceType} onChange={setAbsenceType} options={[["unpaid", "Não remunerada"], ["paid", "Remunerada"], ["custom_discount", "Desconto personalizado"], ["no_change", "Sem alteração no pagamento"]]} />
              {absenceType === "custom_discount" ? <MoneyInput label="Valor do desconto" value={absenceDiscount} onChange={setAbsenceDiscount} error={errors.absenceDiscount} /> : null}
              <label className="block text-sm font-bold">Motivo da falta<textarea value={reason} maxLength={300} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-rose-200 bg-white p-3 outline-none focus:ring-4 focus:ring-rose-400/15 dark:bg-slate-900" /><span className="mt-1 flex justify-between text-xs font-semibold text-slate-500"><span>{errors.reason}</span><span>{reason.length}/300</span></span></label>
            </section>
          ) : null}

          {isHoliday ? (
            <section className="space-y-4 rounded-2xl bg-violet-50 p-4 dark:bg-violet-950/20">
              <div><h3 className="font-black text-violet-800 dark:text-violet-200">Feriado</h3><p className="text-sm font-semibold text-violet-700 dark:text-violet-300">{holidayName ?? initialConfiguration?.holiday?.name}</p></div>
              <Select label="Situação no feriado" value={holidayWorked} onChange={setHolidayWorked} options={[["not_worked", "Não trabalhou"], ["full", "Trabalhou período inteiro"], ["half", "Trabalhou meio período"]]} />
              <Select label="Forma de pagamento" value={holidayPayment} onChange={setHolidayPayment} options={[["unpaid", "Sem pagamento"], ["normal", "Pagamento normal"], ["double", "Pagamento dobrado"], ["custom", "Valor personalizado"]]} />
              {holidayPayment === "custom" ? <MoneyInput label="Valor personalizado" value={holidayCustom} onChange={setHolidayCustom} error={errors.holidayCustom} /> : null}
            </section>
          ) : null}

          <section className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <h3 className="font-black">Alterar valor deste dia</h3>
            <Select label="Regra de valor" value={overrideType} onChange={setOverrideType} options={[["default", "Usar valor padrão"], ["final_value", "Definir valor final"], ["addition", "Adicionar acréscimo"], ["discount", "Aplicar desconto"]]} />
            {overrideType !== "default" ? <MoneyInput label={{ final_value: "Valor final do dia", addition: "Valor do acréscimo", discount: "Valor do desconto" }[overrideType]} value={overrideValue} onChange={setOverrideValue} error={errors.override} /> : null}
          </section>

          <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <label className="block text-sm font-bold">
              Observação geral
              <textarea value={observation} maxLength={500} onChange={(event) => setObservation(event.target.value)} placeholder="Ex.: Cliente pediu hora extra." className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:ring-4 focus:ring-teal-500/15 dark:border-slate-700 dark:bg-slate-900" />
              <span className="mt-1 flex justify-between text-xs font-semibold text-slate-500"><span>{errors.observation}</span><span>{observation.length}/500</span></span>
            </label>
          </section>
        </div>

        <footer className="grid grid-cols-2 gap-2 border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 sm:flex sm:justify-end">
          <button type="button" onClick={() => { setWorkStatus(statusToWork(status)); setReason(""); setAbsenceType("unpaid"); setAbsenceDiscount(""); setHolidayWorked("not_worked"); setHolidayPayment("unpaid"); setHolidayCustom(""); setOverrideType("default"); setOverrideValue(""); setObservation(""); }} className="min-h-11 rounded-xl px-4 text-sm font-bold text-slate-600">Restaurar padrão</button>
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold dark:border-slate-700">Cancelar</button>
          <button type="button" disabled={!valid} onClick={() => onSave(resultingStatus, configuration)} className="col-span-2 min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-40 dark:bg-white dark:text-slate-950">Salvar</button>
        </footer>
      </section>
    </div>
  );
}

function ValueSummary({ base, calculated }: { base: number; calculated: number }) {
  return <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-100 p-4 dark:bg-slate-950"><div><p className="text-xs font-bold uppercase text-slate-500">Valor padrão</p><p className="mt-1 text-lg font-black">{formatCurrency(base)}</p></div><div className="text-right"><p className="text-xs font-bold uppercase text-slate-500">Valor calculado</p><p className="mt-1 text-lg font-black text-teal-700 dark:text-teal-300">{formatCurrency(calculated)}</p></div></div>;
}

function Select<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (value: T) => void; options: ReadonlyArray<readonly [T, string]> }) {
  return <label className="block text-sm font-bold">{label}<select value={value} onChange={(event) => onChange(event.target.value as T)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:ring-4 focus:ring-teal-500/15 dark:border-slate-700 dark:bg-slate-900">{options.map(([option, text]) => <option key={option} value={option}>{text}</option>)}</select></label>;
}

function MoneyInput({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) {
  return <label className="block text-sm font-bold">{label}<span className="mt-2 flex h-12 items-center rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900"><span className="mr-2 text-slate-400">R$</span><input inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value.replace(/[^\d,.]/g, ""))} className="min-w-0 flex-1 bg-transparent outline-none" /></span>{error ? <span className="mt-1 block text-xs font-semibold text-rose-600">{error}</span> : null}</label>;
}

function numeric(value: string) {
  const number = Number(value.includes(",") ? value.replace(/\./g, "").replace(",", ".") : value);
  return Number.isFinite(number) ? number : 0;
}

function statusToWork(status: DayStatus): DayConfiguration["workStatus"] {
  return status === "V" ? "full" : status === "M" ? "half" : "off";
}

function workToStatus(status: DayConfiguration["workStatus"]): DayStatus {
  return status === "full" ? "V" : status === "half" ? "M" : "O";
}
