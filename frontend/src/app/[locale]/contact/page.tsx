import type { Metadata } from "next";
import type { AppLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { t } from "@/content/contentProvider";
import CMSTextBlocks from "@/components/CMSTextBlocks";

// Generate metadata for SEO
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: AppLocale }> 
}): Promise<Metadata> {
  const { locale } = await params;
  
  const titles = {
    en: "Contact Us - Swami Rupeshwaranand Ji Ashram",
    hi: "संपर्क करें - स्वामी रूपेश्वरानंद जी आश्रम"
  };
  
  return {
    title: titles[locale],
  };
}

// Static page header (bilingual)
const pageHeader = {
  title: {
    en: "Contact Us",
    hi: "संपर्क करें"
  },
  subtitle: {
    en: "We'd love to hear from you",
    hi: "हम आपसे सुनना पसंद करेंगे"
  },
};

// Static fallback — only shown when CMS text blocks are not available
const fallbackSections = [
  {
    id: "contact-info",
    title: { en: "Get in Touch", hi: "संपर्क में रहें" },
    content: {
      en: "📍 Address: Swami Rupeshwaranand Ji Ashram, Village Name, District, State, India\n📞 Phone: +91 XXXXXXXXXX\n✉️ Email: info@swamirupeshwaranand.in\n🕐 Visiting Hours: Daily: 6:00 AM - 8:00 PM",
      hi: "📍 पता: स्वामी रूपेश्वरानंद जी आश्रम, गाँव का नाम, जिला, राज्य, भारत\n📞 फोन: +91 XXXXXXXXXX\n✉️ ईमेल: info@swamirupeshwaranand.in\n🕐 दर्शन का समय: प्रतिदिन: सुबह 6:00 - रात 8:00"
    }
  }
];

// Static form labels (bilingual)
const formLabels = {
  name: { en: "Your Name", hi: "आपका नाम" },
  email: { en: "Email Address", hi: "ईमेल पता" },
  subject: { en: "Subject", hi: "विषय" },
  message: { en: "Your Message", hi: "आपका संदेश" },
  submit: { en: "Send Message", hi: "संदेश भेजें" }
};

export default async function ContactPage({ 
  params 
}: { 
  params: Promise<{ locale: AppLocale }> 
}) {
  const { locale } = await params;
  
  return (
    <div className="bg-gradient-to-b from-amber-50/50 to-white dark:from-zinc-900 dark:to-zinc-950">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <Container className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-zinc-800 dark:text-zinc-100 mb-4">
            {t(pageHeader.title, locale)}
          </h1>
          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400">
            {t(pageHeader.subtitle, locale)}
          </p>
        </Container>
      </section>
      
      <Container className="pb-16 sm:pb-20 md:pb-24">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-2">
          {/* Contact Info — CMS text blocks with fallback */}
          <div className="space-y-6 sm:space-y-8">
            <div className="bg-white dark:bg-zinc-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-sm border border-zinc-100 dark:border-zinc-700">
              <CMSTextBlocks 
                pageSlug="contact" 
                locale={locale} 
                fallbackSections={fallbackSections}
              />
            </div>
          </div>
          
          {/* Contact Form */}
          <div className="bg-white dark:bg-zinc-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-sm border border-zinc-100 dark:border-zinc-700">
            <h2 className="text-xl sm:text-2xl font-semibold text-zinc-800 dark:text-zinc-100 mb-6">
              {locale === "en" ? "Send us a Message" : "हमें संदेश भेजें"}
            </h2>
            
            <form className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  {t(formLabels.name, locale)}
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  {t(formLabels.email, locale)}
                </label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  {t(formLabels.subject, locale)}
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  {t(formLabels.message, locale)}
                </label>
                <textarea 
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors resize-none"
                />
              </div>
              
              <button 
                type="submit"
                className="w-full sm:w-auto px-8 py-3 rounded-lg font-semibold text-white transition-all hover:brightness-110"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                {t(formLabels.submit, locale)}
              </button>
            </form>
          </div>
        </div>
      </Container>
    </div>
  );
}
