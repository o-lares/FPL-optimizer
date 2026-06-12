export type Theme = "light" | "dark";

const STORAGE_KEY = "fpl-optimizer-theme";

export function getInitialTheme(): Theme {
  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function saveTheme(theme: Theme): void {
  window.localStorage.setItem(STORAGE_KEY, theme);
}
