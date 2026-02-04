import type { AppLocale } from "@/i18n/config";
import en from "@/locales/en/common.json";
import hi from "@/locales/hi/common.json";

export type DictType = typeof en;

const dict = { en, hi } as const;

export function getDict(locale: AppLocale): DictType {
  return dict[locale];
}
