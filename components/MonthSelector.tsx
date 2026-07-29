"use client";

import { MONTHS } from "@/lib/constants";

type MonthSelectorProps = {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
};

export function MonthSelector({ month, year, onMonthChange, onYearChange }: MonthSelectorProps) {
  const years = Array.from({ length: 9 }, (_, index) => 2026 + index);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
        Mês
        <select
          value={month}
          onChange={(event) => onMonthChange(Number(event.target.value))}
          className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
        >
          {MONTHS.map((monthName, index) => (
            <option key={monthName} value={index + 1}>
              {monthName}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
        Ano
        <select
          value={year}
          onChange={(event) => onYearChange(Number(event.target.value))}
          className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
        >
          {years.map((yearOption) => (
            <option key={yearOption} value={yearOption}>
              {yearOption}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
