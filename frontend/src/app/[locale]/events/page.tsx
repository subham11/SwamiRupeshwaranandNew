import type { Metadata } from "next";
import type { AppLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { cms } from "@/cms";
import { t } from "@/content/contentProvider";
import Image from "next/image";
import CMSTextBlocks from "@/components/CMSTextBlocks";

// Generate metadata for SEO
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: AppLocale }> 
}): Promise<Metadata> {
  const { locale } = await params;
  
  const titles = {
    en: "Upcoming Events - Swami Rupeshwaranand Ji Ashram",
    hi: "आगामी कार्यक्रम - स्वामी रूपेश्वरानंद जी आश्रम"
  };
  
  return {
    title: titles[locale],
  };
}

// Static page content (bilingual)
const pageData = {
  title: {
    en: "Upcoming Events",
    hi: "आगामी कार्यक्रम"
  },
  subtitle: {
    en: "Join us for spiritual gatherings and celebrations",
    hi: "आध्यात्मिक सभाओं और उत्सवों में हमसे जुड़ें"
  },
  noEvents: {
    en: "No upcoming events at the moment. Please check back soon!",
    hi: "इस समय कोई आगामी कार्यक्रम नहीं है। कृपया जल्दी ही दोबारा देखें!"
  }
};

// Static fallback — only shown when CMS text blocks are not available
const fallbackSections = [
  {
    id: "events-intro",
    title: { en: "Upcoming Events", hi: "आगामी कार्यक्रम" },
    content: {
      en: "Join us for spiritual gatherings and celebrations.",
      hi: "आध्यात्मिक सभाओं और उत्सवों में हमसे जुड़ें।"
    }
  }
];

function fmtDate(iso: string, locale: AppLocale) {
  try {
    return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function getDateParts(iso: string) {
  const date = new Date(iso);
  return {
    day: date.getDate(),
    month: date.toLocaleString('en', { month: 'short' }).toUpperCase()
  };
}

export default async function EventsPage({ 
  params 
}: { 
  params: Promise<{ locale: AppLocale }> 
}) {
  const { locale } = await params;
  const bundle = await cms.getBundle();
  const upcoming = bundle.events.filter((e) => e.status === "upcoming");

  return (
    <div className="bg-gradient-to-b from-amber-50/50 to-white dark:from-zinc-900 dark:to-zinc-950">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <Container className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-zinc-800 dark:text-zinc-100 mb-4">
            {t(pageData.title, locale)}
          </h1>
          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            {t(pageData.subtitle, locale)}
          </p>
        </Container>
      </section>

      {/* CMS Text Blocks — editable intro content */}
      <Container className="pb-8">
        <div className="max-w-4xl mx-auto">
          <CMSTextBlocks 
            pageSlug="events" 
            locale={locale} 
            fallbackSections={fallbackSections}
          />
        </div>
      </Container>
      
      {/* Events List */}
      <Container className="pb-16 sm:pb-20 md:pb-24">
        {upcoming.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">📅</span>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              {t(pageData.noEvents, locale)}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => {
              const dateParts = getDateParts(event.startAt);
              return (
                <div 
                  key={event.id}
                  className="bg-white dark:bg-zinc-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-700 hover:shadow-lg transition-shadow"
                >
                  {event.heroImage && (
                    <div className="relative h-40 sm:h-48">
                      <Image
                        src={event.heroImage}
                        alt={event.title[locale] || "Event"}
                        fill
                        className="object-cover"
                      />
                      {/* Date Badge */}
                      <div className="absolute top-3 left-3 bg-white dark:bg-zinc-900 rounded-lg p-2 sm:p-3 text-center shadow-lg">
                        <div className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                          {dateParts.day}
                        </div>
                        <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          {dateParts.month}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-5 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
                      {event.title[locale]}
                    </h3>
                    
                    <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-3">
                      {fmtDate(event.startAt, locale)}
                    </p>
                    
                    <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
                      {event.description[locale]}
                    </p>
                    
                    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500">
                      <span>📍</span>
                      <span>{event.location[locale]}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
