"use client";

import Link from "next/link";
import { useState } from "react";
import type { AppLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/Decorative";
import { motion, AnimatePresence } from "motion/react";
import { type TeachingCard, type LocalizedText, type SectionContent } from "@/content/pageContent";
import { t } from "@/content/contentProvider";

// Extended teaching card with full description
interface ExtendedTeachingCard extends TeachingCard {
  fullDescription?: LocalizedText;
}

// Default section content
const defaultSectionContent: SectionContent = {
  title: { en: "Sacred Teachings", hi: "पवित्र शिक्षाएं" },
  subtitle: { en: "Timeless wisdom for modern living", hi: "आधुनिक जीवन के लिए कालजयी ज्ञान" }
};

// Default cards - used as fallback
const defaultCards: ExtendedTeachingCard[] = [
  {
    id: "teaching-1",
    slug: "inner-peace",
    icon: "🙏",
    imageUrl: "/images/hero-1.svg",
    title: { en: "Path to Inner Peace", hi: "आंतरिक शांति का मार्ग" },
    description: {
      en: "Discover ancient techniques for finding tranquility in the modern world through meditation and mindful living.",
      hi: "ध्यान और सचेत जीवन के माध्यम से आधुनिक दुनिया में शांति पाने की प्राचीन तकनीकें खोजें।"
    },
    fullDescription: {
      en: "In the hustle of modern life, finding inner peace seems like a distant dream. Swami Ji teaches that peace is not something external to be found, but an internal state to be uncovered. Through daily meditation practice, mindful breathing, and conscious living, we can peel away the layers of stress and anxiety that cloud our natural state of serenity.",
      hi: "आधुनिक जीवन की भागदौड़ में, आंतरिक शांति पाना एक दूर का सपना लगता है। स्वामी जी सिखाते हैं कि शांति कोई बाहरी चीज़ नहीं है जो खोजी जाए, बल्कि यह एक आंतरिक अवस्था है जिसे उजागर किया जाना है। दैनिक ध्यान अभ्यास, सचेत श्वास और जागरूक जीवन के माध्यम से, हम तनाव और चिंता की उन परतों को हटा सकते हैं जो हमारी प्राकृतिक शांति की स्थिति को ढक देती हैं।"
    },
    link: "/teachings/inner-peace"
  },
  {
    id: "teaching-2",
    slug: "mantras",
    icon: "📿",
    imageUrl: "/images/hero-2.svg",
    title: { en: "Power of Mantras", hi: "मंत्रों की शक्ति" },
    description: {
      en: "Learn how sacred sounds and vibrations can transform your consciousness and connect you with the divine.",
      hi: "जानें कैसे पवित्र ध्वनियां और कंपन आपकी चेतना को बदल सकते हैं।"
    },
    fullDescription: {
      en: "Mantras are not mere words but powerful vibrations that have been passed down through millennia. When chanted with devotion and proper understanding, they create resonance patterns that align our mind, body, and spirit with cosmic frequencies. Swami Ji guides seekers in the authentic practice of mantra sadhana, revealing the science behind these sacred sounds.",
      hi: "मंत्र केवल शब्द नहीं हैं बल्कि शक्तिशाली कंपन हैं जो सहस्राब्दियों से चले आ रहे हैं। जब भक्ति और उचित समझ के साथ जप किया जाता है, तो वे ऐसे अनुनाद पैटर्न बनाते हैं जो हमारे मन, शरीर और आत्मा को ब्रह्मांडीय आवृत्तियों के साथ संरेखित करते हैं।"
    },
    link: "/teachings/mantras"
  },
  {
    id: "teaching-3",
    slug: "seva",
    icon: "🙏🏻",
    imageUrl: "/images/hero-3.svg",
    title: { en: "Service to Humanity", hi: "मानवता की सेवा" },
    description: {
      en: "Understand why selfless service (Seva) is considered the highest form of spiritual practice.",
      hi: "समझें कि निःस्वार्थ सेवा (सेवा) को सर्वोच्च आध्यात्मिक अभ्यास क्यों माना जाता है।"
    },
    fullDescription: {
      en: "Seva, or selfless service, is the purest expression of spiritual love. When we serve others without expectation of reward, we dissolve the boundaries of ego and experience the oneness of all existence. The ashram provides numerous opportunities for seva, from feeding the hungry to teaching the young, each act becoming a prayer in motion.",
      hi: "सेवा, या निःस्वार्थ सेवा, आध्यात्मिक प्रेम की शुद्धतम अभिव्यक्ति है। जब हम बिना किसी प्रतिफल की अपेक्षा के दूसरों की सेवा करते हैं, तो हम अहंकार की सीमाओं को भंग कर देते हैं और सभी अस्तित्व की एकता का अनुभव करते हैं।"
    },
    link: "/teachings/seva"
  },
  {
    id: "teaching-4",
    slug: "dharma",
    icon: "🙏🏼",
    imageUrl: "/images/hero-1.svg",
    title: { en: "Living with Purpose", hi: "उद्देश्य के साथ जीना" },
    description: {
      en: "Find your dharma and learn to align your daily actions with your higher spiritual purpose.",
      hi: "अपने धर्म को खोजें और अपनी दैनिक क्रियाओं को उच्च आध्यात्मिक उद्देश्य के साथ संरेखित करें।"
    },
    fullDescription: {
      en: "Dharma is your unique path, the sacred duty that gives meaning to your existence. Swami Ji helps seekers discover their true calling and align their daily actions with their higher purpose. When we live in accordance with our dharma, every moment becomes meaningful, every action becomes worship, and life flows with grace and fulfillment.",
      hi: "धर्म आपका अनूठा मार्ग है, वह पवित्र कर्तव्य जो आपके अस्तित्व को अर्थ देता है। स्वामी जी साधकों को उनकी सच्ची बुलाहट खोजने और उनकी दैनिक क्रियाओं को उनके उच्च उद्देश्य के साथ संरेखित करने में मदद करते हैं।"
    },
    link: "/teachings/dharma"
  }
];

interface SacredTeachingsProps {
  locale: AppLocale;
  content?: {
    section: SectionContent;
    cards: TeachingCard[];
  };
}

export default function SacredTeachings({ locale, content }: SacredTeachingsProps) {
  // Use provided content or fall back to defaults
  const sectionContent = content?.section || defaultSectionContent;
  const teachingCards: ExtendedTeachingCard[] = content?.cards && content.cards.length > 0 
    ? content.cards.map(card => ({
        ...card,
        fullDescription: defaultCards.find(dc => dc.slug === card.slug)?.fullDescription
      }))
    : defaultCards;
  
  const [selectedTeaching, setSelectedTeaching] = useState<ExtendedTeachingCard | null>(null);

  return (
    <>
      <section 
        className="py-12 sm:py-16 md:py-20 lg:py-24 relative overflow-hidden"
        style={{ backgroundColor: 'var(--color-secondary)' }}
      >
        {/* Sacred Pattern Background */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, var(--color-gold) 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}
        />
        
        <Container className="relative z-10">
          <SectionHeading 
            title={t(sectionContent.title, locale)}
            subtitle={t(sectionContent.subtitle, locale)}
          />

          {/* Responsive grid - 1 col mobile, 2 cols tablet, 4 cols desktop */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {teachingCards.map((teaching) => (
              <div key={teaching.id} className="flex flex-col">
                {/* Card - Click to open modal */}
                <button
                  onClick={() => setSelectedTeaching(teaching)}
                  className="group text-left flex-1 bg-white dark:bg-zinc-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-zinc-700 flex flex-col items-center text-center"
                >
                  {/* Large Emoji Icon */}
                  <div className="mb-4 sm:mb-6 transform transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1">
                    <span className="text-5xl sm:text-6xl lg:text-7xl">{teaching.icon}</span>
                  </div>

                  {/* Title */}
                  <h3 
                    className="font-heading text-lg sm:text-xl font-semibold mb-2 sm:mb-3 italic"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {t(teaching.title, locale)}
                  </h3>

                  {/* Description */}
                  <p 
                    className="text-sm sm:text-base leading-relaxed flex-1 line-clamp-3"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    {t(teaching.description, locale)}
                  </p>
                </button>

                {/* Learn More Button */}
                <Link
                  href={`/${locale}${teaching.link}`}
                  className="mt-3 sm:mt-4 mx-auto inline-flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold uppercase tracking-wide text-xs sm:text-sm text-white transition-all duration-300 hover:brightness-110 hover:scale-105"
                  style={{ 
                    backgroundColor: 'var(--color-accent)',
                    boxShadow: '0 4px 14px 0 rgba(var(--color-accent-rgb), 0.4)'
                  }}
                >
                  {locale === "en" ? "Learn More" : "और जानें"}
                </Link>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Modal - Responsive */}
      <AnimatePresence>
        {selectedTeaching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedTeaching(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedTeaching(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
                style={{ backgroundColor: '#f97316' }}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="p-6 sm:p-8 md:p-12 text-center">
                {/* Animated Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.6, delay: 0.1 }}
                  className="mb-4 sm:mb-6"
                >
                  <span className="text-6xl sm:text-7xl md:text-8xl">{selectedTeaching.icon}</span>
                </motion.div>

                {/* Animated Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="font-heading text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-6 italic"
                  style={{ color: '#f97316' }}
                >
                  {t(selectedTeaching.title, locale)}
                </motion.h2>

                {/* Animated Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="text-base sm:text-lg leading-relaxed text-justify"
                  style={{ color: 'var(--color-muted)' }}
                >
                  {t(selectedTeaching.fullDescription || selectedTeaching.description, locale)}
                </motion.p>

                {/* Learn More Link */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="mt-6 sm:mt-8"
                >
                  <Link
                    href={`/${locale}${selectedTeaching.link}`}
                    className="inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 rounded-full font-semibold uppercase tracking-wide text-sm sm:text-base text-white transition-all duration-300 hover:opacity-90 hover:scale-105"
                    style={{ backgroundColor: '#f97316' }}
                  >
                    {locale === "en" ? "Read Full Teaching" : "पूरी शिक्षा पढ़ें"}
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
