"use client";

import i18n, { type Resource } from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "@/i18n/resources";
import { i18nConfig, type AppLocale } from "@/i18n/config";

const RES = resources as unknown as Resource;

export function initI18nClient(locale: AppLocale) {
  if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources: RES,
      lng: locale,
      fallbackLng: i18nConfig.defaultLocale,
      defaultNS: "common",
      ns: ["common"],
      interpolation: { escapeValue: false }
    });
  } else if (i18n.language !== locale) {
    i18n.changeLanguage(locale);
  }
  return i18n;
}
