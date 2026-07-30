"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { getStorageKey } from "@/lib/date";
import { clearPeriod, normalizeMonthData, setDaysStatus, updateDay } from "@/lib/payments";
import { saveMonthWithHistory } from "@/lib/payment-history";
import { PAYMENT_HISTORY_EVENT, PAYMENT_HISTORY_KEY } from "@/lib/payment-history";
import { applyBulkUpdate, clearCalendarDays, duplicateMonthData } from "@/lib/data-actions";
import type { BulkDayUpdate, DayConfiguration, DayStatus, MonthData, Period, UndoAction } from "@/types/payment";

export const PAYMENT_STORAGE_EVENT = "quinzena-payments-change";

function readMonthData(year: number, month: number, raw: string | null): MonthData {

  if (!raw) {
    return normalizeMonthData(year, month);
  }

  try {
    return normalizeMonthData(year, month, JSON.parse(raw) as Partial<MonthData>);
  } catch {
    return normalizeMonthData(year, month);
  }
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PAYMENT_STORAGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PAYMENT_STORAGE_EVENT, onStoreChange);
  };
}

export function useMonthPayment(year: number, month: number) {
  const storageKey = useMemo(() => getStorageKey(year, month), [year, month]);
  const raw = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(storageKey),
    () => null
  );
  const data = useMemo(() => readMonthData(year, month, raw), [month, raw, year]);

  const cycleDay = useCallback((period: Period, day: number) => {
    const current = readMonthData(year, month, window.localStorage.getItem(storageKey));
    const updated = updateDay(current, period, day);

    if (saveMonthWithHistory(year, month, current, updated, `Alteração do dia ${day}`)) {
      window.dispatchEvent(new Event(PAYMENT_STORAGE_EVENT));
    }
  }, [month, storageKey, year]);

  const setDays = useCallback((period: Period, days: number[], status: DayStatus) => {
    const current = readMonthData(year, month, window.localStorage.getItem(storageKey));
    const updated = setDaysStatus(current, period, days, status);

    const label = status === "V" ? "dia inteiro" : status === "M" ? "meio período" : "folga";
    if (saveMonthWithHistory(year, month, current, updated, `${days.length} dia(s) marcado(s) como ${label}`)) {
      window.dispatchEvent(new Event(PAYMENT_STORAGE_EVENT));
    }
  }, [month, storageKey, year]);

  const clearDays = useCallback((period: Period) => {
    const current = readMonthData(year, month, window.localStorage.getItem(storageKey));
    const updated = clearPeriod(current, period);

    const label = period === "first" ? "1ª quinzena" : "2ª quinzena";
    if (saveMonthWithHistory(year, month, current, updated, `Limpeza da ${label}`)) {
      window.dispatchEvent(new Event(PAYMENT_STORAGE_EVENT));
    }
  }, [month, storageKey, year]);

  const clearRange = useCallback((days: number[], action: string): UndoAction | null => {
    const current = readMonthData(year, month, window.localStorage.getItem(storageKey));
    const updated = clearCalendarDays(current, days, year, month);
    const undo: UndoAction = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      year,
      month,
      previousState: current,
      previousHistory: window.localStorage.getItem(PAYMENT_HISTORY_KEY)
    };
    if (!saveMonthWithHistory(year, month, current, updated, action)) return null;
    window.dispatchEvent(new Event(PAYMENT_STORAGE_EVENT));
    return undo;
  }, [month, storageKey, year]);

  const undoClear = useCallback((undo: UndoAction) => {
    if (undo.year !== year || undo.month !== month) return false;
    window.localStorage.setItem(storageKey, JSON.stringify(undo.previousState));
    if (undo.previousHistory === null) window.localStorage.removeItem(PAYMENT_HISTORY_KEY);
    else window.localStorage.setItem(PAYMENT_HISTORY_KEY, undo.previousHistory);
    window.dispatchEvent(new Event(PAYMENT_HISTORY_EVENT));
    window.dispatchEvent(new Event(PAYMENT_STORAGE_EVENT));
    return true;
  }, [month, storageKey, year]);

  const saveDayConfiguration = useCallback((isoDate: string, configuration: DayConfiguration | null) => {
    const current = readMonthData(year, month, window.localStorage.getItem(storageKey));
    const daySettings = { ...current.daySettings };
    if (configuration) daySettings[isoDate] = configuration;
    else delete daySettings[isoDate];
    const updated = { ...current, daySettings };
    if (saveMonthWithHistory(year, month, current, updated, `Configuração do dia ${isoDate.slice(-2)}`)) {
      window.dispatchEvent(new Event(PAYMENT_STORAGE_EVENT));
    }
  }, [month, storageKey, year]);

  const updateManyDays = useCallback((days: number[], update: BulkDayUpdate) => {
    const current = readMonthData(year, month, window.localStorage.getItem(storageKey));
    const updated = applyBulkUpdate(current, days, year, month, update);
    if (saveMonthWithHistory(year, month, current, updated, `Edição em lote de ${days.length} dia(s)`)) window.dispatchEvent(new Event(PAYMENT_STORAGE_EVENT));
  }, [month, storageKey, year]);

  const duplicatePreviousMonth = useCallback(() => {
    const previousDate = new Date(year, month - 2, 1);
    const previousYear = previousDate.getFullYear();
    const previousMonth = previousDate.getMonth() + 1;
    const previousKey = getStorageKey(previousYear, previousMonth);
    const rawPrevious = window.localStorage.getItem(previousKey);
    if (!rawPrevious) return false;
    const source = readMonthData(previousYear, previousMonth, rawPrevious);
    const current = readMonthData(year, month, window.localStorage.getItem(storageKey));
    const copied = duplicateMonthData(source, normalizeMonthData(year, month), year, month);
    if (saveMonthWithHistory(year, month, current, copied, `Cópia de ${String(previousMonth).padStart(2, "0")}/${previousYear}`)) {
      window.dispatchEvent(new Event(PAYMENT_STORAGE_EVENT));
      return true;
    }
    return false;
  }, [month, storageKey, year]);

  return {
    data,
    cycleDay,
    setDays,
    clearDays,
    clearRange,
    undoClear,
    saveDayConfiguration,
    updateManyDays,
    duplicatePreviousMonth
  };
}
