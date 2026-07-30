import { getStorageKey } from "@/lib/date";
import type { MonthData } from "@/types/payment";
import { DEFAULT_PAYMENT_SETTINGS } from "@/lib/constants";
import { getEffectiveRates, summarizeMonth } from "@/lib/payments";

export const PAYMENT_HISTORY_KEY = "quinzena-payment-history-v1";
export const PAYMENT_HISTORY_EVENT = "quinzena-payment-history-change";
const MAX_HISTORY_ENTRIES = 200;

export type PaymentHistoryEntry = {
  id: string;
  createdAt: string;
  year: number;
  month: number;
  action: string;
  before: MonthData;
  summary?: {
    total: number;
    workedDays: number;
    absences: number;
    holidays: number;
  };
};

export function readPaymentHistory(): PaymentHistoryEntry[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PAYMENT_HISTORY_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMonthWithHistory(
  year: number,
  month: number,
  before: MonthData,
  after: MonthData,
  action: string
) {
  if (JSON.stringify(before) === JSON.stringify(after)) return false;

  const entry: PaymentHistoryEntry = {
    id: `${Date.now()}-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    year,
    month,
    action,
    before,
    summary: createHistoricalSummary(after, year, month)
  };
  const history = [entry, ...readPaymentHistory()].slice(0, MAX_HISTORY_ENTRIES);

  window.localStorage.setItem(PAYMENT_HISTORY_KEY, JSON.stringify(history));
  window.localStorage.setItem(getStorageKey(year, month), JSON.stringify(after));
  window.dispatchEvent(new Event(PAYMENT_HISTORY_EVENT));
  return true;
}

function createHistoricalSummary(data: MonthData, year: number, month: number) {
  let settings = DEFAULT_PAYMENT_SETTINGS;
  try {
    const saved = JSON.parse(window.localStorage.getItem("quinzena-payment-settings") ?? "null");
    if (saved && typeof saved === "object") settings = { ...DEFAULT_PAYMENT_SETTINGS, ...saved };
  } catch {}
  const calculated = summarizeMonth(data, getEffectiveRates(settings), year, month);
  const configurations = Object.values(data.daySettings);
  return {
    total: calculated.monthlyTotal,
    workedDays: calculated.first.workedDays + calculated.second.workedDays,
    absences: configurations.filter((configuration) => configuration.workStatus === "absence").length,
    holidays: configurations.filter((configuration) => configuration.holiday?.isHoliday).length
  };
}

export function restoreHistoryEntry(entry: PaymentHistoryEntry, current: MonthData) {
  return saveMonthWithHistory(
    entry.year,
    entry.month,
    current,
    entry.before,
    `Restauração: ${entry.action}`
  );
}
