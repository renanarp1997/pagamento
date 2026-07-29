"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { ThemeMode } from "@/types/payment";

const THEME_KEY = "quinzena-theme";
const THEME_EVENT = "quinzena-theme-change";

function getThemeSnapshot(): ThemeMode {
  const savedTheme = window.localStorage.getItem(THEME_KEY) as ThemeMode | null;
  const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  return savedTheme ?? (preferredDark ? "dark" : "light");
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_EVENT, onStoreChange);
  };
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, () => "light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return {
    theme,
    toggleTheme: () => {
      const nextTheme = theme === "dark" ? "light" : "dark";

      window.localStorage.setItem(THEME_KEY, nextTheme);
      window.dispatchEvent(new Event(THEME_EVENT));
    }
  };
}
