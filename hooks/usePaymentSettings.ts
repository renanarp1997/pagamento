"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { DEFAULT_PAYMENT_RATES } from "@/lib/constants";
import type { PaymentRates } from "@/types/payment";

const STORAGE_KEY = "quinzena-payment-settings";
const SETTINGS_EVENT = "quinzena-payment-settings-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(SETTINGS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SETTINGS_EVENT, onChange);
  };
}

function parseSettings(raw: string | null): PaymentRates | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<PaymentRates>;
    if (typeof value.fullDay !== "number" || value.fullDay <= 0 || typeof value.halfDay !== "number" || value.halfDay < 0) return null;
    return { fullDay: value.fullDay, halfDay: value.halfDay };
  } catch {
    return null;
  }
}

export function usePaymentSettings() {
  const raw = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(STORAGE_KEY),
    () => null
  );
  const saved = useMemo(() => parseSettings(raw), [raw]);
  const save = useCallback((rates: PaymentRates) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
    window.dispatchEvent(new Event(SETTINGS_EVENT));
  }, []);

  return {
    rates: saved ?? DEFAULT_PAYMENT_RATES,
    isConfigured: saved !== null,
    save,
    restoreDefaults: () => save({ ...DEFAULT_PAYMENT_RATES })
  };
}
