"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { initI18nClient } from "@/i18n/i18n.client";
import type { AppLocale } from "@/i18n/config";

export function useT(locale: AppLocale) {
  useMemo(() => initI18nClient(locale), [locale]);
  return useTranslation("common");
}
