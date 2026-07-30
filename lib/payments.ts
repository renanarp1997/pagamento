import { getPeriodDays } from "@/lib/date";
import { calculateDayValue, getNextQuickStatus } from "@/lib/day-value";
import type { DayConfiguration, DayStatus, MonthData, PaymentRates, PaymentSettings, Period, PeriodData, PeriodSummary } from "@/types/payment";

export function getEffectiveRates(settings: PaymentSettings): PaymentRates {
  const fullDay = settings.period === "daily"
    ? settings.dailyValue
    : settings.periodValue / Math.max(1, settings.workDaysPerPeriod);
  return {
    fullDay,
    halfDay: settings.halfDayValue ?? fullDay / 2
  };
}

export { calculateDayValue };

export function createDefaultPeriodData(days: number[]): PeriodData {
  return Object.fromEntries(days.map((day) => [day, "O" satisfies DayStatus]));
}

export function normalizeMonthData(year: number, month: number, data?: Partial<MonthData> | null): MonthData {
  const firstDays = getPeriodDays(year, month, "first");
  const secondDays = getPeriodDays(year, month, "second");

  return {
    first: {
      ...createDefaultPeriodData(firstDays),
      ...(data?.first ?? {})
    },
    second: {
      ...createDefaultPeriodData(secondDays),
      ...(data?.second ?? {})
    },
    daySettings: data?.daySettings ?? {}
  };
}

export function getNextStatus(status: DayStatus): DayStatus {
  return getNextQuickStatus(status);
}

export function summarizePeriod(periodData: PeriodData, totalDays: number, rates: PaymentRates): PeriodSummary {
  const statuses = Object.values(periodData);
  const fullDays = statuses.filter((status) => status === "V").length;
  const halfDays = statuses.filter((status) => status === "M").length;
  const daysOff = totalDays - fullDays - halfDays;
  const workedDays = fullDays + halfDays;
  const fullTotal = fullDays * rates.fullDay;
  const halfTotal = halfDays * rates.halfDay;
  const total = fullTotal + halfTotal;

  return {
    fullDays,
    halfDays,
    daysOff,
    workedDays,
    totalDays,
    fullTotal,
    halfTotal,
    total,
    workedPercentage: totalDays === 0 ? 0 : Math.round((workedDays / totalDays) * 100),
    averagePerWorkedDay: workedDays === 0 ? 0 : total / workedDays,
    averagePerCalendarDay: totalDays === 0 ? 0 : total / totalDays
  };
}

export function summarizeConfiguredPeriod(
  year: number,
  month: number,
  days: number[],
  periodData: PeriodData,
  daySettings: Record<string, DayConfiguration>,
  rates: PaymentRates
): PeriodSummary {
  const entries = days.map((day) => {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const configuration = daySettings[iso];
    const stored = periodData[day] ?? "O";
    const effective = configuration?.holiday?.workedStatus === "full"
      ? "V"
      : configuration?.holiday?.workedStatus === "half"
        ? "M"
        : configuration?.workStatus === "absence"
          ? "O"
          : stored;
    return { status: effective, value: calculateDayValue(stored, configuration, rates) };
  });
  const fullDays = entries.filter((entry) => entry.status === "V").length;
  const halfDays = entries.filter((entry) => entry.status === "M").length;
  const workedDays = fullDays + halfDays;
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  const fullTotal = entries.filter((entry) => entry.status === "V").reduce((sum, entry) => sum + entry.value, 0);
  const halfTotal = entries.filter((entry) => entry.status === "M").reduce((sum, entry) => sum + entry.value, 0);
  return {
    fullDays,
    halfDays,
    daysOff: days.length - workedDays,
    workedDays,
    totalDays: days.length,
    fullTotal,
    halfTotal,
    total,
    workedPercentage: days.length ? Math.round((workedDays / days.length) * 100) : 0,
    averagePerWorkedDay: workedDays ? total / workedDays : 0,
    averagePerCalendarDay: days.length ? total / days.length : 0
  };
}

export function summarizeMonth(data: MonthData, rates: PaymentRates, year?: number, month?: number) {
  const firstDays = Object.keys(data.first).map(Number);
  const secondDays = Object.keys(data.second).map(Number);
  const first = year && month
    ? summarizeConfiguredPeriod(year, month, firstDays, data.first, data.daySettings, rates)
    : summarizePeriod(data.first, firstDays.length, rates);
  const second = year && month
    ? summarizeConfiguredPeriod(year, month, secondDays, data.second, data.daySettings, rates)
    : summarizePeriod(data.second, secondDays.length, rates);

  return {
    first,
    second,
    monthlyTotal: first.total + second.total
  };
}

export function updateDay(data: MonthData, period: Period, day: number): MonthData {
  return {
    ...data,
    [period]: {
      ...data[period],
      [day]: getNextStatus(data[period][day] ?? "O")
    }
  };
}

export function setDaysStatus(data: MonthData, period: Period, days: number[], status: DayStatus): MonthData {
  const updatedPeriod = { ...data[period] };

  days.forEach((day) => {
    updatedPeriod[day] = status;
  });

  return {
    ...data,
    [period]: updatedPeriod
  };
}

export function clearPeriod(data: MonthData, period: Period): MonthData {
  const clearedPeriod = Object.fromEntries(Object.keys(data[period]).map((day) => [Number(day), "O" satisfies DayStatus]));

  return {
    ...data,
    [period]: clearedPeriod
  };
}
