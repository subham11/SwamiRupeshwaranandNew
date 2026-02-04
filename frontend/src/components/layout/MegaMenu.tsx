"use client";

import Link from "next/link";
import type { AppLocale } from "@/i18n/config";
import type { NavGroup } from "@/config/nav";
import { motion, AnimatePresence } from "motion/react";
import { useMemo, useState } from "react";
import clsx from "clsx";

type Props = {
  locale: AppLocale;
  groups: NavGroup[];
  labels: Record<string, string>;
};

export default function MegaMenu({ locale, groups, labels }: Props) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const topGroups = useMemo(() => groups.filter((g) => g.key !== "home"), [groups]);
  const home = groups.find((g) => g.key === "home");

  return (
    <nav className="hidden items-center gap-6 md:flex">
      {home?.links?.map((l) => (
        <Link key={l.key} href={l.href} className="text-sm text-zinc-700 hover:text-black">
          {labels[`nav.${l.key}`] ?? l.key}
        </Link>
      ))}

      {topGroups.map((group) => {
        const hasDrop = group.links.length > 1 || Boolean(group.featured);
        
        // For single-link groups without featured, render as direct link
        if (!hasDrop && group.links.length === 1) {
          return (
            <Link
              key={group.key}
              href={group.links[0].href}
              className="text-sm text-zinc-700 hover:text-black"
            >
              {labels[`nav.${group.links[0].key}`] ?? labels[`navGroup.${group.key}`] ?? group.key}
            </Link>
          );
        }
        
        return (
          <div
            key={group.key}
            className="relative"
            onMouseEnter={() => setOpenKey(group.key)}
            onMouseLeave={() => setOpenKey((k) => (k === group.key ? null : k))}
          >
            <button
              type="button"
              className={clsx(
                "text-sm text-zinc-700 hover:text-black",
                openKey === group.key && "text-black"
              )}
              aria-haspopup={hasDrop ? "menu" : undefined}
            >
              {labels[`navGroup.${group.key}`] ?? group.key}
            </button>

            <AnimatePresence>
              {hasDrop && openKey === group.key ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute left-0 top-full mt-3 w-[680px] rounded-2xl border border-zinc-100 bg-white p-5 shadow-lg"
                >
                  <div className="grid grid-cols-12 gap-5">
                    <div className="col-span-5 rounded-2xl bg-zinc-50 p-4">
                      <div className="text-sm font-semibold">
                        {group.featured ? labels[group.featured.titleKey] : labels["brand"]}
                      </div>
                      <p className="mt-2 text-sm text-zinc-600">
                        {group.featured ? labels[group.featured.descriptionKey] : labels["hero.subtitle"]}
                      </p>
                      {group.featured ? (
                        <Link
                          href={group.featured.href}
                          className="mt-4 inline-flex rounded-xl bg-black px-4 py-2 text-xs font-medium text-white"
                        >
                          {labels["cta.learnMore"] ?? "Learn more"}
                        </Link>
                      ) : null}
                    </div>

                    <div className="col-span-7 grid grid-cols-2 gap-3">
                      {group.links.map((l) => (
                        <Link
                          key={l.key}
                          href={l.href}
                          className="rounded-xl border border-zinc-100 p-3 hover:bg-zinc-50"
                        >
                          <div className="text-sm font-medium">{labels[`nav.${l.key}`] ?? l.key}</div>
                          <div className="mt-1 text-xs text-zinc-600">
                            {labels[`navDesc.${l.key}`] ?? ""}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}
