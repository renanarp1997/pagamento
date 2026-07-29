"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import type { PaymentRates } from "@/types/payment";

type PaymentSettingsFormProps = {
  initialValues: PaymentRates;
  onSave: (rates: PaymentRates) => void;
  onCancel?: () => void;
  onRestore?: () => void;
  onboarding?: boolean;
};

export function PaymentSettingsForm({ initialValues, onSave, onCancel, onRestore, onboarding = false }: PaymentSettingsFormProps) {
  const [fullDay, setFullDay] = useState(String(initialValues.fullDay));
  const [halfDay, setHalfDay] = useState(String(initialValues.halfDay));
  const [errors, setErrors] = useState<{ fullDay?: string; halfDay?: string }>({});
  const fullValue = parseValue(fullDay);
  const halfValue = parseValue(halfDay);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = {
      fullDay: fullValue <= 0 ? "Informe um valor maior que zero." : undefined,
      halfDay: halfDay.trim() === "" ? "Informe um valor, mesmo que seja zero." : halfValue < 0 ? "O valor não pode ser negativo." : undefined
    };
    setErrors(nextErrors);
    if (nextErrors.fullDay || nextErrors.halfDay) return;
    onSave({ fullDay: fullValue, halfDay: halfValue });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_310px]">
      <div className="space-y-5">
        <CurrencyField label="Valor do dia inteiro" value={fullDay} onChange={setFullDay} error={errors.fullDay} autoFocus={onboarding} />
        <CurrencyField label="Valor do meio período" value={halfDay} onChange={setHalfDay} error={errors.halfDay} allowZero />
        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-teal-700 dark:bg-white dark:text-slate-950">
            {onboarding ? "Continuar →" : "Salvar alterações"}
          </button>
          {onCancel ? <button type="button" onClick={onCancel} className="h-12 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancelar</button> : null}
          {onRestore ? <button type="button" onClick={onRestore} className="h-12 rounded-xl px-4 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">Restaurar padrão</button> : null}
        </div>
      </div>

      <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/70">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">Resumo</p>
        <Preview label="Dia inteiro" value={fullValue} tone="emerald" />
        <Preview label="Meio período" value={halfValue} tone="amber" />
        <p className="mt-5 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">Esses valores serão usados em todos os cálculos, histórico e exportações. Você poderá alterá-los depois.</p>
      </aside>
    </form>
  );
}

function CurrencyField({ label, value, onChange, error, autoFocus = false, allowZero = false }: { label: string; value: string; onChange: (value: string) => void; error?: string; autoFocus?: boolean; allowZero?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
      <span className={`mt-2 flex h-16 items-center rounded-2xl border bg-white px-5 shadow-sm transition focus-within:ring-4 dark:bg-slate-950 ${error ? "border-rose-400 focus-within:ring-rose-400/10" : "border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/10 dark:border-slate-700"}`}>
        <span className="mr-3 text-lg font-black text-slate-400">R$</span>
        <input autoFocus={autoFocus} inputMode="decimal" type="number" min={allowZero ? "0" : "0.01"} step="0.01" value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-2xl font-black text-slate-950 outline-none dark:text-white" placeholder="0,00" />
      </span>
      {error ? <span className="mt-2 block text-sm font-semibold text-rose-600">{error}</span> : null}
    </label>
  );
}

function Preview({ label, value, tone }: { label: string; value: number; tone: "emerald" | "amber" }) {
  const color = tone === "emerald" ? "bg-emerald-500" : "bg-amber-400";
  return (
    <div className="mt-4 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
      <span className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><span className={`h-2.5 w-2.5 rounded-full ${color}`} />{label}</span>
      <span className="font-black text-slate-950 dark:text-white">{formatCurrency(Math.max(0, value))}</span>
    </div>
  );
}

function parseValue(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}
