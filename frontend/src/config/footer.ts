import type { AppLocale } from "@/i18n/config";

export const FOOTER_LINKS = [
  { label: "YouTube", href: "https://www.youtube.com/channel/UCguXru7RXLPGdLwqApPLqOg" },
  { label: "Facebook", href: "https://www.facebook.com/SwamiRupeshwarananda/" },
  { label: "Instagram", href: "https://www.instagram.com/swami_rupeshwaranand_official" },
  { label: "Telegram", href: "https://t.me/bajarang_baan" }
];

export function localeHome(locale: AppLocale) {
  return `/${locale}`;
}
