"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { DEFAULT_PAYMENT_SETTINGS } from "@/lib/constants";
import { getEffectiveRates } from "@/lib/payments";
import type { PaymentSettings } from "@/types/payment";

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

function subscribeToHydration() {
  return () => {};
}

function parseSettings(raw: string | null): PaymentSettings | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<PaymentSettings> & { fullDay?: number; halfDay?: number };
    if (typeof value.fullDay === "number" && typeof value.halfDay === "number") {
      return {
        period: "daily",
        dailyValue: value.fullDay,
        halfDayValue: value.halfDay,
        periodValue: value.fullDay,
        workDaysPerPeriod: 1
      };
    }
    if (
      !["daily", "weekly", "fortnightly", "monthly"].includes(value.period ?? "") ||
      typeof value.dailyValue !== "number" ||
      typeof value.periodValue !== "number" ||
      typeof value.workDaysPerPeriod !== "number" ||
      value.dailyValue < 0 ||
      value.periodValue < 0 ||
      value.workDaysPerPeriod <= 0 ||
      (value.halfDayValue !== null && (typeof value.halfDayValue !== "number" || value.halfDayValue < 0))
    ) return null;
    if ((value.period === "daily" ? value.dailyValue : value.periodValue) <= 0) return null;
    return value as PaymentSettings;
  } catch {
    return null;
  }
}

export function usePaymentSettings() {
  const isReady = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
  const raw = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(STORAGE_KEY),
    () => null
  );
  const saved = useMemo(() => parseSettings(raw), [raw]);
  const save = useCallback((settings: PaymentSettings) => {
    const validated = parseSettings(JSON.stringify(settings));
    if (!validated) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
    window.dispatchEvent(new Event(SETTINGS_EVENT));
  }, []);

  return {
    settings: saved ?? { ...DEFAULT_PAYMENT_SETTINGS },
    rates: getEffectiveRates(saved ?? { ...DEFAULT_PAYMENT_SETTINGS }),
    isReady,
    isConfigured: saved !== null,
    save,
    restoreDefaults: () => save({ ...DEFAULT_PAYMENT_SETTINGS })
  };
}
