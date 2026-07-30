import type { BulkDayUpdate, MonthData } from "../types/payment.ts";

export function clearCalendarDays(data: MonthData, days: number[], year: number, month: number): MonthData {
  const selected = new Set(days);
  const updated: MonthData = { first: { ...data.first }, second: { ...data.second }, daySettings: { ...data.daySettings } };
  days.forEach((day) => { updated[day <= 15 ? "first" : "second"][day] = "O"; });
  Object.keys(updated.daySettings).forEach((isoDate) => {
    if (isoDate.startsWith(`${year}-${String(month).padStart(2, "0")}-`) && selected.has(Number(isoDate.slice(-2)))) delete updated.daySettings[isoDate];
  });
  return updated;
}

export function applyBulkUpdate(data: MonthData, days: number[], year: number, month: number, update: BulkDayUpdate, timestamp = new Date().toISOString()): MonthData {
  const result: MonthData = { first: { ...data.first }, second: { ...data.second }, daySettings: { ...data.daySettings } };
  days.forEach((day) => {
    const period = day <= 15 ? "first" : "second";
    const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const previous = result.daySettings[isoDate];
    if (update.status) result[period][day] = update.status;
    result.daySettings[isoDate] = {
      ...previous,
      workStatus: update.absence ? "absence" : update.status === "V" ? "full" : update.status === "M" ? "half" : update.status === "O" ? "off" : previous?.workStatus ?? "off",
      absence: update.absence ? previous?.absence ?? { paymentType: "unpaid" } : update.status ? undefined : previous?.absence,
      observation: update.observation !== undefined ? update.observation.trim() || undefined : previous?.observation,
      valueOverride: update.finalValue !== undefined ? { type: "final_value", value: update.finalValue } : previous?.valueOverride,
      updatedAt: timestamp
    };
  });
  return result;
}

export function matchesSavedMonth(data: MonthData, monthLabel: string, term: string, filters: string[]) {
  const configurations = Object.values(data.daySettings);
  const searchable = [monthLabel, ...configurations.flatMap((item) => [item.observation ?? "", item.absence?.reason ?? "", item.holiday?.name ?? ""])].join(" ").toLocaleLowerCase("pt-BR");
  if (term && !searchable.includes(term.toLocaleLowerCase("pt-BR"))) return false;
  if (!filters.length) return true;
  const statuses = [...Object.values(data.first), ...Object.values(data.second)];
  return filters.some((filter) => filter === "absence" ? configurations.some((item) => item.workStatus === "absence") : filter === "holiday" ? configurations.some((item) => item.holiday?.isHoliday) : statuses.includes(filter as "V" | "M" | "O"));
}

export function duplicateMonthData(source: MonthData, target: MonthData, year: number, month: number): MonthData {
  const validDays = new Set([...Object.keys(target.first), ...Object.keys(target.second)].map(Number));
  const copied: MonthData = {
    first: Object.fromEntries(Object.keys(target.first).map((day) => [Number(day), source.first[Number(day)] ?? "O"])),
    second: Object.fromEntries(Object.keys(target.second).map((day) => [Number(day), source.second[Number(day)] ?? "O"])),
    daySettings: {}
  };
  Object.entries(source.daySettings).forEach(([isoDate, configuration]) => {
    const day = Number(isoDate.slice(-2));
    if (validDays.has(day)) copied.daySettings[`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`] = { ...configuration, updatedAt: new Date().toISOString() };
  });
  return copied;
}
