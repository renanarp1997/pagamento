export type DayStatus = "O" | "V" | "M";
export type DayWorkStatus = "off" | "full" | "half" | "absence";
export type AbsencePaymentType = "unpaid" | "paid" | "custom_discount" | "no_change";
export type HolidayWorkedStatus = "not_worked" | "full" | "half";
export type HolidayPaymentType = "unpaid" | "normal" | "double" | "custom";
export type DayValueOverrideType = "default" | "final_value" | "addition" | "discount";

export type DayConfiguration = {
  workStatus: DayWorkStatus;
  observation?: string;
  absence?: {
    paymentType: AbsencePaymentType;
    reason?: string;
    customDiscount?: number;
  };
  holiday?: {
    isHoliday: boolean;
    name?: string;
    workedStatus: HolidayWorkedStatus;
    paymentType: HolidayPaymentType;
    customValue?: number;
  };
  valueOverride?: {
    type: DayValueOverrideType;
    value?: number;
  };
  updatedAt?: string;
};

export type Period = "first" | "second";

export type ThemeMode = "light" | "dark";

export type PaymentPeriod = "daily" | "weekly" | "fortnightly" | "monthly";

export type PaymentSettings = {
  period: PaymentPeriod;
  dailyValue: number;
  halfDayValue: number | null;
  periodValue: number;
  workDaysPerPeriod: number;
};

export type PaymentRates = {
  fullDay: number;
  halfDay: number;
};

export type PeriodData = Record<number, DayStatus>;

export type MonthData = {
  first: PeriodData;
  second: PeriodData;
  daySettings: Record<string, DayConfiguration>;
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

export type UndoAction = {
  id: string;
  timestamp: string;
  year: number;
  month: number;
  previousState: MonthData;
  previousHistory: string | null;
};

export type BulkDayUpdate = {
  status?: DayStatus;
  absence?: boolean;
  observation?: string;
  finalValue?: number;
};
