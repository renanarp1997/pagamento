"use client";

import type { Period } from "@/types/payment";

type PeriodSelectorProps = {
  period: Period;
  onPeriodChange: (period: Period) => void;
};

const options: Array<{ value: Period; label: string }> = [
  { value: "first", label: "Dias 1-15" },
  { value: "second", label: "Dias 16-Fim" }
];

export function PeriodSelector({ period, onPeriodChange }: PeriodSelectorProps) {
  return (
    <div className="grid rounded-2xl bg-slate-100 p-1 dark:bg-slate-900 sm:grid-cols-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onPeriodChange(option.value)}
          className={`h-12 rounded-xl px-4 text-sm font-bold transition ${
            period === option.value
              ? "bg-white text-teal-700 shadow-sm dark:bg-slate-800 dark:text-teal-200"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
