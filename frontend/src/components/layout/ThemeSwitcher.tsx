"use client";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setTheme } from "@/lib/themeSlice";
import { themeList } from "@/lib/themes";

export default function ThemeSwitcher() {
  const currentTheme = useAppSelector((s) => s.theme.currentTheme);
  const dispatch = useAppDispatch();

  return (
    <div className="hidden sm:flex items-center gap-1 rounded-xl border border-zinc-200 p-1 text-xs font-medium">
      {themeList.map((theme) => (
        <button
          key={theme.name}
          onClick={() => dispatch(setTheme(theme.name))}
          className={`rounded-lg px-2.5 py-1.5 transition-colors duration-200 ${
            currentTheme === theme.name
              ? "bg-black text-white shadow-sm"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
          }`}
          title={theme.label}
        >
          {theme.label.split(" ")[0]}
        </button>
      ))}
    </div>
  );
}
