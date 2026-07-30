import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "@/lib/format";
import type { DayEntry, ExportReport } from "@/lib/export";

type Pdf = jsPDF;
type RGB = [number, number, number];

const C = {
  ink: [15, 23, 42] as RGB,
  muted: [100, 116, 139] as RGB,
  line: [226, 232, 240] as RGB,
  soft: [248, 250, 252] as RGB,
  green: [5, 150, 105] as RGB,
  greenSoft: [236, 253, 245] as RGB,
  yellow: [217, 119, 6] as RGB,
  yellowSoft: [255, 251, 235] as RGB,
  white: [255, 255, 255] as RGB
};

const PAGE_W = 210;
const M = 16;
const CONTENT_W = PAGE_W - M * 2;

export async function generatePremiumPdf(report: ExportReport) {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const generated = new Date();
  const stats = calculateStatistics(report);

  drawHeader(pdf, report, generated);
  drawHero(pdf, report, 48);
  drawSummaryCards(pdf, report, 91);
  drawPeriodCards(pdf, report, 154);
  drawCalendar(pdf, report, 220);

  pdf.addPage();
  drawSectionHeading(pdf, "Registro de trabalho", "Detalhamento diário de pagamentos", 18);
  drawWorkLog(pdf, report, 32);

  pdf.addPage();
  drawSectionHeading(pdf, "Análise financeira", "Composição da receita e indicadores operacionais", 18);
  drawPaymentBreakdown(pdf, report, 34);
  drawStatistics(pdf, report, stats, 100);
  drawCharts(pdf, report, stats, 171);

  pdf.addPage();
  drawSectionHeading(pdf, "Insights do mês", "Leituras automáticas baseadas na sua atividade", 18);
  drawInsights(pdf, report, stats, 38);
  drawMethodology(pdf, report, 118);

  addFooters(pdf, generated);
  return pdf;
}

function drawHeader(pdf: Pdf, report: ExportReport, generated: Date) {
  pdf.setFillColor(...C.ink);
  pdf.roundedRect(M, 14, CONTENT_W, 26, 4, 4, "F");
  pdf.setFillColor(...C.green);
  pdf.circle(25, 27, 5, "F");
  pdf.setTextColor(...C.white);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6);
  pdf.text("QC", 25, 28.8, { align: "center" });
  pdf.setFontSize(14);
  pdf.text("ONE BLOND", 35, 24);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(203, 213, 225);
  pdf.text("Relatório Financeiro", 35, 31);

  pdf.setFontSize(7);
  pdf.text(`${report.monthName}  •  ${report.year}`, 194, 22, { align: "right" });
  pdf.text(`Gerado em ${formatDate(generated)} às ${formatTime(generated)}`, 194, 28, { align: "right" });
  pdf.text("v1.0  •  One Blond", 194, 34, { align: "right" });
}

function drawHero(pdf: Pdf, report: ExportReport, y: number) {
  card(pdf, M, y, CONTENT_W, 35, C.greenSoft);
  label(pdf, "TOTAL DO MÊS", M + 8, y + 9, C.green);
  text(pdf, formatCurrency(report.monthlyTotal), M + 8, y + 23, 25, "bold", C.green);
  text(pdf, `${report.monthlyWorkedDays} dias trabalhados de ${report.monthlyTotalDays}`, 194, y + 13, 9, "bold", C.ink, "right");
  text(pdf, `${report.monthlyWorkedPercentage}%`, 194, y + 22, 14, "bold", C.green, "right");
  progress(pdf, 126, y + 27, 68, report.monthlyWorkedPercentage, C.green);
}

function drawSummaryCards(pdf: Pdf, report: ExportReport, y: number) {
  drawSectionHeading(pdf, "Resumo executivo", "Visão consolidada do mês", y);
  const full = report.first.fullDays + report.second.fullDays;
  const half = report.first.halfDays + report.second.halfDays;
  const off = report.first.daysOff + report.second.daysOff;
  const cards = [
    { title: "Dias inteiros", value: String(full), detail: `${full} × ${formatCurrency(report.rates.fullDay)}`, total: formatCurrency(full * report.rates.fullDay), tone: C.green },
    { title: "Meios períodos", value: String(half), detail: `${half} × ${formatCurrency(report.rates.halfDay)}`, total: formatCurrency(half * report.rates.halfDay), tone: C.yellow },
    { title: "Dias de folga", value: String(off), detail: "Sem remuneração", total: "R$ 0", tone: C.muted },
    { title: "Média diária", value: formatCurrency(report.monthlyAvgPerWorkedDay), detail: "Por dia trabalhado", total: "", tone: C.ink }
  ];
  const gap = 3;
  const w = (CONTENT_W - gap * 3) / 4;
  cards.forEach((item, index) => {
    const x = M + index * (w + gap);
    card(pdf, x, y + 10, w, 42);
    pdf.setFillColor(...item.tone);
    pdf.circle(x + 7, y + 18, 2.2, "F");
    label(pdf, item.title, x + 12, y + 19.5, C.muted);
    text(pdf, item.value, x + 6, y + 31, index === 3 ? 13 : 18, "bold", C.ink);
    text(pdf, item.detail, x + 6, y + 38, 7, "normal", C.muted);
    if (item.total) text(pdf, item.total, x + 6, y + 47, 9, "bold", item.tone);
  });
}

function drawPeriodCards(pdf: Pdf, report: ExportReport, y: number) {
  drawSectionHeading(pdf, "Detalhes por quinzena", "Comparativo de produtividade e receita", y);
  const gap = 5;
  const w = (CONTENT_W - gap) / 2;
  [
    { name: "Primeira Quinzena", summary: report.first },
    { name: "Segunda Quinzena", summary: report.second }
  ].forEach((period, index) => {
    const x = M + index * (w + gap);
    card(pdf, x, y + 10, w, 48);
    text(pdf, period.name, x + 7, y + 20, 11, "bold", C.ink);
    text(pdf, formatCurrency(period.summary.total), x + w - 7, y + 20, 12, "bold", C.green, "right");
    const items = [
      ["Trabalhados", `${period.summary.workedDays}/${period.summary.totalDays}`],
      ["Inteiros", String(period.summary.fullDays)],
      ["Meios", String(period.summary.halfDays)],
      ["Folgas", String(period.summary.daysOff)]
    ];
    items.forEach(([key, value], row) => {
      const col = row % 2;
      const line = Math.floor(row / 2);
      const ix = x + 7 + col * 39;
      label(pdf, key, ix, y + 30 + line * 10, C.muted);
      text(pdf, value, ix + 31, y + 30 + line * 10, 8, "bold", C.ink, "right");
    });
    progress(pdf, x + 7, y + 51, w - 14, period.summary.workedPercentage, C.green);
  });
}

function drawCalendar(pdf: Pdf, report: ExportReport, y: number) {
  drawSectionHeading(pdf, "Calendário do mês", "Verde: inteiro  •  Amarelo: meio período  •  Cinza: folga", y);
  const cellW = CONTENT_W / 7;
  const cellH = 10.5;
  const startDay = new Date(report.year, report.month - 1, 1).getDay();
  const weekdays = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
  weekdays.forEach((day, index) => label(pdf, day, M + index * cellW + cellW / 2, y + 10, C.muted, "center"));
  report.days.forEach((entry) => {
    const position = startDay + entry.day - 1;
    const col = position % 7;
    const row = Math.floor(position / 7);
    const x = M + col * cellW + 1;
    const cy = y + 14 + row * cellH;
    const fill = entry.status === "V" ? C.greenSoft : entry.status === "M" ? C.yellowSoft : C.soft;
    card(pdf, x, cy, cellW - 2, cellH - 1, fill, 2);
    text(pdf, String(entry.day).padStart(2, "0"), x + 4, cy + 6.3, 8, "bold", C.ink);
    pdf.setFillColor(...(entry.status === "V" ? C.green : entry.status === "M" ? C.yellow : C.muted));
    pdf.circle(x + cellW - 7, cy + 5, 1.5, "F");
  });
}

function drawWorkLog(pdf: Pdf, report: ExportReport, y: number) {
  autoTable(pdf, {
    startY: y,
    margin: { left: M, right: M, bottom: 18 },
    head: [["Data", "Dia", "Status / detalhes", "Pagamento"]],
    body: report.days.map((day) => [day.date, day.weekday, [day.statusLabel, ...(day.details ?? [])].join(" — "), formatCurrency(day.value)]),
    theme: "plain",
    styles: { font: "helvetica", fontSize: 8, cellPadding: 3.2, textColor: C.ink },
    headStyles: { fillColor: C.ink, textColor: C.white, fontStyle: "bold" },
    alternateRowStyles: { fillColor: C.soft },
    columnStyles: { 3: { halign: "right", fontStyle: "bold", textColor: C.green } },
    didParseCell: (hook) => {
      if (hook.section === "body" && hook.column.index === 2) {
        const value = String(hook.cell.raw);
        hook.cell.styles.textColor = value === "Inteiro" ? C.green : value === "Meio" ? C.yellow : C.muted;
        hook.cell.styles.fontStyle = "bold";
      }
    }
  });
}

function drawPaymentBreakdown(pdf: Pdf, report: ExportReport, y: number) {
  const full = report.first.fullDays + report.second.fullDays;
  const half = report.first.halfDays + report.second.halfDays;
  const off = report.first.daysOff + report.second.daysOff;
  card(pdf, M, y, CONTENT_W, 55);
  text(pdf, "Composição do pagamento", M + 8, y + 11, 11, "bold", C.ink);
  [
    ["Dias inteiros", `${full} × ${formatCurrency(report.rates.fullDay)}`, formatCurrency(full * report.rates.fullDay)],
    ["Meios períodos", `${half} × ${formatCurrency(report.rates.halfDay)}`, formatCurrency(half * report.rates.halfDay)],
    ["Folgas", `${off} × R$ 0`, "R$ 0"]
  ].forEach((row, index) => {
    const ry = y + 22 + index * 8;
    text(pdf, row[0], M + 8, ry, 8, "normal", C.muted);
    text(pdf, row[1], M + 82, ry, 8, "normal", C.ink);
    text(pdf, row[2], 194, ry, 9, "bold", C.ink, "right");
  });
  pdf.setDrawColor(...C.line);
  pdf.line(M + 8, y + 47, 194, y + 47);
  text(pdf, "TOTAL", M + 8, y + 52.5, 9, "bold", C.ink);
  text(pdf, formatCurrency(report.monthlyTotal), 194, y + 52.5, 13, "bold", C.green, "right");
}

type Statistics = ReturnType<typeof calculateStatistics>;

function drawStatistics(pdf: Pdf, report: ExportReport, stats: Statistics, y: number) {
  drawSectionHeading(pdf, "Dashboard estatístico", "Indicadores de ritmo, frequência e eficiência", y);
  const metrics = [
    ["Dias trabalhados", String(report.monthlyWorkedDays)],
    ["Percentual trabalhado", `${report.monthlyWorkedPercentage}%`],
    ["Receita / dia trabalhado", formatCurrency(report.monthlyAvgPerWorkedDay)],
    ["Receita / dia calendário", formatCurrency(report.monthlyAvgPerCalendarDay)],
    ["Maior sequência de trabalho", `${stats.longestWork} dias`],
    ["Maior sequência de folga", `${stats.longestBreak} dias`],
    ["Sextas trabalhadas", String(stats.weekdayCounts[5])],
    ["Fins de semana trabalhados", String(stats.weekdayCounts[0] + stats.weekdayCounts[6])]
  ];
  const w = (CONTENT_W - 9) / 4;
  metrics.forEach(([name, value], index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = M + col * (w + 3);
    const my = y + 10 + row * 28;
    card(pdf, x, my, w, 24);
    label(pdf, name, x + 5, my + 7, C.muted);
    text(pdf, value, x + 5, my + 17, 12, "bold", C.ink);
  });
}

function drawCharts(pdf: Pdf, report: ExportReport, stats: Statistics, y: number) {
  drawSectionHeading(pdf, "Visualizações", "Distribuição de atividade e receita", y);
  const w = (CONTENT_W - 6) / 3;
  drawWeekdayBars(pdf, M, y + 10, w, 70, stats.weekdayCounts);
  drawDistribution(pdf, M + w + 3, y + 10, w, 70, report);
  drawIncomeComparison(pdf, M + (w + 3) * 2, y + 10, w, 70, report);
}

function drawWeekdayBars(pdf: Pdf, x: number, y: number, w: number, h: number, counts: number[]) {
  card(pdf, x, y, w, h);
  text(pdf, "Trabalho por dia", x + 6, y + 10, 9, "bold", C.ink);
  const max = Math.max(...counts, 1);
  counts.forEach((count, index) => {
    const by = y + 18 + index * 6.5;
    label(pdf, ["D", "S", "T", "Q", "Q", "S", "S"][index], x + 6, by + 3, C.muted);
    progress(pdf, x + 12, by, w - 23, (count / max) * 100, C.green, 2.8);
    text(pdf, String(count), x + w - 6, by + 3, 7, "bold", C.ink, "right");
  });
}

function drawDistribution(pdf: Pdf, x: number, y: number, w: number, h: number, report: ExportReport) {
  card(pdf, x, y, w, h);
  text(pdf, "Distribuição", x + 6, y + 10, 9, "bold", C.ink);
  const values = [
    ["Inteiros", report.first.fullDays + report.second.fullDays, C.green],
    ["Meios", report.first.halfDays + report.second.halfDays, C.yellow],
    ["Folgas", report.first.daysOff + report.second.daysOff, C.muted]
  ] as const;
  let start = 0;
  values.forEach((item) => {
    const end = start + (item[1] / report.monthlyTotalDays) * Math.PI * 2;
    drawArc(pdf, x + w / 2, y + 31, 13, start, end, item[2]);
    start = end;
  });
  values.forEach((item, index) => {
    pdf.setFillColor(...item[2]);
    pdf.circle(x + 8, y + 50 + index * 6, 1.5, "F");
    text(pdf, item[0], x + 12, y + 52 + index * 6, 7, "normal", C.muted);
    text(pdf, String(item[1]), x + w - 6, y + 52 + index * 6, 7, "bold", C.ink, "right");
  });
}

function drawIncomeComparison(pdf: Pdf, x: number, y: number, w: number, h: number, report: ExportReport) {
  card(pdf, x, y, w, h);
  text(pdf, "Receita por período", x + 6, y + 10, 9, "bold", C.ink);
  const max = Math.max(report.first.total, report.second.total, 1);
  [
    ["1ª quinzena", report.first.total],
    ["2ª quinzena", report.second.total]
  ].forEach(([name, raw], index) => {
    const value = Number(raw);
    const bx = x + 10 + index * 23;
    const barH = (value / max) * 30;
    pdf.setFillColor(...C.green);
    pdf.roundedRect(bx, y + 47 - barH, 14, barH, 2, 2, "F");
    text(pdf, formatCurrency(value), bx + 7, y + 53, 6.5, "bold", C.ink, "center");
    label(pdf, String(name), bx + 7, y + 61, C.muted, "center");
  });
}

function drawInsights(pdf: Pdf, report: ExportReport, stats: Statistics, y: number) {
  const bestDay = stats.weekdayCounts.indexOf(Math.max(...stats.weekdayCounts));
  const names = ["domingos", "segundas", "terças", "quartas", "quintas", "sextas", "sábados"];
  const higherPeriod = report.second.total > report.first.total ? "segunda" : report.second.total < report.first.total ? "primeira" : null;
  const insights = [
    `Você trabalhou em ${report.monthlyWorkedPercentage}% dos dias deste mês.`,
    higherPeriod ? `A ${higherPeriod} quinzena gerou a maior receita do período.` : "As duas quinzenas geraram a mesma receita.",
    `${names[bestDay][0].toUpperCase()}${names[bestDay].slice(1)} foram os dias mais frequentes de trabalho.`,
    `A renda média por dia trabalhado foi de ${formatCurrency(report.monthlyAvgPerWorkedDay)}.`,
    report.monthlyWorkedPercentage >= 50 ? "A produtividade mensal ficou acima de 50%." : "A produtividade mensal ficou abaixo de 50%."
  ];
  insights.forEach((insight, index) => {
    const iy = y + index * 15;
    card(pdf, M, iy, CONTENT_W, 11, index === 0 ? C.greenSoft : C.soft, 2.5);
    pdf.setFillColor(...(index === 0 ? C.green : C.ink));
    pdf.circle(M + 6, iy + 5.5, 2, "F");
    text(pdf, insight, M + 12, iy + 7, 9, index === 0 ? "bold" : "normal", C.ink);
  });
}

function drawMethodology(pdf: Pdf, report: ExportReport, y: number) {
  card(pdf, M, y, CONTENT_W, 48);
  text(pdf, "Sobre este relatório", M + 8, y + 11, 11, "bold", C.ink);
  const copy = [
    "Este documento consolida os registros do calendário do One Blond.",
    `Dias inteiros são calculados a ${formatCurrency(report.rates.fullDay)}; meios períodos, a ${formatCurrency(report.rates.halfDay)}; folgas não geram remuneração.`,
    "Percentuais e médias são derivados exclusivamente dos dados registrados no mês selecionado.",
    "Revise os lançamentos antes de utilizar este relatório para fins contábeis."
  ];
  copy.forEach((line, index) => text(pdf, line, M + 8, y + 21 + index * 7, 8, "normal", C.muted));
}

function calculateStatistics(report: ExportReport) {
  const weekdayCounts = Array(7).fill(0) as number[];
  let longestWork = 0;
  let longestBreak = 0;
  let work = 0;
  let rest = 0;
  report.days.forEach((day) => {
    const worked = day.status !== "O";
    if (worked) {
      weekdayCounts[new Date(report.year, report.month - 1, day.day).getDay()] += 1;
      work += 1;
      rest = 0;
      longestWork = Math.max(longestWork, work);
    } else {
      rest += 1;
      work = 0;
      longestBreak = Math.max(longestBreak, rest);
    }
  });
  return { weekdayCounts, longestWork, longestBreak };
}

function addFooters(pdf: Pdf, generated: Date) {
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(...C.line);
    pdf.line(M, 282, 194, 282);
    text(pdf, `Gerado automaticamente por One Blond  •  ${formatDate(generated)} ${formatTime(generated)}`, M, 288, 6.5, "normal", C.muted);
    text(pdf, "Relatório Financeiro Confidencial", 105, 288, 6.5, "normal", C.muted, "center");
    text(pdf, `Página ${page} de ${pages}`, 194, 288, 6.5, "bold", C.muted, "right");
  }
}

function drawSectionHeading(pdf: Pdf, title: string, subtitle: string, y: number) {
  text(pdf, title, M, y + 3, 11, "bold", C.ink);
  text(pdf, subtitle, 194, y + 3, 7, "normal", C.muted, "right");
}

function card(pdf: Pdf, x: number, y: number, w: number, h: number, fill: RGB = C.white, radius = 3) {
  pdf.setFillColor(...fill);
  pdf.setDrawColor(...C.line);
  pdf.setLineWidth(0.2);
  pdf.roundedRect(x, y, w, h, radius, radius, "FD");
}

function progress(pdf: Pdf, x: number, y: number, w: number, percentage: number, color: RGB, h = 3.2) {
  pdf.setFillColor(...C.line);
  pdf.roundedRect(x, y, w, h, h / 2, h / 2, "F");
  if (percentage > 0) {
    pdf.setFillColor(...color);
    pdf.roundedRect(x, y, Math.max(h, w * Math.min(100, percentage) / 100), h, h / 2, h / 2, "F");
  }
}

function label(pdf: Pdf, value: string, x: number, y: number, color: RGB, align: "left" | "center" | "right" = "left") {
  text(pdf, value.toUpperCase(), x, y, 6.5, "bold", color, align);
}

function text(pdf: Pdf, value: string, x: number, y: number, size: number, weight: "normal" | "bold", color: RGB, align: "left" | "center" | "right" = "left") {
  pdf.setFont("helvetica", weight);
  pdf.setFontSize(size);
  pdf.setTextColor(...color);
  pdf.text(value, x, y, { align });
}

function drawArc(pdf: Pdf, cx: number, cy: number, radius: number, start: number, end: number, color: RGB) {
  const steps = Math.max(2, Math.ceil((end - start) * 16));
  pdf.setDrawColor(...color);
  pdf.setLineWidth(4);
  for (let index = 0; index < steps; index += 1) {
    const a = start + ((end - start) * index) / steps;
    const b = start + ((end - start) * (index + 1)) / steps;
    pdf.line(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, cx + Math.cos(b) * radius, cy + Math.sin(b) * radius);
  }
  pdf.setLineWidth(0.2);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export type { DayEntry };
