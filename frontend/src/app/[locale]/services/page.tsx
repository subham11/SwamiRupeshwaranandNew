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
    en: "Our Services - Spiritual & Poojan Services",
    hi: "हमारी सेवाएं - आध्यात्मिक और पूजन सेवाएं"
  };
  
  return {
    title: titles[locale],
  };
}

// Static page content (bilingual)
const pageData = {
  title: {
    en: "Our Services",
    hi: "हमारी सेवाएं"
  },
  subtitle: {
    en: "Spiritual offerings for your journey",
    hi: "आपकी आध्यात्मिक यात्रा के लिए सेवाएं"
  },
  description: {
    en: "We offer a variety of spiritual services to support your journey towards inner peace and divine connection.",
    hi: "हम आंतरिक शांति और दिव्य संबंध की ओर आपकी यात्रा का समर्थन करने के लिए विभिन्न आध्यात्मिक सेवाएं प्रदान करते हैं।"
  }
};

// Static fallback — only shown when CMS text blocks are not available
const fallbackSections = [
  {
    id: "services-intro",
    title: { en: "Our Services", hi: "हमारी सेवाएं" },
    content: {
      en: "We offer a variety of spiritual services to support your journey towards inner peace and divine connection.",
      hi: "हम आंतरिक शांति और दिव्य संबंध की ओर आपकी यात्रा का समर्थन करने के लिए विभिन्न आध्यात्मिक सेवाएं प्रदान करते हैं।"
    }
  }
];

export default async function ServicesPage({ 
  params 
}: { 
  params: Promise<{ locale: AppLocale }> 
}) {
  const { locale } = await params;
  const bundle = await cms.getBundle();
  const services = [...bundle.services].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-gradient-to-b from-amber-50/50 to-white dark:from-zinc-900 dark:to-zinc-950">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, var(--color-gold) 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}
        />
        
        <Container className="relative z-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-zinc-800 dark:text-zinc-100 mb-4">
            {t(pageData.title, locale)}
          </h1>
          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-6">
            {t(pageData.subtitle, locale)}
          </p>
        </Container>
      </section>

      {/* CMS Text Blocks — editable intro content */}
      <Container className="pb-8">
        <div className="max-w-4xl mx-auto">
          <CMSTextBlocks 
            pageSlug="services" 
            locale={locale} 
            fallbackSections={fallbackSections}
          />
        </div>
      </Container>
      
      {/* Services Grid */}
      <Container className="pb-16 sm:pb-20 md:pb-24">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div 
              key={service.slug} 
              id={service.slug}
              className="bg-white dark:bg-zinc-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-700 hover:shadow-lg transition-shadow group"
            >
              {service.heroImage && (
                <div className="relative h-40 sm:h-48 overflow-hidden">
                  <Image
                    src={service.heroImage}
                    alt={service.title[locale] || "Service"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              
              <div className="p-5 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
                  {service.title[locale]}
                </h3>
                <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 line-clamp-3">
                  {service.shortDescription[locale]}
                </p>
                
                {service.longDescription && (
                  <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500 line-clamp-2">
                    {service.longDescription[locale]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
