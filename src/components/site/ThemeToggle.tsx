"use client";

import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "midnight" | "dawn";

const STORAGE_KEY = "leo-theme";

// Theme variable overrides. "midnight" is the default (warm dark + gold).
// "dawn" shifts toward a warmer, ember-lit palette — lighter and more vibrant.
const THEME_VARS: Record<Theme, Record<string, string>> = {
  midnight: {
    "--bg-deep": "#0D0B0A",
    "--bg-panel": "#1C1C1C",
    "--bg-panel-2": "#15120F",
    "--text-main": "#F3EBDD",
    "--text-muted": "#A89F8E",
  },
  dawn: {
    "--bg-deep": "#1a1208",
    "--bg-panel": "#241a10",
    "--bg-panel-2": "#1e1608",
    "--text-main": "#FBE9C8",
    "--text-muted": "#C9B58E",
  },
};

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const vars = THEME_VARS[t];
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }
  // Update the body background to match the new --bg-deep.
  document.body.style.backgroundColor = vars["--bg-deep"];
  root.setAttribute("data-theme", t);
}

export function ThemeToggle() {
  // Lazy initializer reads from localStorage on the client during the first
  // render — avoids a setState-in-effect + the hydration mismatch (SSR always
  // renders "midnight" because there's no localStorage on the server).
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "midnight";
    return (localStorage.getItem(STORAGE_KEY) as Theme | null) || "midnight";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "midnight" ? "dawn" : "midnight";
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, next);
      }
      return next;
    });
  }, []);

  // On the server we render "midnight"; if the client had saved "dawn",
  // React will reconcile after hydration. To avoid a visible flash we render
  // a same-sized placeholder on the very first client render ONLY when the
  // server's markup differs. Simplest safe approach: render the button with
  // the current theme; the body bg is applied via applyTheme in the effect.
  const isDawn = theme === "dawn";
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDawn ? "midnight" : "cosmic dawn"} theme`}
      aria-pressed={isDawn}
      title={`Theme: ${isDawn ? "Cosmic Dawn" : "Midnight"}`}
      className={cn(
        "h-9 w-9 rounded-full border border-gold/50 flex items-center justify-center transition-all",
        "hover:border-gold hover:bg-gold/5 text-gold hover:text-gold-bright",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
      )}
    >
      {isDawn ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
