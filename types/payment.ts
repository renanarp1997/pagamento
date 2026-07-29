export type DayStatus = "O" | "V" | "M";

export type Period = "first" | "second";

export type ThemeMode = "light" | "dark";

export type PeriodData = Record<number, DayStatus>;

export type MonthData = {
  first: PeriodData;
  second: PeriodData;
};

export type PeriodSummary = {
  fullDays: number;
  halfDays: number;
  daysOff: number;
  workedDays: number;
  totalDays: number;
  fullTotal: number;
  halfTotal: number;
  total: number;
  workedPercentage: number;
  averagePerWorkedDay: number;
  averagePerCalendarDay: number;
};

export type SavedMonth = {
  key: string;
  year: number;
  month: number;
  data: MonthData;
};
