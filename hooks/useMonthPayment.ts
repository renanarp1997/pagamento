"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { getStorageKey } from "@/lib/date";
import { clearPeriod, normalizeMonthData, setDaysStatus, updateDay } from "@/lib/payments";
import { saveMonthWithHistory } from "@/lib/payment-history";
import type { DayConfiguration, DayStatus, MonthData, Period } from "@/types/payment";

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

  return {
    data,
    cycleDay,
    setDays,
    clearDays,
    saveDayConfiguration
  };
}
