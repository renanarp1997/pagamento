import { MONTHS } from "@/lib/constants";
import type { Period } from "@/types/payment";

export const WEEKDAY_ABBR = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"] as const;

export const WEEKDAY_NAMES = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado"
] as const;

export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function getPeriodDays(year: number, month: number, period: Period) {
  const lastDay = getDaysInMonth(year, month);
  const start = period === "first" ? 1 : 16;
  const end = period === "first" ? 15 : lastDay;

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function getStorageKey(year: number, month: number) {
  return `payments-${year}-${String(month).padStart(2, "0")}`;
}

export function parseStorageKey(key: string) {
  const match = /^payments-(\d{4})-(\d{2})$/.exec(key);

  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2])
  };
}

export function formatMonthYear(year: number, month: number) {
  return `${MONTHS[month - 1]} ${year}`;
}

export function getWeekdayIndex(year: number, month: number, day: number) {
  return new Date(year, month - 1, day).getDay();
}

export function getCalendarLeadingBlanks(year: number, month: number, firstVisibleDay: number) {
  return getWeekdayIndex(year, month, firstVisibleDay);
}

export function isToday(year: number, month: number, day: number) {
  const today = new Date();

  return today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day;
}

export function formatLongDate(year: number, month: number, day: number) {
  const weekday = WEEKDAY_NAMES[getWeekdayIndex(year, month, day)];
  const monthName = MONTHS[month - 1];

  return `${weekday}, ${day} de ${monthName} de ${year}`;
}
