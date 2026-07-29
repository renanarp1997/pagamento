"use client";

import { useMemo, useSyncExternalStore } from "react";
import { parseStorageKey } from "@/lib/date";
import { normalizeMonthData } from "@/lib/payments";
import { PAYMENT_STORAGE_EVENT } from "@/hooks/useMonthPayment";
import type { MonthData, SavedMonth } from "@/types/payment";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PAYMENT_STORAGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PAYMENT_STORAGE_EVENT, onStoreChange);
  };
}

function getSavedMonthsSnapshot() {
  return Object.keys(window.localStorage)
    .filter((key) => parseStorageKey(key) !== null)
    .sort()
    .join("|");
}

export function useSavedMonths() {
  const snapshot = useSyncExternalStore(subscribe, getSavedMonthsSnapshot, () => "");

  return useMemo(
    () =>
      snapshot
        .split("|")
        .filter(Boolean)
        .map((key) => {
          const parsed = parseStorageKey(key);

          if (!parsed) {
            return null;
          }

          try {
            const data = normalizeMonthData(parsed.year, parsed.month, JSON.parse(window.localStorage.getItem(key) ?? "{}") as Partial<MonthData>);

            return {
              key,
              ...parsed,
              data
            };
          } catch {
            return null;
          }
        })
        .filter((month): month is SavedMonth => month !== null)
        .sort((a, b) => b.year - a.year || b.month - a.month),
    [snapshot]
  );
}
