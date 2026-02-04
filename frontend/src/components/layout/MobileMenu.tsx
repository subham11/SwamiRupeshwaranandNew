"use client";

import Link from "next/link";
import type { AppLocale } from "@/i18n/config";
import type { NavGroup } from "@/config/nav";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setMobileMenuOpen } from "@/lib/uiSlice";
import { useAuth } from "@/lib/useAuth";
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
  const { isAuthenticated, user, logout } = useAuth();

  const authLabels = {
    login: locale === 'en' ? 'Login' : 'लॉगिन',
    dashboard: locale === 'en' ? 'Dashboard' : 'डैशबोर्ड',
    logout: locale === 'en' ? 'Logout' : 'लॉगआउट',
  };

  const handleLogout = () => {
    logout();
    dispatch(setMobileMenuOpen(false));
  };

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

              {/* Auth Section */}
              <div className="border-t border-zinc-200 pt-4">
                {isAuthenticated ? (
                  <div className="grid gap-2">
                    <div className="text-xs font-semibold text-zinc-500 mb-1">
                      {user?.name || user?.email?.split('@')[0]}
                    </div>
                    <Link
                      href={`/${locale}/dashboard`}
                      className="text-sm text-zinc-800"
                      onClick={() => dispatch(setMobileMenuOpen(false))}
                    >
                      {authLabels.dashboard}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-sm text-red-600 text-left"
                    >
                      {authLabels.logout}
                    </button>
                  </div>
                ) : (
                  <Link
                    href={`/${locale}/login`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-zinc-800"
                    onClick={() => dispatch(setMobileMenuOpen(false))}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    {authLabels.login}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
