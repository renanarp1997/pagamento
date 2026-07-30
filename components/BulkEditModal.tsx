"use client";

import { useEffect, useState } from "react";
import type { BulkDayUpdate, DayStatus } from "@/types/payment";

type Action = "status" | "absence" | "observation" | "value";

export function BulkEditModal({ count, onClose, onApply }: { count: number; onClose: () => void; onApply: (update: BulkDayUpdate) => void }) {
  const [action, setAction] = useState<Action>("status");
  const [status, setStatus] = useState<DayStatus>("V");
  const [observation, setObservation] = useState("");
  const [value, setValue] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const valid = action !== "observation" || observation.trim().length > 0;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="bulk-title" className="max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-slate-900 sm:rounded-3xl sm:p-6">
        <h2 id="bulk-title" className="text-2xl font-black">Editar {count} dias</h2>
        <label className="mt-5 block text-sm font-bold">Aplicar<select autoFocus value={action} onChange={(event) => setAction(event.target.value as Action)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"><option value="status">Status</option><option value="absence">Falta</option><option value="observation">Observação</option><option value="value">Valor final</option></select></label>
        {action === "status" ? <label className="mt-4 block text-sm font-bold">Status<select value={status} onChange={(event) => setStatus(event.target.value as DayStatus)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950"><option value="V">✓ Inteiro</option><option value="M">½ Meio período</option><option value="O">— Folga</option></select></label> : null}
        {action === "absence" ? <p className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">Os dias serão marcados como falta não remunerada. Depois, você pode ajustar cada falta individualmente.</p> : null}
        {action === "observation" ? <label className="mt-4 block text-sm font-bold">Observação<textarea maxLength={500} value={observation} onChange={(event) => setObservation(event.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 p-3 dark:border-slate-700 dark:bg-slate-950" /><span className="mt-1 block text-right text-xs text-slate-500">{observation.length}/500</span></label> : null}
        {action === "value" ? <label className="mt-4 block text-sm font-bold">Valor final (R$)<input inputMode="decimal" value={value} onChange={(event) => setValue(event.target.value.replace(/[^\d,.]/g, ""))} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 dark:border-slate-700 dark:bg-slate-950" /></label> : null}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="min-h-12 rounded-xl border border-slate-200 font-black dark:border-slate-700">Cancelar</button>
          <button type="button" disabled={!valid} onClick={() => {
            const numeric = Number(value.replace(/\./g, "").replace(",", ".")) || 0;
            onApply(action === "status" ? { status } : action === "absence" ? { status: "O", absence: true } : action === "observation" ? { observation } : { finalValue: numeric });
          }} className="min-h-12 rounded-xl bg-teal-600 font-black text-white disabled:opacity-40">Aplicar</button>
        </div>
      </section>
    </div>
  );
}
