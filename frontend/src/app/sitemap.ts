import { i18nConfig } from "@/i18n/config";

// Required for static export compatibility
export const dynamic = 'force-static';

export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const paths = ["", "/swamiji", "/ashram", "/services", "/events", "/donation", "/contact"];

  return i18nConfig.locales.flatMap((locale) =>
    paths.map((p) => ({
      url: `${baseUrl}/${locale}${p}`,
      lastModified: new Date().toISOString()
    }))
  );
}
