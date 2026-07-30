"use client";

import { useEffect, useRef } from "react";
import { XIcon } from "@/components/icons";

type Props = {
  period: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmClearModal({ period, onCancel, onConfirm }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="clear-title" aria-describedby="clear-description" className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-slate-900 sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-600">Ação destrutiva</p>
            <h2 id="clear-title" className="mt-1 text-2xl font-black">Confirmar limpeza</h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="Fechar confirmação" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 focus-visible:ring-4 focus-visible:ring-rose-500/25 dark:border-slate-700"><XIcon className="h-5 w-5" /></button>
        </div>
        <p id="clear-description" className="mt-5 font-bold">Você realmente deseja limpar este período?</p>
        <p className="mt-3 rounded-2xl bg-slate-100 p-4 font-black text-slate-950 dark:bg-slate-950 dark:text-white">{period}</p>
        <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">Esta ação removerá todas as marcações deste período.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button ref={cancelRef} type="button" onClick={onCancel} className="min-h-12 rounded-xl border border-slate-200 px-4 font-black focus-visible:ring-4 focus-visible:ring-slate-400/25 dark:border-slate-700">Cancelar</button>
          <button type="button" onClick={onConfirm} className="min-h-12 rounded-xl bg-rose-600 px-4 font-black text-white hover:bg-rose-700 focus-visible:ring-4 focus-visible:ring-rose-500/30">Limpar</button>
        </div>
      </section>
    </div>
  );
}
