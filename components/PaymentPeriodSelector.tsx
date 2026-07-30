"use client";

import type { PaymentPeriod } from "@/types/payment";

const OPTIONS: Array<{ value: PaymentPeriod; label: string }> = [
  { value: "daily", label: "Por diária" },
  { value: "weekly", label: "Semanal" },
  { value: "fortnightly", label: "Quinzenal" },
  { value: "monthly", label: "Mensal" }
];

export function PaymentPeriodSelector({
  value,
  onChange
}: {
  value: PaymentPeriod;
  onChange: (value: PaymentPeriod) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-950 sm:grid-cols-4" role="group" aria-label="Modalidade de pagamento">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`min-h-11 rounded-xl px-3 text-sm font-black outline-none transition focus-visible:ring-4 focus-visible:ring-teal-500/25 ${
            value === option.value
              ? "bg-slate-950 text-white shadow-md dark:bg-white dark:text-slate-950"
              : "bg-white/60 text-slate-600 hover:bg-white hover:text-teal-700 dark:bg-slate-900 dark:text-slate-300"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
