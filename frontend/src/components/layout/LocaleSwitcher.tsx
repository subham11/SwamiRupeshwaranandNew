"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppLocale } from "@/i18n/config";
import { i18nConfig } from "@/i18n/config";

export default function LocaleSwitcher({ locale }: { locale: AppLocale }) {
  const pathname = usePathname();
  const rest = pathname.replace(/^\/(en|hi)/, "");

  return (
    <div className="hidden sm:flex items-center gap-1 rounded-xl border border-zinc-200 p-1 text-xs font-medium transition-colors duration-300" style={{ borderColor: 'var(--color-muted)' }}>
      {i18nConfig.locales.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest}`}
          className={`rounded-lg px-3 py-1.5 transition-colors duration-200 ${
            l === locale
              ? "text-white shadow-sm"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
          }`}
          style={l === locale ? { backgroundColor: 'var(--color-primary)' } : undefined}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
