"use client";

import { useEffect } from "react";

export function UndoToast({ onUndo, onExpire }: { onUndo: () => void; onExpire: () => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(onExpire, 10_000);
    return () => window.clearTimeout(timeout);
  }, [onExpire]);

  return (
    <div role="status" className="fixed bottom-4 left-1/2 z-[80] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-4 rounded-2xl bg-slate-950 px-4 py-3 text-white shadow-2xl dark:bg-white dark:text-slate-950">
      <span className="text-sm font-bold">Dados apagados com sucesso.</span>
      <button type="button" onClick={onUndo} className="min-h-10 rounded-xl bg-teal-500 px-4 text-sm font-black text-slate-950 focus-visible:ring-4 focus-visible:ring-teal-300/40">Desfazer</button>
    </div>
  );
}
