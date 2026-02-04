import type { Metadata } from "next";
import type { AppLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { t } from "@/content/contentProvider";
import Image from "next/image";

// Generate metadata for SEO
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: AppLocale }> 
}): Promise<Metadata> {
  const { locale } = await params;
  
  const titles = {
    en: "About the Ashram - A Sanctuary of Peace & Spirituality",
    hi: "आश्रम के बारे में - शांति और आध्यात्मिकता का अभयारण्य"
  };
  
  const descriptions = {
    en: "Visit our sacred ashram, a peaceful retreat for meditation, spiritual growth, and community service in the heart of India.",
    hi: "हमारे पवित्र आश्रम का दौरा करें, भारत के हृदय में ध्यान, आध्यात्मिक विकास और सामुदायिक सेवा के लिए एक शांतिपूर्ण विश्राम स्थल।"
  };
  
  return {
    title: titles[locale],
    description: descriptions[locale],
  };
}

// Static page content (bilingual)
const pageData = {
  title: {
    en: "Welcome to the Ashram",
    hi: "आश्रम में आपका स्वागत है"
  },
  subtitle: {
    en: "A Sanctuary of Peace and Spiritual Growth",
    hi: "शांति और आध्यात्मिक विकास का अभयारण्य"
  },
  description: {
    en: "Nestled in the serene landscapes of India, our ashram serves as a sacred space for seekers from all walks of life. Here, ancient wisdom meets modern understanding, creating an environment conducive to spiritual growth, meditation, and self-discovery.",
    hi: "भारत के शांत परिदृश्यों में बसा, हमारा आश्रम सभी क्षेत्रों के साधकों के लिए एक पवित्र स्थान के रूप में कार्य करता है। यहां, प्राचीन ज्ञान आधुनिक समझ से मिलता है, जो आध्यात्मिक विकास, ध्यान और आत्म-खोज के लिए अनुकूल वातावरण बनाता है।"
  },
  features: [
    {
      id: "meditation",
      icon: "🧘",
      title: { en: "Meditation Halls", hi: "ध्यान कक्ष" },
      description: { en: "Peaceful spaces designed for deep meditation and contemplation", hi: "गहन ध्यान और चिंतन के लिए डिज़ाइन किए गए शांतिपूर्ण स्थान" }
    },
    {
      id: "accommodation",
      icon: "🏠",
      title: { en: "Guest Accommodation", hi: "अतिथि आवास" },
      description: { en: "Simple, clean rooms for visitors seeking spiritual retreat", hi: "आध्यात्मिक विश्राम चाहने वाले आगंतुकों के लिए सादे, स्वच्छ कमरे" }
    },
    {
      id: "garden",
      icon: "🌳",
      title: { en: "Sacred Gardens", hi: "पवित्र उद्यान" },
      description: { en: "Beautiful gardens for walking meditation and reflection", hi: "चलते हुए ध्यान और चिंतन के लिए सुंदर उद्यान" }
    },
    {
      id: "kitchen",
      icon: "🍲",
      title: { en: "Sattvic Kitchen", hi: "सात्विक रसोई" },
      description: { en: "Pure vegetarian meals prepared with love and devotion", hi: "प्रेम और भक्ति से तैयार शुद्ध शाकाहारी भोजन" }
    }
  ]
};

export default async function AshramPage({ 
  params 
}: { 
  params: Promise<{ locale: AppLocale }> 
}) {
  const { locale } = await params;
  
  return (
    <div className="bg-gradient-to-b from-amber-50/50 to-white dark:from-zinc-900 dark:to-zinc-950">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 md:py-24 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, var(--color-gold) 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}
        />
        
        <Container className="relative z-10 text-center">
          <div 
            className="flex items-center justify-center gap-3 mb-4"
            style={{ color: 'var(--color-gold)' }}
          >
            <span className="h-px w-8 sm:w-12 bg-current" />
            <span className="text-2xl sm:text-3xl">🙏</span>
            <span className="h-px w-8 sm:w-12 bg-current" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-zinc-800 dark:text-zinc-100 mb-4">
            {t(pageData.title, locale)}
          </h1>
          
          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            {t(pageData.subtitle, locale)}
          </p>
        </Container>
      </section>
      
      {/* Description */}
      <Container className="pb-12 sm:pb-16">
        <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-4xl mx-auto text-center">
          {t(pageData.description, locale)}
        </p>
      </Container>
      
      {/* Features Grid */}
      <Container className="pb-16 sm:pb-20 md:pb-24">
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {pageData.features.map((feature) => (
            <div 
              key={feature.id}
              className="bg-white dark:bg-zinc-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-sm border border-zinc-100 dark:border-zinc-700 text-center hover:shadow-md transition-shadow"
            >
              <span className="text-4xl sm:text-5xl mb-4 block">{feature.icon}</span>
              <h3 className="text-lg sm:text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
                {t(feature.title, locale)}
              </h3>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                {t(feature.description, locale)}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
