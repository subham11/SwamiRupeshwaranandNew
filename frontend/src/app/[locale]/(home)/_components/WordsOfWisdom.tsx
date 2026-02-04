"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { AppLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";
import { type QuoteItem } from "@/content/pageContent";
import { t } from "@/content/contentProvider";

// Default quotes - used as fallback when no quotes prop provided
const defaultQuotes: QuoteItem[] = [
  {
    id: "1",
    text: {
      en: "The mind is everything. What you think, you become.",
      hi: "मन ही सब कुछ है। जो सोचते हो, वही बनते हो।"
    },
    author: {
      en: "Swami Rupeshwaranand",
      hi: "स्वामी रूपेश्वरानंद"
    }
  },
  {
    id: "2",
    text: {
      en: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
      hi: "जीवन में सबसे बड़ी महिमा कभी न गिरने में नहीं, बल्कि हर बार गिरने के बाद उठने में निहित है।"
    },
    author: {
      en: "Swami Rupeshwaranand",
      hi: "स्वामी रूपेश्वरानंद"
    }
  },
  {
    id: "3",
    text: {
      en: "Serve others selflessly, for in serving humanity, we serve the divine.",
      hi: "निःस्वार्थ भाव से दूसरों की सेवा करो, क्योंकि मानवता की सेवा में ही ईश्वर की सेवा है।"
    },
    author: {
      en: "Swami Rupeshwaranand",
      hi: "स्वामी रूपेश्वरानंद"
    }
  },
  {
    id: "4",
    text: {
      en: "Peace comes not from the absence of conflict, but from within.",
      hi: "शांति संघर्ष की अनुपस्थिति से नहीं, बल्कि आंतरिक से आती है।"
    },
    author: {
      en: "Swami Rupeshwaranand",
      hi: "स्वामी रूपेश्वरानंद"
    }
  },
  {
    id: "5",
    text: {
      en: "The journey of a thousand miles begins with a single step.",
      hi: "हजार मील की यात्रा एक कदम से शुरू होती है।"
    },
    author: {
      en: "Swami Rupeshwaranand",
      hi: "स्वामी रूपेश्वरानंद"
    }
  }
];

interface WordsOfWisdomProps {
  locale: AppLocale;
  quotes?: QuoteItem[];
}

export default function WordsOfWisdom({ locale, quotes }: WordsOfWisdomProps) {
  // Use provided quotes or fall back to defaults
  const quoteList = quotes && quotes.length > 0 ? quotes : defaultQuotes;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % quoteList.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [autoplay, quoteList.length]);

  const currentQuote = quoteList[currentIndex];

  const sectionTitle = {
    en: "Words of Wisdom",
    hi: "ज्ञान के शब्द"
  };

  const sectionSubtitle = {
    en: "Daily Inspiration from Swami Ji",
    hi: "स्वामी जी से दैनिक प्रेरणा"
  };

  return (
    <section className="border-t border-zinc-100 dark:border-zinc-800 py-10 sm:py-12 md:py-14 bg-zinc-50 dark:bg-zinc-900">
      <Container>
        <div className="mb-8 sm:mb-10 md:mb-12 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">
            {t(sectionTitle, locale)}
          </h2>
          <p className="mt-2 sm:mt-3 text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
            {t(sectionSubtitle, locale)}
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <div
            className="rounded-2xl sm:rounded-3xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 sm:p-8 md:p-12 min-h-56 sm:min-h-64 md:min-h-72 flex flex-col items-center justify-center text-center cursor-pointer"
            onMouseEnter={() => setAutoplay(false)}
            onMouseLeave={() => setAutoplay(true)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-zinc-900 dark:text-zinc-100 italic">
                  &ldquo;{t(currentQuote.text, locale)}&rdquo;
                </p>
                <div className="flex items-center justify-center gap-2 text-zinc-600 dark:text-zinc-400">
                  <span>—</span>
                  <span className="font-medium">{t(currentQuote.author, locale)}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation - Responsive */}
          <div className="mt-6 sm:mt-8 flex items-center justify-center gap-2 sm:gap-3">
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + quoteList.length) % quoteList.length)}
              className="rounded-full border border-zinc-300 dark:border-zinc-600 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              aria-label="Previous quote"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex gap-1.5 sm:gap-2">
              {quoteList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 sm:h-2 rounded-full transition-all ${
                    idx === currentIndex 
                      ? "w-6 sm:w-8 bg-black dark:bg-white" 
                      : "w-1.5 sm:w-2 bg-zinc-300 dark:bg-zinc-600"
                  }`}
                  aria-label={`Go to quote ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % quoteList.length)}
              className="rounded-full border border-zinc-300 dark:border-zinc-600 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              aria-label="Next quote"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
