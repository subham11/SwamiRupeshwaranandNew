"use client";

import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import type { AppLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { motion } from "motion/react";
import { type HeroSlide } from "@/content/pageContent";
import { t } from "@/content/contentProvider";

interface HeroSwiperProps {
  locale: AppLocale;
  slides?: HeroSlide[];
}

// Default slides - used as fallback when no slides prop provided
const defaultSlides: HeroSlide[] = [
  {
    id: "hero-1",
    imageUrl: "/images/hero-1.svg",
    title: {
      en: "Divine Guidance For Modern Life",
      hi: "आधुनिक जीवन के लिए दैवीय मार्गदर्शन"
    },
    subtitle: {
      en: "Discover the path to inner peace and spiritual awakening",
      hi: "आंतरिक शांति और आध्यात्मिक जागृति का मार्ग खोजें"
    },
    ctaText: { en: "Explore Now", hi: "अभी खोजें" },
    ctaLink: "/swamiji"
  },
  {
    id: "hero-2",
    imageUrl: "/images/hero-2.svg",
    title: {
      en: "Daily Inspirations & Teachings",
      hi: "दैनिक प्रेरणा और शिक्षाएं"
    },
    subtitle: {
      en: "Ancient wisdom for contemporary challenges",
      hi: "समकालीन चुनौतियों के लिए प्राचीन ज्ञान"
    },
    ctaText: { en: "Learn More", hi: "और जानें" },
    ctaLink: "/teachings"
  },
  {
    id: "hero-3",
    imageUrl: "/images/hero-3.svg",
    title: {
      en: "Path to Inner Peace",
      hi: "आंतरिक शांति का मार्ग"
    },
    subtitle: {
      en: "Find tranquility through meditation and devotion",
      hi: "ध्यान और भक्ति के माध्यम से शांति पाएं"
    },
    ctaText: { en: "Start Journey", hi: "यात्रा शुरू करें" },
    ctaLink: "/ashram"
  },
  {
    id: "hero-4",
    imageUrl: "/images/hero-1.svg",
    title: {
      en: "Ancient Wisdom for Today",
      hi: "आज के लिए प्राचीन ज्ञान"
    },
    subtitle: {
      en: "Sacred teachings from the Himalayan tradition",
      hi: "हिमालयी परंपरा से पवित्र शिक्षाएं"
    },
    ctaText: { en: "Discover", hi: "खोजें" },
    ctaLink: "/services"
  },
  {
    id: "hero-5",
    imageUrl: "/images/hero-2.svg",
    title: {
      en: "Spiritual Awakening Awaits",
      hi: "आध्यात्मिक जागृति आपकी प्रतीक्षा में"
    },
    subtitle: {
      en: "Join our community of seekers and devotees",
      hi: "साधकों और भक्तों के हमारे समुदाय से जुड़ें"
    },
    ctaText: { en: "Join Now", hi: "अभी जुड़ें" },
    ctaLink: "/contact"
  }
];

export default function HeroSwiper({ locale, slides }: HeroSwiperProps) {
  // Use provided slides or fall back to defaults
  const heroSlides = slides && slides.length > 0 ? slides : defaultSlides;
  
  const secondaryCta = {
    en: "Meet Swamiji",
    hi: "स्वामीजी से मिलें"
  };

  const welcomeText = {
    en: "Welcome to the Ashram",
    hi: "आश्रम में आपका स्वागत है"
  };

  return (
    <section className="w-full relative">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ 
          clickable: true,
          bulletActiveClass: 'swiper-pagination-bullet-active',
        }}
        effect="fade"
        loop={true}
        className="w-full hero-swiper"
      >
        {heroSlides.map((s, index) => (
          <SwiperSlide key={s.id}>
            {/* Responsive hero height */}
            <div className="relative h-[60vh] sm:h-[65vh] md:h-[70vh] min-h-[400px] sm:min-h-[500px] max-h-[800px] w-full">
              {/* Background Image */}
              <Image
                src={s.imageUrl}
                alt={t(s.title, locale)}
                fill
                priority={index === 0}
                className="object-cover"
                sizes="100vw"
              />
              
              {/* Gradient Overlay - Responsive positioning */}
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to left, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 40%, transparent 70%)'
                }}
              />
              
              {/* Mobile-friendly center gradient */}
              <div 
                className="absolute inset-0 md:hidden"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)'
                }}
              />
              
              {/* Sacred Pattern Overlay */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `radial-gradient(circle at 25% 25%, var(--color-gold) 1px, transparent 1px)`,
                  backgroundSize: '50px 50px'
                }}
              />

              <Container className="h-full">
                {/* Responsive layout - centered on mobile, right-aligned on desktop */}
                <div className="relative z-10 flex h-full items-end pb-16 sm:pb-20 md:items-center md:pb-0 justify-center md:justify-end">
                  <motion.div 
                    className="max-w-2xl text-center md:text-right px-4 sm:px-0"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {/* Decorative element above title - hidden on small mobile */}
                    <div 
                      className="hidden sm:flex items-center gap-3 mb-4 justify-center md:justify-end"
                      style={{ color: 'var(--color-gold)' }}
                    >
                      <span className="text-xs sm:text-sm font-medium uppercase tracking-widest">
                        {t(welcomeText, locale)}
                      </span>
                      <span className="h-px w-8 sm:w-12 bg-current" />
                    </div>

                    {/* Title - Responsive text sizes */}
                    <h1 
                      className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-semibold text-white leading-tight mb-3 sm:mb-4 md:mb-6"
                    >
                      {t(s.title, locale)}
                    </h1>

                    {/* Description - Responsive */}
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 leading-relaxed mb-4 sm:mb-6 md:mb-8 mx-auto md:ml-auto md:mr-0 max-w-xl">
                      {t(s.subtitle, locale)}
                    </p>

                    {/* CTA Buttons - Stack on mobile, row on larger screens */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-end">
                      <Link
                        href={`/${locale}${s.ctaLink}`}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium rounded-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                        style={{ 
                          backgroundColor: 'var(--color-gold)',
                          color: 'var(--color-foreground)'
                        }}
                      >
                        {t(s.ctaText, locale)}
                        <span>→</span>
                      </Link>
                      <Link
                        href={`/${locale}/swamiji`}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium rounded-md border-2 border-white/50 text-white transition-all duration-300 hover:bg-white/10 hover:-translate-y-1"
                      >
                        {t(secondaryCta, locale)}
                      </Link>
                    </div>
                  </motion.div>
                </div>
              </Container>

              {/* Slide Counter - Hidden on mobile */}
              <div className="absolute bottom-8 left-8 hidden lg:flex items-center gap-2 text-white/70 text-sm font-medium">
                <span className="text-2xl font-heading" style={{ color: 'var(--color-gold)' }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="h-px w-8 bg-white/30" />
                <span>{String(heroSlides.length).padStart(2, '0')}</span>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Swiper Pagination Styles */}
      <style jsx global>{`
        .hero-swiper .swiper-pagination {
          bottom: 30px !important;
        }
        .hero-swiper .swiper-pagination-bullet {
          width: 12px;
          height: 12px;
          background: rgba(255,255,255,0.5);
          opacity: 1;
          transition: all 0.3s ease;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          background: var(--color-gold);
          transform: scale(1.2);
        }
      `}</style>
    </section>
  );
}
