import type { AppLocale } from "@/i18n/config";
import HeroSwiper from "@/app/[locale]/(home)/_components/HeroSwiper";
import SacredTeachings from "@/app/[locale]/(home)/_components/SacredTeachings";
import WordsOfWisdom from "@/app/[locale]/(home)/_components/WordsOfWisdom";
import HomeSections from "@/app/[locale]/(home)/_components/HomeSections";
import SeoSchema from "@/app/[locale]/(home)/_components/SeoSchema";
import { getHomeContent } from "@/content/contentProvider";

export default async function Page({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  
  // Fetch dynamic content - falls back to static content if API unavailable
  const content = await getHomeContent(locale);
  
  return (
    <div>
      <SeoSchema locale={locale} />
      <HeroSwiper locale={locale} slides={content.heroSlides} />
      <SacredTeachings locale={locale} content={content.sacredTeachings} />
      <WordsOfWisdom locale={locale} quotes={content.quotes} />
      <HomeSections locale={locale} content={content} />
    </div>
  );
}
