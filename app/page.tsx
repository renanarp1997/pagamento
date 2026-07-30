"use client";

import { useRouter } from "next/navigation";
import { OnboardingScreen } from "@/components/OnboardingScreen";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";
import type { PaymentSettings } from "@/types/payment";

export default function HomePage() {
  const router = useRouter();
  const { settings, isReady, save } = usePaymentSettings();

  function continueToCalculator(values: PaymentSettings) {
    save(values);
    router.push("/calculator");
  }

  if (!isReady) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[#f7f8fa] px-4 dark:bg-[#070b14]">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400" role="status">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-teal-500 border-r-transparent" />
          Carregando suas configurações...
        </div>
      </main>
    );
  }

  return <OnboardingScreen initialValues={settings} onComplete={continueToCalculator} />;
}
