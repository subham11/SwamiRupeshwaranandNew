"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppLocale } from "@/i18n/config";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setTheme } from "@/lib/themeSlice";
import { themes, type ThemeName } from "@/lib/themes";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const themeList = Object.values(themes);

export default function FloatingLanguageSwitcher({ locale }: { locale: AppLocale }) {
  const pathname = usePathname();
  const rest = pathname.replace(/^\/(en|hi)/, "");
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  const currentTheme = useAppSelector((s) => s.theme.currentTheme);
  const dispatch = useAppDispatch();

  const nextLocale = locale === "en" ? "hi" : "en";

  return (
    <div className="fixed top-24 right-6 z-[9999] flex flex-col items-end gap-3">
      {/* Theme Switcher Dropdown */}
      <AnimatePresence>
        {isThemeOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 right-0 bg-white rounded-2xl shadow-2xl border p-2 flex flex-col gap-1 w-52 backdrop-blur-lg"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted border-b mb-1" style={{ borderColor: 'var(--color-border)' }}>
              {locale === "en" ? "Choose Theme" : "थीम चुनें"}
            </div>
            {themeList.map((theme) => (
              <button
                key={theme.name}
                onClick={() => {
                  dispatch(setTheme(theme.name));
                  setIsThemeOpen(false);
                }}
                className={`text-left px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium flex items-center gap-3 ${
                  currentTheme === theme.name
                    ? "text-white shadow-md"
                    : "text-zinc-700 hover:bg-zinc-50"
                }`}
                style={currentTheme === theme.name ? { backgroundColor: theme.colors.primary } : undefined}
              >
                <span 
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                {locale === "en" ? theme.label : theme.labelHi}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theme Toggle Button */}
      <button
        onClick={() => setIsThemeOpen(!isThemeOpen)}
        className="w-14 h-14 rounded-full border-2 flex items-center justify-center text-xl transition-all duration-300 hover:scale-105 shadow-sacred bg-white"
        style={{ 
          borderColor: 'var(--color-primary)', 
          color: 'var(--color-primary)' 
        }}
        aria-label={locale === "en" ? "Change theme" : "थीम बदलें"}
      >
        🎨
      </button>

      {/* Simple Circular Language Toggle Button */}
      <Link
        href={`/${nextLocale}${rest}`}
        className="w-14 h-14 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 hover:scale-105 shadow-sacred bg-white font-body"
        style={{ 
          borderColor: 'var(--color-primary)', 
          color: 'var(--color-primary)' 
        }}
        title={locale === "en" ? "हिंदी में देखें" : "View in English"}
      >
        {/* Show the opposite language - what user will switch TO */}
        {locale === "en" ? "हिन्दी" : "EN"}
      </Link>
    </div>
  );
}
