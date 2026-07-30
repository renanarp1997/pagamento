"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CopyIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  ImageIcon,
  PrinterIcon,
  XIcon
} from "@/components/icons";
import {
  buildCopyText,
  buildCsvContent,
  buildExportReport,
  downloadBlob,
  getExportFilename
} from "@/lib/export";
import { formatCurrency } from "@/lib/format";
import { generatePremiumPdf } from "@/lib/pdf-report";
import type { MonthData, PaymentRates, PeriodSummary } from "@/types/payment";

type ExportModalProps = {
  year: number;
  month: number;
  data: MonthData;
  rates: PaymentRates;
  isOpen: boolean;
  onClose: () => void;
};

export function ExportModal({ year, month, data, rates, isOpen, onClose }: ExportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const report = useMemo(() => buildExportReport(year, month, data, rates), [year, month, data, rates]);
  const hasData = report.monthlyWorkedDays > 0;

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  async function copySummary() {
    setExporting("copy");
    try {
      await navigator.clipboard.writeText(buildCopyText(report));
      showToast("success", "Resumo copiado com sucesso!");
    } catch {
      showToast("error", "Erro ao copiar resumo.");
    } finally {
      setExporting(null);
    }
  }

  async function exportPdf() {
    if (!hasData) return;
    setExporting("pdf");
    try {
      const pdf = await generatePremiumPdf(report);
      pdf.save(getExportFilename(report, "pdf"));
      showToast("success", "PDF gerado.");
    } catch {
      showToast("error", "Erro ao gerar PDF.");
    } finally {
      setExporting(null);
    }
  }

  async function exportCsv() {
    if (!hasData) return;
    setExporting("csv");
    try {
      downloadBlob(new Blob([buildCsvContent(report)], { type: "text/csv;charset=utf-8" }), getExportFilename(report, "csv"));
      showToast("success", "CSV gerado.");
    } catch {
      showToast("error", "Erro ao gerar CSV.");
    } finally {
      setExporting(null);
    }
  }

  async function exportPng() {
    if (!reportRef.current || !hasData) return;

    setExporting("png");

    try {
      const blob = await createReportPng(reportRef.current);
      downloadBlob(blob, getExportFilename(report, "png"));
      showToast("success", "PNG gerado.");
    } catch (error) {
      console.error("Falha ao gerar PNG", error);
      showToast("error", "Não foi possível gerar o PNG. Tente novamente.");
    } finally {
      setExporting(null);
    }
  }

  async function printReport() {
    if (!hasData) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("error", "Permita pop-ups para imprimir o PDF.");
      return;
    }

    setExporting("print");
    try {
      printWindow.document.title = "Preparando PDF...";
      printWindow.document.body.innerHTML =
        '<p style="font: 16px sans-serif; padding: 24px;">Preparando PDF para impressão...</p>';

      const pdf = await generatePremiumPdf(report);
      pdf.autoPrint();
      printWindow.location.href = pdf.output("bloburl").toString();
      showToast("success", "PDF aberto para impressão.");
    } catch {
      printWindow.close();
      showToast("error", "Erro ao gerar o PDF para impressão.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div
      className="export-backdrop-enter fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-md sm:items-center sm:px-4 sm:py-8"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="export-modal-enter flex h-[100dvh] w-full max-w-[860px] flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] sm:h-auto sm:max-h-[92vh] sm:rounded-[20px] sm:border sm:border-slate-200/80"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        <header className="export-no-print flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-8 sm:py-5">
          <div>
            <p className="text-sm font-semibold text-slate-500">📄 Exportar Resumo</p>
            <h2 id="export-modal-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              {report.monthYear}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar exportação"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div id="export-report-print" ref={reportRef} className="bg-white px-4 py-5 sm:px-8 sm:py-8">
            <div className="hidden print:block">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">One Blond</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">{report.monthYear}</h1>
              <div className="mt-4 h-px bg-slate-200" />
            </div>

            <div className="mb-6 flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">
                📄
              </span>
              <div>
                <p className="text-sm font-medium text-slate-500">Relatório financeiro</p>
                <p className="text-xl font-bold text-slate-950">{report.monthYear}</p>
              </div>
            </div>

            <div className="mb-8 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            <PeriodReport title="Primeira Quinzena" summary={report.first} rates={rates} />
            <div className="my-8 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            <PeriodReport title="Segunda Quinzena" summary={report.second} rates={rates} />

            <div className="my-8 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            <div className="rounded-[20px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-[0_8px_30px_rgba(16,185,129,0.08)] sm:p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">💰 Total do mês</p>
              <p className="mt-2 break-words text-3xl font-bold tracking-tight text-emerald-700 sm:text-5xl">{formatCurrency(report.monthlyTotal)}</p>
            </div>

            <section className="mt-8">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Estatísticas</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Dias trabalhados"
                  value={`${report.monthlyWorkedDays} / ${report.monthlyTotalDays}`}
                  detail={`${report.monthlyWorkedPercentage}%`}
                  progress={report.monthlyWorkedPercentage}
                />
                <StatCard label="Média por dia trabalhado" value={formatCurrency(report.monthlyAvgPerWorkedDay)} />
                <StatCard label="Média por dia do calendário" value={formatCurrency(report.monthlyAvgPerCalendarDay)} />
              </div>
            </section>

            {report.days.some((entry) => entry.status !== "O") ? (
              <section className="mt-8">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Dias trabalhados</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {report.days.filter((entry) => entry.status !== "O").map((entry) => (
                    <span
                      key={`${entry.day}-${entry.status}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                    >
                      <span aria-hidden="true">{entry.emoji}</span>
                      <span>
                        {entry.weekday} {String(entry.day).padStart(2, "0")}
                      </span>
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            {report.days.some((entry) => entry.details?.length) ? (
              <section className="mt-8">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Configurações especiais</h3>
                <div className="mt-4 space-y-2">
                  {report.days.filter((entry) => entry.details?.length).map((entry) => (
                    <div key={`detail-${entry.date}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                      <p className="font-bold">{entry.date} — {entry.details?.join(" | ")}</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatCurrency(entry.value)}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="mt-8">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Detalhamento diário</h3>
              <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200">
                <div className="hidden grid-cols-[110px_70px_minmax(0,1fr)_110px] gap-3 bg-slate-950 px-4 py-3 text-xs font-bold uppercase tracking-wide text-white sm:grid">
                  <span>Data</span>
                  <span>Dia</span>
                  <span>Status e detalhes</span>
                  <span className="text-right">Valor final</span>
                </div>
                <div className="divide-y divide-slate-200">
                  {report.days.map((entry) => (
                    <div key={`daily-${entry.date}`} className="grid gap-2 bg-white px-4 py-3 text-sm sm:grid-cols-[110px_70px_minmax(0,1fr)_110px] sm:items-start sm:gap-3">
                      <div>
                        <span className="text-xs font-bold uppercase text-slate-400 sm:hidden">Data</span>
                        <p className="font-semibold text-slate-800">{entry.date}</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase text-slate-400 sm:hidden">Dia</span>
                        <p className="font-semibold text-slate-600">{entry.weekday}</p>
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold uppercase text-slate-400 sm:hidden">Status e detalhes</span>
                        <p className="font-bold text-slate-900">{entry.statusLabel}</p>
                        {entry.details?.map((detail) => <p key={detail} className="mt-1 break-words text-xs font-medium text-slate-500">{detail}</p>)}
                      </div>
                      <div className="sm:text-right">
                        <span className="text-xs font-bold uppercase text-slate-400 sm:hidden">Valor final</span>
                        <p className="font-bold text-slate-950">{formatCurrency(entry.value)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-8">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Resumo</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <SummaryMiniCard
                  emoji="🟢"
                  label="Inteiros"
                  count={report.first.fullDays + report.second.fullDays}
                  total={formatCurrency(report.first.fullTotal + report.second.fullTotal)}
                  accent="emerald"
                />
                <SummaryMiniCard
                  emoji="🟡"
                  label="Meios"
                  count={report.first.halfDays + report.second.halfDays}
                  total={formatCurrency(report.first.halfTotal + report.second.halfTotal)}
                  accent="amber"
                />
                <SummaryMiniCard
                  emoji="⚪"
                  label="Folgas"
                  count={report.first.daysOff + report.second.daysOff}
                  total={formatCurrency(0)}
                  accent="slate"
                />
              </div>
            </section>
          </div>
        </div>

        <footer className="export-no-print shrink-0 border-t border-slate-100 bg-slate-50/80 px-4 py-4 sm:px-6">
          {!hasData ? <p className="mb-3 text-center text-sm font-semibold text-amber-700">Nenhum dado para exportar.</p> : null}
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
            <ExportActionButton
              icon={<CopyIcon className="h-4 w-4" />}
              label={exporting === "copy" ? "Copiando..." : "Copiar Resumo"}
              onClick={copySummary}
              loading={exporting === "copy"}
              disabled={exporting !== null}
              primary
            />
            <ExportActionButton icon={<FileTextIcon className="h-4 w-4" />} label={exporting === "pdf" ? "Gerando PDF..." : "Exportar PDF"} onClick={exportPdf} loading={exporting === "pdf"} disabled={!hasData || exporting !== null} title={!hasData ? "Nenhum dado para exportar." : undefined} />
            <ExportActionButton icon={<FileSpreadsheetIcon className="h-4 w-4" />} label={exporting === "csv" ? "Gerando CSV..." : "Exportar CSV"} onClick={exportCsv} loading={exporting === "csv"} disabled={!hasData || exporting !== null} title={!hasData ? "Nenhum dado para exportar." : undefined} />
            <ExportActionButton
              icon={<ImageIcon className="h-4 w-4" />}
              label={exporting === "png" ? "Gerando PNG..." : "Exportar PNG"}
              onClick={exportPng}
              loading={exporting === "png"}
              disabled={!hasData || exporting !== null}
              title={!hasData ? "Nenhum dado para exportar." : undefined}
            />
            <ExportActionButton icon={<PrinterIcon className="h-4 w-4" />} label={exporting === "print" ? "Abrindo..." : "Imprimir"} onClick={printReport} loading={exporting === "print"} disabled={!hasData || exporting !== null} title={!hasData ? "Nenhum dado para exportar." : undefined} />
          </div>
        </footer>
      </div>
      {toast ? (
        <div role="status" aria-live="polite" className={`fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-xl ${toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>
          {toast.type === "success" ? "✅" : "❌"} {toast.message}
        </div>
      ) : null}
    </div>
  );
}

async function createReportPng(element: HTMLDivElement) {
  try {
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(element, {
      backgroundColor: "#ffffff",
      cacheBust: true,
      pixelRatio: Math.min(2, Math.max(1, window.devicePixelRatio)),
      width: element.scrollWidth,
      height: element.scrollHeight,
      style: {
        color: "#0f172a",
        overflow: "visible"
      }
    });
    const response = await fetch(dataUrl);
    if (!response.ok) throw new Error("Falha ao converter imagem");
    return await response.blob();
  } catch (primaryError) {
    console.warn("Captura principal do PNG falhou; usando modo de compatibilidade.", primaryError);
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: Math.min(2, Math.max(1, window.devicePixelRatio)),
      useCORS: true,
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: Math.max(element.scrollWidth, 860)
    });
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((result: Blob | null) => result ? resolve(result) : reject(new Error("PNG vazio")), "image/png")
    );
  }
}

function PeriodReport({ title, summary, rates }: { title: string; summary: PeriodSummary; rates: PaymentRates }) {
  return (
    <section>
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      <div className="mt-4 space-y-3">
        <CategoryCard
          emoji="🟢"
          title="Dias inteiros"
          count={summary.fullDays}
          calculation={`${summary.fullDays} × ${formatCurrency(rates.fullDay)}`}
          total={formatCurrency(summary.fullTotal)}
          accent="emerald"
        />
        <CategoryCard
          emoji="🟡"
          title="Meios períodos"
          count={summary.halfDays}
          calculation={`${summary.halfDays} × ${formatCurrency(rates.halfDay)}`}
          total={formatCurrency(summary.halfTotal)}
          accent="amber"
        />
        <CategoryCard emoji="⚪" title="Folgas" count={summary.daysOff} accent="slate" />
      </div>
      <div className="mt-5 flex items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50 px-5 py-4">
        <p className="text-sm font-semibold text-slate-600">Total da {title.toLowerCase()}</p>
        <p className="text-2xl font-bold text-slate-950">{formatCurrency(summary.total)}</p>
      </div>
    </section>
  );
}

function CategoryCard({
  emoji,
  title,
  count,
  calculation,
  total,
  accent
}: {
  emoji: string;
  title: string;
  count: number;
  calculation?: string;
  total?: string;
  accent: "emerald" | "amber" | "slate";
}) {
  const accentStyles = {
    emerald: "border-emerald-100 bg-emerald-50/40",
    amber: "border-amber-100 bg-amber-50/40",
    slate: "border-slate-200 bg-slate-50/60"
  } as const;

  return (
    <div className={`rounded-[20px] border p-4 shadow-[0_4px_20px_rgba(15,23,42,0.04)] ${accentStyles[accent]}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">
          {emoji}
        </span>
        <p className="font-semibold text-slate-900">{title}</p>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3 sm:gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Quantidade</p>
          <p className="mt-0.5 text-lg font-bold text-slate-900">{count}</p>
        </div>
        {calculation ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Valor</p>
            <p className="mt-0.5 text-lg font-semibold text-slate-700">{calculation}</p>
          </div>
        ) : (
          <div className="hidden sm:block" />
        )}
        {total ? (
          <div className="sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total</p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">{total}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  progress
}: {
  label: string;
  value: string;
  detail?: string;
  progress?: number;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      {progress !== undefined ? (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <p className="text-lg font-bold text-slate-900">{value}</p>
            {detail ? <p className="text-sm font-semibold text-emerald-600">{detail}</p> : null}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xl font-bold text-slate-900">{value}</p>
      )}
    </div>
  );
}

function SummaryMiniCard({
  emoji,
  label,
  count,
  total,
  accent
}: {
  emoji: string;
  label: string;
  count: number;
  total: string;
  accent: "emerald" | "amber" | "slate";
}) {
  const accentStyles = {
    emerald: "border-emerald-100",
    amber: "border-amber-100",
    slate: "border-slate-200"
  } as const;

  return (
    <div className={`rounded-[20px] border bg-white p-4 text-center shadow-[0_4px_20px_rgba(15,23,42,0.04)] ${accentStyles[accent]}`}>
      <p className="text-lg" aria-hidden="true">
        {emoji}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{count}</p>
      <div className="mx-auto my-3 h-px w-12 bg-slate-200" />
      <p className="text-lg font-bold text-slate-800">{total}</p>
    </div>
  );
}

function ExportActionButton({
  icon,
  label,
  onClick,
  primary = false,
  disabled = false,
  loading = false,
  title
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`group inline-flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
        primary
          ? "bg-slate-950 text-white shadow-lg shadow-slate-900/15 hover:-translate-y-0.5 hover:bg-slate-800"
          : "border border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
      }`}
    >
      <span className={loading ? "h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" : "transition group-hover:scale-110"}>{loading ? null : icon}</span>
      {label}
    </button>
  );
}
