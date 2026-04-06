import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";
const THEME_CHANGE_EVENT = "app-theme-change";

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

function getStoredTheme(): Theme {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(savedTheme) ? savedTheme : "light";
}

function applyTheme(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    return;
  }
  document.documentElement.classList.remove("dark");
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<Theme>;
      if (!customEvent.detail) {
        return;
      }

      setThemeState(customEvent.detail);
      applyTheme(customEvent.detail);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      const nextTheme = isTheme(event.newValue) ? event.newValue : "light";
      setThemeState(nextTheme);
      applyTheme(nextTheme);
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        THEME_CHANGE_EVENT,
        handleThemeChange as EventListener
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const setTheme = useCallback((selectedTheme: Theme) => {
    setThemeState(selectedTheme);
    localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
    applyTheme(selectedTheme);
    window.dispatchEvent(
      new CustomEvent<Theme>(THEME_CHANGE_EVENT, { detail: selectedTheme })
    );
  }, []);

  return { theme, setTheme };
}
