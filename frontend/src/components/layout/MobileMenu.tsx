"use client";

import Link from "next/link";
import type { AppLocale } from "@/i18n/config";
import type { NavGroup } from "@/config/nav";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setMobileMenuOpen } from "@/lib/uiSlice";
import { motion, AnimatePresence } from "motion/react";

export default function MobileMenu({
  locale,
  navGroups,
  labels
}: {
  locale: AppLocale;
  navGroups: NavGroup[];
  labels: Record<string, string>;
}) {
  const open = useAppSelector((s) => s.ui.mobileMenuOpen);
  const dispatch = useAppDispatch();

  return (
    <div className="md:hidden">
      <button
        aria-label="Open menu"
        className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
        onClick={() => dispatch(setMobileMenuOpen(!open))}
      >
        Menu
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-0 right-0 top-16 border-b border-zinc-100 bg-white"
          >
            <div className="mx-auto max-w-6xl px-4 py-4 grid gap-6">
              {navGroups.map((g) => (
                <div key={g.key}>
                  {g.key !== "home" ? (
                    <div className="text-xs font-semibold text-zinc-500 mb-2">
                      {labels[`navGroup.${g.key}`] ?? g.key}
                    </div>
                  ) : null}

                  <div className="grid gap-2">
                    {g.links.map((item) => (
                      <Link
                        key={item.key}
                        href={item.href}
                        className="text-sm text-zinc-800"
                        onClick={() => dispatch(setMobileMenuOpen(false))}
                      >
                        {labels[`nav.${item.key}`] ?? item.key}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
