import type { DayConfiguration, DayStatus, PaymentRates } from "../types/payment.ts";

export function getNextQuickStatus(status: DayStatus): DayStatus {
  if (status === "O") return "V";
  if (status === "V") return "M";
  return "O";
}

export function calculateDayValue(status: DayStatus, configuration: DayConfiguration | undefined, rates: PaymentRates) {
  let value = status === "V" ? rates.fullDay : status === "M" ? rates.halfDay : 0;

  if (configuration?.workStatus === "absence" && configuration.absence) {
    const absence = configuration.absence;
    if (absence.paymentType === "unpaid") value = 0;
    if (absence.paymentType === "paid") value = rates.fullDay;
    if (absence.paymentType === "custom_discount") value = rates.fullDay - (absence.customDiscount ?? 0);
  }

  if (configuration?.holiday?.isHoliday) {
    const holiday = configuration.holiday;
    const normal = holiday.workedStatus === "full" ? rates.fullDay : holiday.workedStatus === "half" ? rates.halfDay : 0;
    value = holiday.paymentType === "unpaid"
      ? 0
      : holiday.paymentType === "double"
        ? normal * 2
        : holiday.paymentType === "custom"
          ? holiday.customValue ?? 0
          : normal;
  }

  const override = configuration?.valueOverride;
  if (override && override.type !== "default") {
    if (override.type === "final_value") value = override.value ?? 0;
    if (override.type === "addition") value += override.value ?? 0;
    if (override.type === "discount") value -= override.value ?? 0;
  }

  return Math.max(0, value);
}
