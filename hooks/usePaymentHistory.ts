"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getStorageKey } from "@/lib/date";
import {
  PAYMENT_HISTORY_EVENT,
  restoreHistoryEntry,
  type PaymentHistoryEntry
} from "@/lib/payment-history";
import { normalizeMonthData } from "@/lib/payments";
import { PAYMENT_STORAGE_EVENT } from "@/hooks/useMonthPayment";
import type { MonthData } from "@/types/payment";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PAYMENT_HISTORY_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PAYMENT_HISTORY_EVENT, onStoreChange);
  };
}

function getSnapshot() {
  return window.localStorage.getItem("quinzena-payment-history-v1") ?? "[]";
}

export function usePaymentHistory() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  const entries = (() => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed as PaymentHistoryEntry[] : [];
    } catch {
      return [];
    }
  })();

  const restore = useCallback((entry: PaymentHistoryEntry) => {
    const key = getStorageKey(entry.year, entry.month);
    let current: MonthData;
    try {
      current = normalizeMonthData(entry.year, entry.month, JSON.parse(window.localStorage.getItem(key) ?? "{}"));
    } catch {
      current = normalizeMonthData(entry.year, entry.month);
    }
    restoreHistoryEntry(entry, current);
    window.dispatchEvent(new Event(PAYMENT_STORAGE_EVENT));
  }, []);

  return { entries, restore };
}
