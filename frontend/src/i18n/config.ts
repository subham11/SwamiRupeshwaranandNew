export const i18nConfig = {
  locales: ["en", "hi"] as const,
  defaultLocale: "en" as const
};

export type AppLocale = (typeof i18nConfig.locales)[number];

export function isLocale(v: string): v is AppLocale {
  return (i18nConfig.locales as readonly string[]).includes(v);
}
