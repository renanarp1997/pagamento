"use client";

import { useMemo, useRef, useState } from "react";
import { PaymentPeriodSelector } from "@/components/PaymentPeriodSelector";
import { DEFAULT_PAYMENT_SETTINGS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { getEffectiveRates } from "@/lib/payments";
import type { PaymentPeriod, PaymentSettings } from "@/types/payment";

type Props = {
  initialValues: PaymentSettings;
  onSave: (settings: PaymentSettings) => void;
  onCancel?: () => void;
  onboarding?: boolean;
};

const PERIOD_DEFAULTS: Record<PaymentPeriod, Pick<PaymentSettings, "periodValue" | "workDaysPerPeriod">> = {
  daily: { periodValue: 94, workDaysPerPeriod: 1 },
  weekly: { periodValue: 470, workDaysPerPeriod: 5 },
  fortnightly: { periodValue: 1034, workDaysPerPeriod: 11 },
  monthly: { periodValue: 2068, workDaysPerPeriod: 22 }
};

export function PaymentSettingsForm({ initialValues, onSave, onCancel, onboarding = false }: Props) {
  const [draft, setDraft] = useState<PaymentSettings>(initialValues);
  const [halfDayText, setHalfDayText] = useState(initialValues.halfDayValue === null ? "" : formatInputValue(initialValues.halfDayValue));
  const [mainValueText, setMainValueText] = useState(formatInputValue(getMainValue(initialValues)));
  const [daysText, setDaysText] = useState(String(initialValues.workDaysPerPeriod));
  const drafts = useRef<Record<PaymentPeriod, PaymentSettings>>({
    daily: initialValues.period === "daily" ? initialValues : { ...DEFAULT_PAYMENT_SETTINGS },
    weekly: initialValues.period === "weekly" ? initialValues : { ...DEFAULT_PAYMENT_SETTINGS, period: "weekly", ...PERIOD_DEFAULTS.weekly },
    fortnightly: initialValues.period === "fortnightly" ? initialValues : { ...DEFAULT_PAYMENT_SETTINGS, period: "fortnightly", ...PERIOD_DEFAULTS.fortnightly },
    monthly: initialValues.period === "monthly" ? initialValues : { ...DEFAULT_PAYMENT_SETTINGS, period: "monthly", ...PERIOD_DEFAULTS.monthly }
  });
  const errors = validate(draft);
  const rates = useMemo(() => getEffectiveRates(draft), [draft]);
  const valid = Object.keys(errors).length === 0;

  function changePeriod(period: PaymentPeriod) {
    drafts.current[draft.period] = draft;
    const next = drafts.current[period];
    setDraft(next);
    setMainValueText(formatInputValue(period === "daily" ? next.dailyValue : next.periodValue));
    setDaysText(String(next.workDaysPerPeriod));
  }

  function changeMain(raw: string) {
    const text = sanitizeMoney(raw);
    const value = parseValue(text);
    setMainValueText(text);
    setDraft((current) => current.period === "daily"
      ? { ...current, dailyValue: value, periodValue: value, workDaysPerPeriod: 1 }
      : { ...current, periodValue: value });
  }

  function changeHalf(raw: string) {
    const text = sanitizeMoney(raw);
    setHalfDayText(text);
    setDraft((current) => ({ ...current, halfDayValue: text === "" ? null : parseValue(text) }));
  }

  function restoreDefaults() {
    if (!window.confirm("Restaurar a modalidade Por diária e os valores padrão?")) return;
    const restored = { ...DEFAULT_PAYMENT_SETTINGS };
    drafts.current = {
      daily: restored,
      weekly: { ...restored, period: "weekly", ...PERIOD_DEFAULTS.weekly },
      fortnightly: { ...restored, period: "fortnightly", ...PERIOD_DEFAULTS.fortnightly },
      monthly: { ...restored, period: "monthly", ...PERIOD_DEFAULTS.monthly }
    };
    setDraft(restored);
    setMainValueText(formatInputValue(restored.dailyValue));
    setHalfDayText(formatInputValue(restored.halfDayValue));
    setDaysText("1");
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) onSave(draft);
      }}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]"
    >
      <div className="min-w-0 space-y-5">
        <div>
          <p className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">Como você recebe?</p>
          <PaymentPeriodSelector value={draft.period} onChange={changePeriod} />
        </div>

        <CurrencyField
          label={mainLabel(draft.period)}
          value={mainValueText}
          onChange={changeMain}
          onBlur={() => setMainValueText(formatInputValue(getMainValue(draft)))}
          error={errors.main}
          autoFocus={onboarding}
        />

        {draft.period !== "daily" ? (
          <NumberField
            label="Dias de trabalho considerados no período"
            value={daysText}
            onChange={(value) => {
              setDaysText(value);
              setDraft((current) => ({ ...current, workDaysPerPeriod: Number(value) }));
            }}
            error={errors.days}
          />
        ) : null}

        <CurrencyField
          label={`Valor do meio período${draft.period === "daily" ? "" : " (opcional)"}`}
          value={halfDayText}
          onChange={changeHalf}
          onBlur={() => halfDayText && setHalfDayText(formatInputValue(draft.halfDayValue ?? 0))}
          error={errors.half}
        />
        {draft.period !== "daily" && draft.halfDayValue === null ? (
          <p className="-mt-3 text-xs font-semibold text-slate-500">Sem valor personalizado, será usada metade da diária calculada.</p>
        ) : null}

        <div className="grid gap-3 pt-2 min-[460px]:flex min-[460px]:flex-wrap">
          <button disabled={!valid} type="submit" className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-white dark:text-slate-950 min-[460px]:w-auto">
            {onboarding ? "Continuar →" : "Salvar alterações"}
          </button>
          {onCancel ? <button type="button" onClick={onCancel} className="h-12 w-full rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200 min-[460px]:w-auto">Cancelar</button> : null}
          {!onboarding ? <button type="button" onClick={restoreDefaults} className="h-12 w-full rounded-xl px-4 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 min-[460px]:w-auto">Restaurar padrão</button> : null}
        </div>
      </div>

      <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/70">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">Resumo</p>
        <Preview label={summaryLabel(draft.period)} value={getMainValue(draft)} tone="emerald" />
        {draft.period !== "daily" ? <Preview label="Diária calculada" value={rates.fullDay} tone="emerald" /> : null}
        <Preview label="Meio período" value={rates.halfDay} tone="amber" />
        {draft.period !== "daily" ? <p className="mt-4 text-sm font-bold text-slate-600 dark:text-slate-300">Dias considerados: {draft.workDaysPerPeriod || 0}</p> : null}
        <p className="mt-5 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">Esses valores serão usados em todos os cálculos, histórico e exportações.</p>
      </aside>
    </form>
  );
}

function CurrencyField({ label, value, onChange, onBlur, error, autoFocus = false }: { label: string; value: string; onChange: (value: string) => void; onBlur: () => void; error?: string; autoFocus?: boolean }) {
  const id = label.toLowerCase().replace(/\W+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</label>
      <span className={`mt-2 flex h-16 items-center rounded-2xl border bg-white px-5 shadow-sm focus-within:ring-4 dark:bg-slate-950 ${error ? "border-rose-400 focus-within:ring-rose-400/10" : "border-slate-200 focus-within:border-teal-500 focus-within:ring-teal-500/10 dark:border-slate-700"}`}>
        <span className="mr-3 text-lg font-black text-slate-400">R$</span>
        <input id={id} autoFocus={autoFocus} inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} className="min-w-0 flex-1 bg-transparent text-2xl font-black outline-none" placeholder="0,00" aria-invalid={Boolean(error)} />
      </span>
      {error ? <p className="mt-2 text-sm font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}

function NumberField({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) {
  return (
    <div>
      <label htmlFor="work-days" className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</label>
      <input id="work-days" type="number" min="1" step="1" inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value)} className={`mt-2 h-14 w-full rounded-2xl border bg-white px-5 text-lg font-black outline-none focus:ring-4 dark:bg-slate-950 ${error ? "border-rose-400" : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/10 dark:border-slate-700"}`} aria-invalid={Boolean(error)} />
      {error ? <p className="mt-2 text-sm font-semibold text-rose-600">{error}</p> : null}
    </div>
  );
}

function Preview({ label, value, tone }: { label: string; value: number; tone: "emerald" | "amber" }) {
  return <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900"><span className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><span className={`h-2.5 w-2.5 rounded-full ${tone === "emerald" ? "bg-emerald-500" : "bg-amber-400"}`} />{label}</span><span className="font-black">{formatCurrency(Math.max(0, value))}</span></div>;
}

function validate(settings: PaymentSettings) {
  const errors: { main?: string; half?: string; days?: string } = {};
  if (getMainValue(settings) <= 0) errors.main = "Informe um valor maior que zero.";
  if (settings.halfDayValue !== null && settings.halfDayValue < 0) errors.half = "O valor não pode ser negativo.";
  if (settings.period === "daily" && (!settings.halfDayValue || settings.halfDayValue <= 0)) errors.half = "Informe um valor maior que zero.";
  if (settings.workDaysPerPeriod <= 0 || !Number.isInteger(settings.workDaysPerPeriod)) errors.days = "Informe ao menos um dia inteiro.";
  return errors;
}

function getMainValue(settings: PaymentSettings) {
  return settings.period === "daily" ? settings.dailyValue : settings.periodValue;
}

function mainLabel(period: PaymentPeriod) {
  return { daily: "Valor final da diária", weekly: "Valor do pagamento semanal", fortnightly: "Valor do pagamento quinzenal", monthly: "Valor do salário mensal" }[period];
}

function summaryLabel(period: PaymentPeriod) {
  return { daily: "Dia inteiro", weekly: "Pagamento semanal", fortnightly: "Pagamento quinzenal", monthly: "Salário mensal" }[period];
}

function sanitizeMoney(value: string) {
  return value.replace(/[^\d,.]/g, "").replace(/([,.].*)[,.]/g, "$1");
}

function parseValue(value: string) {
  const normalized = value.includes(",") ? value.replace(/\./g, "").replace(",", ".") : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatInputValue(value: number) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.max(0, value));
}
