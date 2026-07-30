import assert from "node:assert/strict";
import test from "node:test";
import { calculateDayValue, getNextQuickStatus } from "../lib/day-value.ts";
import type { DayConfiguration, PaymentRates } from "../types/payment.ts";

const rates: PaymentRates = { fullDay: 90, halfDay: 45 };

function configuration(partial: Partial<DayConfiguration>): DayConfiguration {
  return { workStatus: "off", ...partial };
}

test("clique rápido percorre folga, inteiro, meio e folga", () => {
  assert.equal(getNextQuickStatus("O"), "V");
  assert.equal(getNextQuickStatus("V"), "M");
  assert.equal(getNextQuickStatus("M"), "O");
});

test("falta não remunerada e remunerada", () => {
  assert.equal(calculateDayValue("V", configuration({ workStatus: "absence", absence: { paymentType: "unpaid" } }), rates), 0);
  assert.equal(calculateDayValue("O", configuration({ workStatus: "absence", absence: { paymentType: "paid" } }), rates), 90);
});

test("feriado trabalhado dobrado e personalizado", () => {
  assert.equal(calculateDayValue("O", configuration({ holiday: { isHoliday: true, workedStatus: "full", paymentType: "double" } }), rates), 180);
  assert.equal(calculateDayValue("O", configuration({ holiday: { isHoliday: true, workedStatus: "half", paymentType: "custom", customValue: 130 } }), rates), 130);
});

test("alterações de valor são aplicadas por último", () => {
  assert.equal(calculateDayValue("V", configuration({ valueOverride: { type: "final_value", value: 120 } }), rates), 120);
  assert.equal(calculateDayValue("V", configuration({ valueOverride: { type: "addition", value: 20 } }), rates), 110);
  assert.equal(calculateDayValue("V", configuration({ valueOverride: { type: "discount", value: 10 } }), rates), 80);
});

test("resultado nunca fica negativo", () => {
  assert.equal(calculateDayValue("V", configuration({ valueOverride: { type: "discount", value: 200 } }), rates), 0);
});
