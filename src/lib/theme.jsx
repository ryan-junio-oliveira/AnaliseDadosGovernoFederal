import { createContext, useCallback, useContext, useEffect, useState } from "react";

const ThemeCtx = createContext({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("pfu-theme") === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("pfu-theme", theme);
    } catch {
      /* sem storage */
    }
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    []
  );

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}

/** paleta dos gráficos conforme o tema */
export function chartPalette(theme) {
  return theme === "light"
    ? { tick: "#4d5f76", grid: "rgba(15,29,51,.09)", legend: "#4d5f76" }
    : { tick: "#93a1b8", grid: "rgba(148,163,184,.12)", legend: "#93a1b8" };
}
