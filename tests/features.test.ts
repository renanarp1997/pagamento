import assert from "node:assert/strict";
import test from "node:test";
import { buildAnnualSummary } from "../lib/annual-summary.ts";
import { createBackup, importBackup, migrateBackup, SETTINGS_KEY, type StorageLike } from "../lib/backup.ts";
import { applyBulkUpdate, clearCalendarDays, duplicateMonthData, matchesSavedMonth } from "../lib/data-actions.ts";
import type { MonthData } from "../types/payment.ts";

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const month: MonthData = {
  first: { 1: "V", 2: "M" },
  second: { 16: "O" },
  daySettings: {
    "2026-07-01": { workStatus: "full", observation: "Cliente pediu hora extra" },
    "2026-07-02": { workStatus: "absence", absence: { paymentType: "unpaid", reason: "Consulta" } },
    "2026-07-16": { workStatus: "off", holiday: { isHoliday: true, name: "Feriado local", workedStatus: "not_worked", paymentType: "unpaid" } }
  }
};

test("Undo restaura exatamente o estado anterior à limpeza", () => {
  const previous = structuredClone(month);
  const cleared = clearCalendarDays(month, [1, 2], 2026, 7);
  assert.equal(cleared.first[1], "O");
  assert.equal(cleared.daySettings["2026-07-01"], undefined);
  assert.deepEqual(previous, month);
});

test("backup completo inclui calendário, configurações, histórico e preferências", () => {
  const storage = new MemoryStorage();
  storage.setItem("payments-2026-07", JSON.stringify(month));
  storage.setItem(SETTINGS_KEY, JSON.stringify({ period: "daily", dailyValue: 94, halfDayValue: 45, periodValue: 94, workDaysPerPeriod: 1 }));
  storage.setItem("quinzena-payment-history-v1", JSON.stringify([{ id: "1" }]));
  storage.setItem("quinzena-theme", "dark");
  const backup = createBackup(storage, new Date("2026-07-30T12:00:00Z"));
  assert.equal(backup.calendarEntries.length, 1);
  assert.equal(backup.history.length, 1);
  assert.equal(backup.customHolidays.length, 1);
  assert.equal(backup.preferences.theme, "dark");
});

test("importação mescla sem apagar dados atuais", () => {
  const storage = new MemoryStorage();
  storage.setItem("payments-2026-07", JSON.stringify({ ...month, first: { 1: "O", 2: "V" } }));
  const backup = createBackup(Object.assign(new MemoryStorage(), {}));
  backup.calendarEntries = [{ key: "payments-2026-07", year: 2026, month: 7, data: month }];
  importBackup(storage, backup, "merge");
  const merged = JSON.parse(storage.getItem("payments-2026-07")!) as MonthData;
  assert.equal(merged.first[1], "V");
  assert.equal(merged.first[2], "V");
});

test("substituição remove dados antigos do One Blond", () => {
  const storage = new MemoryStorage();
  storage.setItem("payments-2025-01", JSON.stringify(month));
  const backup = createBackup(new MemoryStorage());
  backup.calendarEntries = [{ key: "payments-2026-07", year: 2026, month: 7, data: month }];
  importBackup(storage, backup, "replace");
  assert.equal(storage.getItem("payments-2025-01"), null);
  assert.ok(storage.getItem("payments-2026-07"));
});

test("migração aceita formato antigo sem apagar o conteúdo", () => {
  const migrated = migrateBackup({ application: "One Blond", backupVersion: 0, months: [{ key: "payments-2026-07", year: 2026, month: 7, data: month }] });
  assert.equal(migrated.backupVersion, 1);
  assert.equal(migrated.calendarEntries.length, 1);
});

test("busca e filtros encontram observação, falta e feriado", () => {
  assert.equal(matchesSavedMonth(month, "julho 2026", "hora extra", []), true);
  assert.equal(matchesSavedMonth(month, "julho 2026", "consulta", ["absence"]), true);
  assert.equal(matchesSavedMonth(month, "julho 2026", "feriado local", ["holiday"]), true);
  assert.equal(matchesSavedMonth(month, "julho 2026", "inexistente", []), false);
});

test("seleção múltipla aplica status, observação e valor", () => {
  const updated = applyBulkUpdate(month, [1, 2], 2026, 7, { status: "V", observation: "Equipe A", finalValue: 120 }, "agora");
  assert.equal(updated.first[2], "V");
  assert.equal(updated.daySettings["2026-07-01"].observation, "Equipe A");
  assert.deepEqual(updated.daySettings["2026-07-02"].valueOverride, { type: "final_value", value: 120 });
});

test("duplicação remapeia datas e respeita os dias do destino", () => {
  const target: MonthData = { first: { 1: "O", 2: "O" }, second: { 16: "O" }, daySettings: {} };
  const duplicated = duplicateMonthData(month, target, 2026, 8);
  assert.equal(duplicated.first[1], "V");
  assert.ok(duplicated.daySettings["2026-08-01"]);
  assert.equal(duplicated.daySettings["2026-07-01"], undefined);
});

test("resumo anual calcula totais, média e extremos", () => {
  const summary = buildAnnualSummary([
    { month: 1, total: 100, workedDays: 2, absences: 1, holidays: 0 },
    { month: 2, total: 300, workedDays: 4, absences: 0, holidays: 1 }
  ]);
  assert.equal(summary.total, 400);
  assert.equal(summary.average, 200);
  assert.equal(summary.highest?.month, 2);
  assert.equal(summary.lowest?.month, 1);
});
