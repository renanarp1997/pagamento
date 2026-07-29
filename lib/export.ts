import { FULL_DAY_VALUE, HALF_DAY_VALUE, MONTHS, STATUS_LABELS } from "@/lib/constants";
import { formatMonthYear, getPeriodDays, WEEKDAY_ABBR } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { summarizeMonth } from "@/lib/payments";
import type { DayStatus, MonthData, PeriodSummary } from "@/types/payment";

export type DayEntry = {
  day: number;
  date: string;
  weekday: string;
  status: DayStatus;
  statusLabel: "Inteiro" | "Meio" | "Folga";
  value: number;
  emoji: string;
};

export type ExportReport = {
  monthYear: string;
  monthName: string;
  year: number;
  month: number;
  first: PeriodSummary;
  second: PeriodSummary;
  monthlyTotal: number;
  monthlyWorkedDays: number;
  monthlyTotalDays: number;
  monthlyWorkedPercentage: number;
  monthlyAvgPerWorkedDay: number;
  monthlyAvgPerCalendarDay: number;
  days: DayEntry[];
};

const STATUS_VALUE: Record<DayStatus, number> = {
  V: FULL_DAY_VALUE,
  M: HALF_DAY_VALUE,
  O: 0
};

const CSV_STATUS: Record<DayStatus, DayEntry["statusLabel"]> = {
  V: "Inteiro",
  M: "Meio",
  O: "Folga"
};

export function buildExportReport(year: number, month: number, data: MonthData): ExportReport {
  const summary = summarizeMonth(data);
  const monthlyWorkedDays = summary.first.workedDays + summary.second.workedDays;
  const monthlyTotalDays = summary.first.totalDays + summary.second.totalDays;

  return {
    monthYear: formatMonthYear(year, month),
    monthName: MONTHS[month - 1],
    year,
    month,
    first: summary.first,
    second: summary.second,
    monthlyTotal: summary.monthlyTotal,
    monthlyWorkedDays,
    monthlyTotalDays,
    monthlyWorkedPercentage: monthlyTotalDays === 0 ? 0 : Math.round((monthlyWorkedDays / monthlyTotalDays) * 100),
    monthlyAvgPerWorkedDay: monthlyWorkedDays === 0 ? 0 : summary.monthlyTotal / monthlyWorkedDays,
    monthlyAvgPerCalendarDay: monthlyTotalDays === 0 ? 0 : summary.monthlyTotal / monthlyTotalDays,
    days: buildDayEntries(year, month, data)
  };
}

function buildDayEntries(year: number, month: number, data: MonthData): DayEntry[] {
  return (["first", "second"] as const).flatMap((period) =>
    getPeriodDays(year, month, period).map((day) => {
      const status = data[period][day] ?? "O";

      return {
        day,
        date: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`,
        weekday: WEEKDAY_ABBR[new Date(year, month - 1, day).getDay()],
        status,
        statusLabel: CSV_STATUS[status],
        value: STATUS_VALUE[status],
        emoji: status === "V" ? "🟢" : status === "M" ? "🟡" : "⚪"
      };
    })
  );
}

export function buildCopyText(report: ExportReport) {
  return [
    "PAGAMENTO QUINZENAL",
    report.monthYear,
    "",
    "Primeira quinzena",
    `Dias trabalhados: ${report.first.workedDays}/${report.first.totalDays}`,
    `Inteiros: ${report.first.fullDays} (${formatCurrency(report.first.fullTotal)})`,
    `Meios: ${report.first.halfDays} (${formatCurrency(report.first.halfTotal)})`,
    `Folgas: ${report.first.daysOff}`,
    `Total: ${formatCurrency(report.first.total)}`,
    "",
    "Segunda quinzena",
    `Dias trabalhados: ${report.second.workedDays}/${report.second.totalDays}`,
    `Inteiros: ${report.second.fullDays} (${formatCurrency(report.second.fullTotal)})`,
    `Meios: ${report.second.halfDays} (${formatCurrency(report.second.halfTotal)})`,
    `Folgas: ${report.second.daysOff}`,
    `Total: ${formatCurrency(report.second.total)}`,
    "",
    `TOTAL MENSAL: ${formatCurrency(report.monthlyTotal)}`
  ].join("\n");
}

export function buildCsvContent(report: ExportReport) {
  const fullDays = report.first.fullDays + report.second.fullDays;
  const halfDays = report.first.halfDays + report.second.halfDays;
  const daysOff = report.first.daysOff + report.second.daysOff;
  const rows: Array<Array<string | number>> = [
    ["Date", "Weekday", "Status", "Value"],
    ...report.days.map((day) => [day.date, day.weekday, day.statusLabel, day.value]),
    [],
    ["Total Inteiros", "", "", fullDays],
    ["Total Meios", "", "", halfDays],
    ["Total Folgas", "", "", daysOff],
    ["Total Geral", "", "", report.monthlyTotal]
  ];

  return `\uFEFF${rows.map((row) => row.map((cell) => escapeCsvCell(String(cell))).join(",")).join("\r\n")}`;
}

function escapeCsvCell(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function getExportFilename(report: ExportReport, extension: "pdf" | "csv" | "png") {
  const monthSlug = report.monthName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return `pagamento-${monthSlug}-${report.year}.${extension}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export { FULL_DAY_VALUE, HALF_DAY_VALUE, STATUS_LABELS };
