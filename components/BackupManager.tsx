"use client";

import { useRef, useState } from "react";
import { countBackupRecords, createBackup, importBackup, migrateBackup, type OneBlondBackup } from "@/lib/backup";
import { PAYMENT_STORAGE_EVENT } from "@/hooks/useMonthPayment";
import { PAYMENT_HISTORY_EVENT } from "@/lib/payment-history";
import { useStorageWarning } from "@/hooks/useStorageWarning";

export function BackupManager() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<OneBlondBackup | null>(null);
  const [message, setMessage] = useState("");
  const { isNearLimit } = useStorageWarning();

  function exportBackup() {
    const blob = new Blob([JSON.stringify(createBackup(window.localStorage), null, 2)], { type: "application/json" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `one-blond-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
  }

  async function selectFile(file?: File) {
    if (!file) return;
    try {
      if (!file.name.toLowerCase().endsWith(".json")) throw new Error("Selecione um arquivo JSON.");
      setPending(migrateBackup(JSON.parse(await file.text())));
      setMessage("");
    } catch (error) {
      setPending(null);
      setMessage(error instanceof Error ? error.message : "Não foi possível ler o backup.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function apply(mode: "merge" | "replace") {
    if (!pending) return;
    if (mode === "replace" && !window.confirm("Substituir tudo? Os dados atuais do One Blond serão removidos antes da restauração.")) return;
    importBackup(window.localStorage, pending, mode);
    window.dispatchEvent(new Event(PAYMENT_STORAGE_EVENT));
    window.dispatchEvent(new Event(PAYMENT_HISTORY_EVENT));
    setPending(null);
    setMessage(mode === "merge" ? "Backup mesclado com sucesso." : "Backup restaurado com sucesso.");
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900/95 sm:p-6">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">Segurança dos dados</p>
      <h2 className="mt-1 text-2xl font-black">Backup completo</h2>
      <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">Inclui configurações, calendário, histórico, faltas, feriados, observações, valores e preferências.</p>
      {isNearLimit ? <p role="alert" className="mt-4 rounded-2xl bg-amber-50 p-4 font-bold text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">Seu navegador está ficando sem espaço. Considere fazer um backup.</p> : null}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={exportBackup} className="min-h-12 rounded-xl bg-slate-950 px-5 font-black text-white dark:bg-white dark:text-slate-950">Exportar Backup</button>
        <button type="button" onClick={() => inputRef.current?.click()} className="min-h-12 rounded-xl border border-slate-200 px-5 font-black dark:border-slate-700">Importar Backup</button>
        <input ref={inputRef} type="file" accept="application/json,.json" className="sr-only" onChange={(event) => void selectFile(event.target.files?.[0])} />
      </div>
      {message ? <p role="status" className="mt-4 text-sm font-bold text-teal-700 dark:text-teal-300">{message}</p> : null}
      {pending ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
          <p className="font-black text-emerald-800 dark:text-emerald-200">Arquivo válido</p>
          <p className="mt-2 text-sm font-semibold">{countBackupRecords(pending)} registros · {pending.history.length} históricos · {pending.settings ? "Configurações encontradas" : "Sem configurações"}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button type="button" onClick={() => setPending(null)} className="min-h-11 rounded-xl border border-slate-200 font-bold dark:border-slate-700">Cancelar</button>
            <button type="button" onClick={() => apply("merge")} className="min-h-11 rounded-xl bg-teal-600 font-black text-white">Mesclar</button>
            <button type="button" onClick={() => apply("replace")} className="min-h-11 rounded-xl bg-rose-600 px-2 font-black text-white">Substituir tudo</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
