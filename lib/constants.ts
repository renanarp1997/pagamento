export const FULL_DAY_VALUE = 94;
export const HALF_DAY_VALUE = 45;
export const DEFAULT_PAYMENT_RATES = {
  fullDay: FULL_DAY_VALUE,
  halfDay: HALF_DAY_VALUE
} as const;

export const DEFAULT_PAYMENT_SETTINGS = {
  period: "daily",
  dailyValue: FULL_DAY_VALUE,
  halfDayValue: HALF_DAY_VALUE,
  periodValue: FULL_DAY_VALUE,
  workDaysPerPeriod: 1
} as const;

export const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

export const STATUS_LABELS = {
  O: "Folga",
  V: "Dia inteiro",
  M: "Meio período"
} as const;
