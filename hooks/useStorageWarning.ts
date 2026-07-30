"use client";

import { useEffect, useState } from "react";

export function useStorageWarning() {
  const [usageRatio, setUsageRatio] = useState(0);
  useEffect(() => {
    async function measure() {
      if (navigator.storage?.estimate) {
        const { usage = 0, quota = 1 } = await navigator.storage.estimate();
        setUsageRatio(usage / quota);
      } else {
        const used = Object.keys(window.localStorage).reduce((total, key) => total + key.length + (window.localStorage.getItem(key)?.length ?? 0), 0) * 2;
        setUsageRatio(used / (5 * 1024 * 1024));
      }
    }
    void measure();
    window.addEventListener("storage", measure);
    return () => window.removeEventListener("storage", measure);
  }, []);
  return { usageRatio, isNearLimit: usageRatio >= 0.8 };
}
