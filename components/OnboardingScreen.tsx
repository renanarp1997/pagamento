"use client";

import { PaymentSettingsForm } from "@/components/PaymentSettingsForm";
import { DEFAULT_PAYMENT_SETTINGS } from "@/lib/constants";
import type { PaymentSettings } from "@/types/payment";

type OnboardingScreenProps = {
  onComplete: (settings: PaymentSettings) => void;
  initialValues?: PaymentSettings;
};

export function OnboardingScreen({ onComplete, initialValues = { ...DEFAULT_PAYMENT_SETTINGS } }: OnboardingScreenProps) {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#f7f8fa] bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_28%)] px-3 py-4 dark:bg-[#070b14] sm:px-4 sm:py-10">
      <section className="w-full max-w-4xl rounded-3xl border border-white/80 bg-white/95 p-5 shadow-[0_30px_100px_rgba(15,23,42,0.14)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:rounded-[32px] sm:p-10">
        <div className="mb-8">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-2xl shadow-lg dark:bg-white">💰</span>
          <p className="mt-6 text-sm font-black uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">Bem-vindo</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">Vamos configurar seu pagamento.</h1>
          <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500 dark:text-slate-400">Informe quanto você recebe por dia. Isso leva menos de um minuto e deixa todos os cálculos personalizados para você.</p>
        </div>
        <PaymentSettingsForm initialValues={initialValues} onSave={onComplete} onboarding />
      </section>
    </main>
  );
}
