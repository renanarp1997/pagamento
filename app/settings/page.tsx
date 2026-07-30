"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PaymentSettingsForm } from "@/components/PaymentSettingsForm";
import { BackupManager } from "@/components/BackupManager";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";

export default function SettingsPage() {
  const router = useRouter();
  const { settings, save } = usePaymentSettings();
  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <section className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900/95 sm:rounded-[28px] sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">Configurações</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Valores de pagamento</h2>
          <p className="mb-8 mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">As alterações recalculam imediatamente a calculadora, o histórico e as exportações.</p>
          <PaymentSettingsForm key={JSON.stringify(settings)} initialValues={settings} onSave={(values) => { save(values); router.push("/calculator"); }} onCancel={() => router.back()} />
        </section>
        <BackupManager />
      </div>
    </AppShell>
  );
}
