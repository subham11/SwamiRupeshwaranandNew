import type { Metadata } from "next";
import type { AppLocale } from "@/i18n/config";

export function siteMeta(locale: AppLocale) {
  const siteName = locale === "hi" ? "स्वामी रुपेश्वरानंद" : "Swami Rupeshwaranand";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const title = locale === "hi" ? "आश्रम, सत्संग, पूजन सेवाएं" : "Ashram, Satsang, Poojan Services";
  const description =
    locale === "hi"
      ? "स्वामी रुपेश्वरानंद जी की आधिकारिक वेबसाइट। कार्यक्रम, पूजन सेवाएं, मीडिया और संपर्क।"
      : "Official website for Swami Rupeshwaranand Ji. Events, poojan services, media, and contact.";
  const ogImage = `${baseUrl}/images/og-${locale}.svg`;

  return { siteName, baseUrl, title, description, ogImage };
}

export function buildMetadata(locale: AppLocale, path: string = ""): Metadata {
  const { siteName, baseUrl, title, description, ogImage } = siteMeta(locale);

  const url = `${baseUrl}/${locale}${path}`;

  return {
    metadataBase: new URL(baseUrl),
    title: { default: siteName, template: `%s | ${siteName}` },
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${baseUrl}/en${path}`,
        hi: `${baseUrl}/hi${path}`
      }
    },
    openGraph: {
      type: "website",
      url,
      siteName,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteName }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage]
    },
    robots: {
      index: true,
      follow: true
    }
  };
}
