import Script from "next/script";
import type { AppLocale } from "@/i18n/config";
import { siteMeta } from "@/lib/seo";

export default function SeoSchema({ locale }: { locale: AppLocale }) {
  const { baseUrl, siteName, description } = siteMeta(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": siteName,
        "url": baseUrl,
        "sameAs": [
          "https://www.youtube.com/channel/UCguXru7RXLPGdLwqApPLqOg",
          "https://www.facebook.com/SwamiRupeshwarananda/",
          "https://www.instagram.com/swami_rupeshwaranand_official",
          "https://t.me/bajarang_baan"
        ]
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "url": baseUrl,
        "name": siteName,
        "description": description,
        "publisher": { "@id": `${baseUrl}/#organization` },
        "inLanguage": locale === "hi" ? "hi-IN" : "en"
      }
    ]
  };

  return (
    <Script id="schema-org" type="application/ld+json" strategy="afterInteractive">
      {JSON.stringify(jsonLd)}
    </Script>
  );
}
