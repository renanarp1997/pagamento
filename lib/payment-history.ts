import { getStorageKey } from "@/lib/date";
import type { MonthData } from "@/types/payment";

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
    before
  };
  const history = [entry, ...readPaymentHistory()].slice(0, MAX_HISTORY_ENTRIES);

  window.localStorage.setItem(PAYMENT_HISTORY_KEY, JSON.stringify(history));
  window.localStorage.setItem(getStorageKey(year, month), JSON.stringify(after));
  window.dispatchEvent(new Event(PAYMENT_HISTORY_EVENT));
  return true;
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
