import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import type { AppLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { SacredDivider } from "@/components/ui/Decorative";

// Generate metadata for SEO
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: AppLocale }> 
}): Promise<Metadata> {
  const { locale } = await params;
  
  const titles = {
    en: "Sacred Teachings - Swami Rupeshwaranand Ji Ashram",
    hi: "पवित्र शिक्षाएं - स्वामी रूपेश्वरानंद जी आश्रम"
  };
  
  const descriptions = {
    en: "Explore timeless spiritual teachings on meditation, mantras, seva, dharma, yoga, and bhakti from Swami Rupeshwaranand Ji.",
    hi: "स्वामी रूपेश्वरानंद जी से ध्यान, मंत्र, सेवा, धर्म, योग और भक्ति पर शाश्वत आध्यात्मिक शिक्षाओं का अन्वेषण करें।"
  };
  
  return {
    title: titles[locale],
    description: descriptions[locale],
  };
}

// FUTURE: This content will come from API
const teachings = [
  {
    id: "inner-peace",
    slug: "inner-peace",
    icon: "🧘",
    title: { en: "The Art of Inner Peace", hi: "आंतरिक शांति की कला" },
    excerpt: {
      en: "Discover the timeless practices of meditation and mindfulness that lead to lasting inner tranquility.",
      hi: "ध्यान और माइंडफुलनेस की शाश्वत प्रथाओं की खोज करें जो स्थायी आंतरिक शांति की ओर ले जाती हैं।"
    },
    category: { en: "Meditation", hi: "ध्यान" },
    image: "/images/hero-1.svg"
  },
  {
    id: "mantras",
    slug: "mantras",
    icon: "🙏",
    title: { en: "Sacred Mantras", hi: "पवित्र मंत्र" },
    excerpt: {
      en: "Learn the power of sacred sounds and vibrations that connect us to the divine consciousness.",
      hi: "पवित्र ध्वनियों और कंपनों की शक्ति सीखें जो हमें दिव्य चेतना से जोड़ती हैं।"
    },
    category: { en: "Chanting", hi: "जप" },
    image: "/images/hero-2.svg"
  },
  {
    id: "seva",
    slug: "seva",
    icon: "💝",
    title: { en: "The Path of Seva", hi: "सेवा का मार्ग" },
    excerpt: {
      en: "Understanding selfless service as a spiritual practice that purifies the heart and elevates the soul.",
      hi: "निःस्वार्थ सेवा को एक आध्यात्मिक अभ्यास के रूप में समझना जो हृदय को शुद्ध करता है और आत्मा को ऊंचा उठाता है।"
    },
    category: { en: "Service", hi: "सेवा" },
    image: "/images/hero-3.svg"
  },
  {
    id: "dharma",
    slug: "dharma",
    icon: "☸️",
    title: { en: "Living with Purpose", hi: "उद्देश्य के साथ जीना" },
    excerpt: {
      en: "Find your dharma and learn to align your daily actions with your higher spiritual purpose.",
      hi: "अपने धर्म को खोजें और अपनी दैनिक क्रियाओं को अपने उच्च आध्यात्मिक उद्देश्य के साथ संरेखित करना सीखें।"
    },
    category: { en: "Dharma", hi: "धर्म" },
    image: "/images/hero-1.svg"
  },
  {
    id: "yoga",
    slug: "yoga",
    icon: "🪷",
    title: { en: "Classical Yoga", hi: "शास्त्रीय योग" },
    excerpt: {
      en: "Explore the eight limbs of yoga as prescribed by Patanjali for complete spiritual transformation.",
      hi: "पतंजलि द्वारा निर्धारित योग के आठ अंगों का अन्वेषण करें जो पूर्ण आध्यात्मिक परिवर्तन के लिए हैं।"
    },
    category: { en: "Yoga", hi: "योग" },
    image: "/images/hero-2.svg"
  },
  {
    id: "bhakti",
    slug: "bhakti",
    icon: "❤️",
    title: { en: "Devotion & Bhakti", hi: "भक्ति मार्ग" },
    excerpt: {
      en: "The path of love and devotion to the Divine, surrendering the ego to experience unity with God.",
      hi: "परमात्मा के प्रति प्रेम और भक्ति का मार्ग, अहंकार को समर्पित करके ईश्वर के साथ एकता का अनुभव करना।"
    },
    category: { en: "Bhakti", hi: "भक्ति" },
    image: "/images/hero-3.svg"
  }
];

const pageContent = {
  title: { en: "Sacred Teachings", hi: "पवित्र शिक्षाएं" },
  subtitle: { 
    en: "Ancient wisdom for modern seekers", 
    hi: "आधुनिक साधकों के लिए प्राचीन ज्ञान" 
  },
  description: {
    en: "Explore the timeless teachings that guide us on the path of spiritual awakening. From meditation and mantras to selfless service and living with purpose, discover the wisdom that transforms lives.",
    hi: "आध्यात्मिक जागृति के मार्ग पर हमें मार्गदर्शन करने वाली शाश्वत शिक्षाओं का अन्वेषण करें। ध्यान और मंत्रों से लेकर निःस्वार्थ सेवा और उद्देश्यपूर्ण जीवन तक, उस ज्ञान की खोज करें जो जीवन को बदल देता है।"
  },
  heroQuote: {
    en: "\"The real voyage of discovery consists not in seeking new landscapes, but in having new eyes.\"",
    hi: "\"खोज की वास्तविक यात्रा नए परिदृश्यों की खोज में नहीं, बल्कि नई दृष्टि रखने में है।\""
  },
  quoteAuthor: { en: "— Ancient Wisdom", hi: "— प्राचीन ज्ञान" },
  viewAll: { en: "Read Teaching", hi: "शिक्षा पढ़ें" }
};

export default async function TeachingsPage({ 
  params 
}: { 
  params: Promise<{ locale: AppLocale }> 
}) {
  const { locale } = await params;

  return (
    <main style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Hero Section */}
      <section 
        className="relative py-16 sm:py-20 md:py-24 overflow-hidden"
        style={{ backgroundColor: 'var(--color-secondary)' }}
      >
        {/* Sacred Pattern Background */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 30%, var(--color-gold) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
        
        <Container className="relative z-10 text-center">
          <div 
            className="flex items-center justify-center gap-3 mb-4"
            style={{ color: 'var(--color-gold)' }}
          >
            <span className="h-px w-8 sm:w-12 bg-current" />
            <span className="text-xs sm:text-sm font-medium uppercase tracking-widest">
              {pageContent.subtitle[locale]}
            </span>
            <span className="h-px w-8 sm:w-12 bg-current" />
          </div>
          
          <h1 
            className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold mb-6"
            style={{ color: 'var(--color-primary)' }}
          >
            {pageContent.title[locale]}
          </h1>
          
          <p 
            className="max-w-2xl mx-auto text-base sm:text-lg leading-relaxed mb-8"
            style={{ color: 'var(--color-muted)' }}
          >
            {pageContent.description[locale]}
          </p>

          {/* Quote */}
          <blockquote 
            className="max-w-xl mx-auto italic text-lg sm:text-xl font-heading"
            style={{ color: 'var(--color-primary)' }}
          >
            {pageContent.heroQuote[locale]}
            <footer 
              className="mt-2 text-sm not-italic"
              style={{ color: 'var(--color-gold)' }}
            >
              {pageContent.quoteAuthor[locale]}
            </footer>
          </blockquote>
        </Container>
      </section>

      <SacredDivider icon="📿" />

      {/* Teachings Grid */}
      <section className="py-12 sm:py-16 md:py-20">
        <Container>
          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {teachings.map((teaching) => (
              <Link
                key={teaching.id}
                href={`/${locale}/teachings/${teaching.slug}`}
                className="group block bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{ border: '1px solid var(--color-border)' }}
              >
                {/* Image */}
                <div className="relative h-40 sm:h-48 overflow-hidden">
                  <Image
                    src={teaching.image}
                    alt={teaching.title[locale]}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div 
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }}
                  />
                  {/* Category Badge */}
                  <span 
                    className="absolute top-3 left-3 px-3 py-1 text-xs font-medium rounded-full text-white"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {teaching.category[locale]}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{teaching.icon}</span>
                    <h3 
                      className="font-heading text-lg sm:text-xl font-semibold group-hover:text-opacity-80 transition-colors"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {teaching.title[locale]}
                    </h3>
                  </div>
                  <p 
                    className="text-sm sm:text-base leading-relaxed mb-4"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    {teaching.excerpt[locale]}
                  </p>
                  <span 
                    className="inline-flex items-center gap-2 text-sm font-medium"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {pageContent.viewAll[locale]}
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <SacredDivider icon="✦" />

      {/* Call to Action */}
      <section 
        className="py-12 sm:py-16 md:py-20"
        style={{ backgroundColor: 'var(--color-secondary)' }}
      >
        <Container className="text-center">
          <h2 
            className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold mb-4"
            style={{ color: 'var(--color-primary)' }}
          >
            {locale === "en" ? "Begin Your Spiritual Journey" : "अपनी आध्यात्मिक यात्रा शुरू करें"}
          </h2>
          <p 
            className="max-w-xl mx-auto text-base sm:text-lg mb-8"
            style={{ color: 'var(--color-muted)' }}
          >
            {locale === "en" 
              ? "Join our community of seekers and receive daily wisdom, meditation guidance, and spiritual insights."
              : "साधकों के हमारे समुदाय से जुड़ें और दैनिक ज्ञान, ध्यान मार्गदर्शन और आध्यात्मिक अंतर्दृष्टि प्राप्त करें।"
            }
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/${locale}/contact`}
              className="btn-primary"
            >
              {locale === "en" ? "Contact Us" : "संपर्क करें"}
            </Link>
            <Link
              href={`/${locale}/ashram`}
              className="btn-outline"
            >
              {locale === "en" ? "Visit Ashram" : "आश्रम देखें"}
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}
