import "@/app/globals.css";
import { Suspense } from "react";
import Providers from "@/app/providers";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import FloatingLanguageSwitcher from "@/components/layout/FloatingLanguageSwitcher";
import Footer from "@/components/layout/Footer";
import type { AppLocale } from "@/i18n/config";
import { isLocale, i18nConfig } from "@/i18n/config";
import { buildMetadata } from "@/lib/seo";
import { getAnnouncements } from "@/content/contentProvider";

export const dynamicParams = false;

export function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = (isLocale(localeParam) ? localeParam : i18nConfig.defaultLocale) as AppLocale;
  return buildMetadata(locale);
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = (isLocale(localeParam) ? localeParam : i18nConfig.defaultLocale) as AppLocale;
  const announcements = await getAnnouncements(locale);

  return (
    <html lang={locale}>
      <body>
        <Providers>
          <AnnouncementBar locale={locale} announcements={announcements} />
          <Suspense fallback={<div className="h-16 border-b border-zinc-100" />}>
            <Header locale={locale} />
          </Suspense>

          <main className="min-h-[70vh]">{children}</main>

          <Suspense fallback={<div className="h-24 border-t border-zinc-100" />}>
            <Footer locale={locale} />
          </Suspense>

          <FloatingLanguageSwitcher locale={locale} />
        </Providers>
      </body>
    </html>
  );
}
