"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/lib/hooks";
import { themes } from "@/lib/themes";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const currentTheme = useAppSelector((s) => s.theme.currentTheme);

  useEffect(() => {
    const theme = themes[currentTheme];
    if (!theme) return;

    // Apply CSS variables to root element
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply theme name as data attribute for additional styling
    root.setAttribute("data-theme", currentTheme);
  }, [currentTheme]);

  return <>{children}</>;
}
