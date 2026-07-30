import type { DayConfiguration, MonthData, PaymentSettings } from "../types/payment.ts";

export const BACKUP_VERSION = 1;
export const SETTINGS_KEY = "quinzena-payment-settings";
export const HISTORY_KEY = "quinzena-payment-history-v1";
export const THEME_KEY = "quinzena-theme";

export type BackupCalendarEntry = { key: string; year: number; month: number; data: MonthData };
export type OneBlondBackup = {
  application: "One Blond";
  backupVersion: number;
  exportedAt: string;
  settings: PaymentSettings | null;
  calendarEntries: BackupCalendarEntry[];
  history: unknown[];
  customHolidays: Array<{ date: string; configuration: DayConfiguration }>;
  preferences: Record<string, unknown>;
};
export type StorageLike = Pick<Storage, "length" | "key" | "getItem" | "setItem" | "removeItem">;

export function createBackup(storage: StorageLike, now = new Date()): OneBlondBackup {
  const calendarEntries: BackupCalendarEntry[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    const match = key?.match(/^payments-(\d{4})-(\d{2})$/);
    if (!key || !match) continue;
    const data = safeJson(storage.getItem(key), null) as MonthData | null;
    if (data) calendarEntries.push({ key, year: Number(match[1]), month: Number(match[2]), data });
  }
  calendarEntries.sort((a, b) => a.year - b.year || a.month - b.month);
  return {
    application: "One Blond",
    backupVersion: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    settings: safeJson(storage.getItem(SETTINGS_KEY), null) as PaymentSettings | null,
    calendarEntries,
    history: safeJson(storage.getItem(HISTORY_KEY), []) as unknown[],
    customHolidays: calendarEntries.flatMap((entry) => Object.entries(entry.data.daySettings ?? {})
      .filter(([, configuration]) => configuration.holiday?.isHoliday)
      .map(([date, configuration]) => ({ date, configuration }))),
    preferences: { theme: storage.getItem(THEME_KEY) }
  };
}

export function migrateBackup(input: unknown): OneBlondBackup {
  if (!input || typeof input !== "object") throw new Error("Arquivo de backup inválido.");
  const source = input as Partial<OneBlondBackup> & { months?: BackupCalendarEntry[] };
  if (source.application !== "One Blond") throw new Error("Este arquivo não pertence ao One Blond.");
  const version = Number(source.backupVersion ?? 0);
  if (version > BACKUP_VERSION) throw new Error("Este backup foi criado por uma versão mais recente.");
  const entries = Array.isArray(source.calendarEntries) ? source.calendarEntries : Array.isArray(source.months) ? source.months : [];
  return {
    application: "One Blond",
    backupVersion: BACKUP_VERSION,
    exportedAt: typeof source.exportedAt === "string" ? source.exportedAt : new Date().toISOString(),
    settings: source.settings && typeof source.settings === "object" ? source.settings as PaymentSettings : null,
    calendarEntries: entries.filter(isCalendarEntry),
    history: Array.isArray(source.history) ? source.history : [],
    customHolidays: Array.isArray(source.customHolidays) ? source.customHolidays : [],
    preferences: source.preferences && typeof source.preferences === "object" ? source.preferences : {}
  };
}

export function importBackup(storage: StorageLike, backup: OneBlondBackup, mode: "merge" | "replace") {
  if (mode === "replace") {
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && isOwnedKey(key)) keys.push(key);
    }
    keys.forEach((key) => storage.removeItem(key));
  }
  backup.calendarEntries.forEach((entry) => {
    const current = mode === "merge" ? safeJson(storage.getItem(entry.key), null) as MonthData | null : null;
    storage.setItem(entry.key, JSON.stringify(current ? mergeMonthData(current, entry.data) : entry.data));
  });
  if (backup.settings && (mode === "replace" || !storage.getItem(SETTINGS_KEY))) storage.setItem(SETTINGS_KEY, JSON.stringify(backup.settings));
  const currentHistory = mode === "merge" ? safeJson(storage.getItem(HISTORY_KEY), []) as unknown[] : [];
  storage.setItem(HISTORY_KEY, JSON.stringify(mode === "merge" ? [...backup.history, ...currentHistory] : backup.history));
  const theme = backup.preferences.theme;
  if (typeof theme === "string" && (mode === "replace" || !storage.getItem(THEME_KEY))) storage.setItem(THEME_KEY, theme);
}

export function countBackupRecords(backup: OneBlondBackup) {
  return backup.calendarEntries.reduce((total, entry) => total + Object.keys(entry.data.first).length + Object.keys(entry.data.second).length, 0);
}

function mergeMonthData(current: MonthData, incoming: MonthData): MonthData {
  const mergePeriod = (a: MonthData["first"], b: MonthData["first"]) =>
    Object.fromEntries(Object.keys({ ...b, ...a }).map((day) => {
      const value = a[Number(day)];
      return [Number(day), value && value !== "O" ? value : b[Number(day)] ?? "O"];
    }));
  return { first: mergePeriod(current.first, incoming.first), second: mergePeriod(current.second, incoming.second), daySettings: { ...incoming.daySettings, ...current.daySettings } };
}

function isCalendarEntry(value: unknown): value is BackupCalendarEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<BackupCalendarEntry>;
  return typeof entry.key === "string" && /^payments-\d{4}-\d{2}$/.test(entry.key) &&
    typeof entry.year === "number" && typeof entry.month === "number" &&
    Boolean(entry.data && typeof entry.data === "object" && entry.data.first && entry.data.second && entry.data.daySettings);
}

function isOwnedKey(key: string) {
  return /^payments-\d{4}-\d{2}$/.test(key) || [SETTINGS_KEY, HISTORY_KEY, THEME_KEY].includes(key);
}

function safeJson(raw: string | null, fallback: unknown) {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
