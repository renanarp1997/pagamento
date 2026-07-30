import { MONTHS, STATUS_LABELS } from "@/lib/constants";
import { formatMonthYear, getPeriodDays, WEEKDAY_ABBR } from "@/lib/date";
import { formatCurrency } from "@/lib/format";
import { calculateDayValue, summarizeMonth } from "@/lib/payments";
import { getBrazilianHoliday, toIsoDate } from "@/lib/holidays";
import type { DayStatus, MonthData, PaymentRates, PeriodSummary } from "@/types/payment";

export type DayEntry = {
  day: number;
  date: string;
  weekday: string;
  status: DayStatus;
  statusLabel: "Inteiro" | "Meio" | "Folga";
  value: number;
  emoji: string;
  details?: string[];
};

export type ExportReport = {
  monthYear: string;
  monthName: string;
  year: number;
  month: number;
  rates: PaymentRates;
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

const CSV_STATUS: Record<DayStatus, DayEntry["statusLabel"]> = {
  V: "Inteiro",
  M: "Meio",
  O: "Folga"
};

export function buildExportReport(year: number, month: number, data: MonthData, rates: PaymentRates): ExportReport {
  const summary = summarizeMonth(data, rates, year, month);
  const monthlyWorkedDays = summary.first.workedDays + summary.second.workedDays;
  const monthlyTotalDays = summary.first.totalDays + summary.second.totalDays;

  return {
    monthYear: formatMonthYear(year, month),
    monthName: MONTHS[month - 1],
    year,
    month,
    rates,
    first: summary.first,
    second: summary.second,
    monthlyTotal: summary.monthlyTotal,
    monthlyWorkedDays,
    monthlyTotalDays,
    monthlyWorkedPercentage: monthlyTotalDays === 0 ? 0 : Math.round((monthlyWorkedDays / monthlyTotalDays) * 100),
    monthlyAvgPerWorkedDay: monthlyWorkedDays === 0 ? 0 : summary.monthlyTotal / monthlyWorkedDays,
    monthlyAvgPerCalendarDay: monthlyTotalDays === 0 ? 0 : summary.monthlyTotal / monthlyTotalDays,
    days: buildDayEntries(year, month, data, rates)
  };
}

function buildDayEntries(year: number, month: number, data: MonthData, rates: PaymentRates): DayEntry[] {
  return (["first", "second"] as const).flatMap((period) =>
    getPeriodDays(year, month, period).map((day) => {
      const status = data[period][day] ?? "O";
      const iso = toIsoDate(year, month, day);
      const configuration = data.daySettings[iso];
      const automaticHoliday = getBrazilianHoliday(year, month, day);
      const details = [
        configuration?.observation ? `Observação: ${configuration.observation}` : "",
        configuration?.workStatus === "absence" ? `Falta${configuration.absence?.reason ? ` — Motivo: ${configuration.absence.reason}` : ""}` : "",
        automaticHoliday || configuration?.holiday?.isHoliday ? `Feriado: ${configuration?.holiday?.name ?? automaticHoliday?.name}${configuration?.holiday ? ` — Pagamento: ${configuration.holiday.paymentType}` : ""}` : "",
        configuration?.valueOverride ? `Alteração: ${configuration.valueOverride.type} ${configuration.valueOverride.value ?? 0}` : ""
      ].filter(Boolean);

      return {
        day,
        date: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`,
        weekday: WEEKDAY_ABBR[new Date(year, month - 1, day).getDay()],
        status,
        statusLabel: CSV_STATUS[status],
        value: calculateDayValue(status, configuration, rates),
        emoji: status === "V" ? "🟢" : status === "M" ? "🟡" : "⚪"
        ,details
      };
    })
  );
}

export function buildCopyText(report: ExportReport) {
  return [
    "ONE BLOND",
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
    `TOTAL MENSAL: ${formatCurrency(report.monthlyTotal)}`,
    "",
    ...report.days.filter((day) => day.details?.length).flatMap((day) => [
      `${day.date} — ${day.details?.join(" | ")}`,
      `Valor: ${formatCurrency(day.value)}`
    ])
  ].join("\n");
}

export function buildCsvContent(report: ExportReport) {
  const fullDays = report.first.fullDays + report.second.fullDays;
  const halfDays = report.first.halfDays + report.second.halfDays;
  const daysOff = report.first.daysOff + report.second.daysOff;
  const rows: Array<Array<string | number>> = [
    ["Data", "Dia da semana", "Quinzena", "Status", "Detalhes", "Valor (R$)"],
    ...report.days.map((day) => [
      day.date,
      day.weekday,
      day.day <= 15 ? "1ª quinzena" : "2ª quinzena",
      day.statusLabel,
      day.details?.join(" | ") ?? "",
      formatCsvNumber(day.value)
    ]),
    [],
    ["Resumo", "", "", "", "", ""],
    ["Total de dias inteiros", "", "", "", "", fullDays],
    ["Total de meios períodos", "", "", "", "", halfDays],
    ["Total de folgas", "", "", "", "", daysOff],
    ["Total da 1ª quinzena", "", "", "", "", formatCsvNumber(report.first.total)],
    ["Total da 2ª quinzena", "", "", "", "", formatCsvNumber(report.second.total)],
    ["Total geral", "", "", "", "", formatCsvNumber(report.monthlyTotal)]
  ];

  return `\uFEFFsep=;\r\n${rows.map((row) => row.map((cell) => escapeCsvCell(String(cell), ";")).join(";")).join("\r\n")}`;
}

function formatCsvNumber(value: number) {
  return value.toFixed(2).replace(".", ",");
}

function escapeCsvCell(value: string, delimiter: string) {
  return value.includes(delimiter) || /["\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
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

export { STATUS_LABELS };
