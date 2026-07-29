import { getPeriodDays } from "@/lib/date";
import type { DayStatus, MonthData, PaymentRates, Period, PeriodData, PeriodSummary } from "@/types/payment";

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
    }
  };
}

export function getNextStatus(status: DayStatus): DayStatus {
  if (status === "O") {
    return "V";
  }

  if (status === "V") {
    return "M";
  }

  return "O";
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

export function summarizeMonth(data: MonthData, rates: PaymentRates) {
  const first = summarizePeriod(data.first, Object.keys(data.first).length, rates);
  const second = summarizePeriod(data.second, Object.keys(data.second).length, rates);

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
